"""Publish visual production material, never generation prompts or raw workspaces.
Reads supplied local packages; originals stay untouched. Full provenance is kept
in a local audit file, while the site receives captions and project associations.
"""
from pathlib import Path
from zipfile import ZipFile
from PIL import Image
import csv,hashlib,io,json,re,shutil,subprocess
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
HOME=Path('/Users/admin');DOWNLOADS=HOME/'Downloads'
OUT=ROOT/'public/media/process/artefacts';OUT.mkdir(parents=True,exist_ok=True)
records=[];audit=[];hashes={};unreadable=[]
PDF_TOOL=Path('/private/tmp/portfolio-pdf')
if not PDF_TOOL.exists():subprocess.run(['swiftc','-module-cache-path','/private/tmp/portfolio-swift-cache',str(ROOT/'scripts/render-production-pdf.swift'),'-o',str(PDF_TOOL)],check=True)
projects=json.loads((ROOT/'content/projects.json').read_text())
campaigns=json.loads((ROOT/'content/campaigns.json').read_text())
allassets=projects+json.loads((ROOT/'content/campaign-assets.json').read_text())
byid={p['id']:p for p in allassets}
def public_title(name):
 s=Path(name).stem
 s=re.sub(r'^(BF\d+_|PR_|WT_|HZ_|AR_|ZO_|TN_)','',s)
 return re.sub(r'[_-]+',' ',s).strip()
def add(data,source,caption,kind,ids,group):
 if not ids:return
 digest=hashlib.sha256(data).hexdigest()
 if digest in hashes:
  found=hashes[digest];found['projectIds']=list(dict.fromkeys(found['projectIds']+ids));return
 ident=hashlib.sha1((source+caption).encode()).hexdigest()[:14]
 suffix=Path(source).suffix.lower()
 full=f'{ident}.svg' if suffix=='.svg' else f'{ident}.webp'
 thumb=f'{ident}-small.webp'
 if suffix=='.svg':
  text=data.decode('utf8')
  if re.search(r'<script|<foreignObject|onload=|javascript:',text,re.I):return
  node=ET.fromstring(text);box=node.get('viewBox','').split()
  if len(box)==4:width,height=float(box[2]),float(box[3])
  else:width,height=float(re.sub('[^0-9.]','',node.get('width','1280'))),float(re.sub('[^0-9.]','',node.get('height','720')))
  (OUT/full).write_bytes(data);thumb=full
 else:
  try:
   original=Image.open(io.BytesIO(data));original.load();im=original.convert('RGBA' if original.mode in ['RGBA','LA','P'] else 'RGB')
  except (OSError,ValueError):
   unreadable.append(source);return False
  im.thumbnail((1600,2200));width,height=im.size
  if not (OUT/full).exists():im.save(OUT/full,'WEBP',quality=86,method=6)
  im.thumbnail((520,520))
  if not (OUT/thumb).exists():im.save(OUT/thumb,'WEBP',quality=78,method=6)
 record={'id':ident,'src':'media/process/artefacts/'+full,'preview':'media/process/artefacts/'+thumb,'caption':caption,'kind':kind,'group':group,'projectIds':list(dict.fromkeys(ids)),'width':width,'height':height}
 records.append(record);hashes[digest]=record;audit.append({'id':ident,'source':source,'sha256':digest});return True

def campaign_ids(cid):
 c=next(c for c in campaigns if c['id']==cid)
 return [cid]+[p for s in c['sections'] for p in s['projectIds']]
BF=list(csv.DictReader((DOWNLOADS/'BuzzFeed/Registers/Film_and_Source_Register.csv').open()))
bf_by_code={r['code']:r['id'] for r in BF};bf_ids=[r['id'] for r in BF]+['campaign-pero-like','campaign-cocoa-butter','campaign-a-pop','campaign-tasty']
for filename in ['BuzzFeed_Production_Package_Final_Clean.zip','TruNativ_Production_Package_Final.zip','Aarti_Sorted_Production_Package_Final.zip','Hizzouse_Production_Package_Final.zip','Win_Theory_Production_Package_Final.zip','Product_Report_Production_Package_Final.zip']:
 with ZipFile(DOWNLOADS/filename) as z:
  names=z.namelist();png_stems={Path(n).stem for n in names if n.endswith('.png')}
  for name in names:
   suffix=Path(name).suffix.lower()
   if suffix not in ['.png','.jpg','.jpeg','.svg']:continue
   if any(s in name for s in ['Published_Covers','Official_Thumbnail','Thumbnail_Route','Avatar_Cover']):continue
   if suffix=='.svg' and Path(name).stem in png_stems:continue
   group='';ids=[];kind='Design system';caption=public_title(name)
   if name.startswith('BuzzFeed/'):
    group='BuzzFeed';match=re.search(r'(BF\d+)_Board_(\d+)',name)
    if match:
     code,number=match.groups();ids=[bf_by_code[code]];kind='Editorial board';caption=f'Editorial sequence · {int(number):02d}'
    elif 'Graphics_Masters' in name or 'Identity' in name:ids=bf_ids;kind='Channel graphics'
   elif name.startswith('TruNativ/'):
    group='TruNativ';base=Path(name).name
    # Every artefact belongs to the collection; individual films get their matching work.
    ids=['campaign-trunativ']
    if any(t in name for t in ['MC_','Collagen','collagen']):
     ids+=['brands-03']+[p['id'] for p in allassets if 'collagen' in (p.get('title','')+' '+p.get('description','')).lower()]
    elif any(t in name for t in ['SW_','Sweet_Planning','Everyday_Sweet_Film']):ids+=['campaign-film-everyday-sweet']
    elif any(t in name for t in ['FI_','FR_','Fiber','fiber']):ids+=['brands-04']
    elif 'AL_' in name:ids+=[p['id'] for p in allassets if 'alanna' in p.get('title','').lower()]
    else:ids+=['brands-03','brands-04','brands-05','brands-06','campaign-film-everyday-sweet','nutrition-magnified-bento','nutrition-magnified-food-scandals','nutrition-magnified-momo']
    kind='Storyboard' if any(t in name for t in ['Planning','_Shot_']) else 'Packaging & identity' if any(t in name for t in ['Pack','Carton','Range','Wordmark']) else 'Motion & design'
   elif name.startswith('Aarti_Sorted/'):
    group='Sorted';kind='Storyboard' if 'Planning' in name else 'Brand & motion'
    ids=['campaign-sorted-girl','social-short-format-04','social-short-format-07','social-short-format-08','social-short-format-09','social-short-format-10']
    if 'Sorted_Official' in name:ids=['campaign-sorted-consultancy','social-short-format-03']
    elif any(t in name for t in ['Zoho','ZO_']):ids=['campaign-sorted-girl','social-short-format-08']
   elif name.startswith('Hizzouse/'):
    group='Hizzouse';ids=campaign_ids('campaign-hizzouse');kind='Motion system' if 'Templates' in name else 'Graphics storyboard'
   elif name.startswith('Win_Theory/'):
    group='Win Theory';ids=['ai-eric-schiffer','campaign-win-theory'];kind='Character direction' if 'Figure_Look' in name else 'Visual direction' if 'Concept_Direction' in name else 'Motion system'
   elif name.startswith('Product_Report/'):
    group='The Product Report';ids=['ai-sheldon','campaign-product-report'];kind='Shot planning' if 'Setup_Drawings' in name else 'Evidence graphics' if 'Oil_Graphic' in name else 'Show identity'
   if ids:
    valid=add(z.read(name),filename+'::'+name,caption,kind,ids,group)
    alternative=str(Path(name).with_suffix('.svg'))
    if valid is False and alternative in names:add(z.read(alternative),filename+'::'+alternative,caption,kind,ids,group)

# Actual Pisa character references recovered from the original production history.
pisa=Path('/private/tmp/portfolio-pisa-artefacts')
for name,caption in [('e34e961a-2075-49af-ae8d-d9373421eb62.png','The mayor · costume and character reference'),('33176311-aab4-43da-accb-eed11488537a.png','The mayor · photographic character direction'),('55ca7963-1f8d-45a3-b2f6-6a28863537bb.png','The mayor · character turnaround study')]:
 if (pisa/name).exists():add((pisa/name).read_bytes(),'Pisa production/'+name,caption,'Character design',['ai-original-ad'],'Koi nahi aaya')
for name,caption in [('edit_strip.png','The film’s sequence and visual rhythm')]:
 p=HOME/'AgentWorkspace/ProductionKit/projects/2026-11_Pisa_Mayor/reports'/name
 if p.exists():add(p.read_bytes(),str(p),caption,'Edit study',['ai-original-ad'],'Koi nahi aaya')

# Deck pages with public-facing strategy and visuals; private repair recipes are excluded.
pdf=HOME/'AgentWorkspace/ProductionKit/projects/2026-11_Kofuku_Production_Note/deck/Kofuku_Production_Deck_PrantikDutta.pdf'
public_pages={3:'The brand and the communication problem',6:'Two audiences, one campaign',7:'The Report · story structure',8:'The cast as a competitive map',9:'Escalation and cultural familiarity',10:'Where the brand enters the story',11:'Character and world direction',15:'The Stranger’s Email · story and hook research',16:'The illustrated world and camera movement',17:'Placing the brand through the sequence',20:'The code-built campaign end slate',21:'Creative strategy through final delivery'}
for page,caption in public_pages.items():
 path=Path('/private/tmp')/f'portfolio-kofuku-page-{page}.png'
 subprocess.run([str(PDF_TOOL),'render',str(pdf),str(page),str(path)],check=True)
 ids=['ai-kofuku-the-report'] if 7<=page<=11 else ['ai-kofuku-strangers-email'] if 15<=page<=17 else ['ai-kofuku-the-report','ai-kofuku-strangers-email']
 add(path.read_bytes(),str(pdf)+'#page='+str(page),caption,'Production deck',ids,'Kofuku')
# Individual approved film frames are pre-production references, separate from the film poster.
frames=HOME/'AgentWorkspace/ProductionKit/projects/2026-11_Kofuku_Production_Note/deck/img'
for n,caption in [(0,'The doctor and the unanswered question'),(3,'The society uncle · regional character direction'),(6,'The barber · casting and setting'),(5,'The astrologer · character direction'),(11,'The girl · a change in the film’s emotional register'),(13,'The code-built forum UI'),(14,'The campaign end slate')]:
 p=frames/f'a1_{n:02d}.jpg'
 if p.exists():add(p.read_bytes(),str(p),caption,'Character & shot direction',['ai-kofuku-the-report'],'Kofuku')
for n,caption in [(2,'A continuous camera move through the story'),(4,'The consultation · illustrated performance'),(5,'The hospital · a change of place'),(6,'Care becomes the visual payoff'),(8,'The forum UI inside the illustrated world'),(9,'The shared campaign end slate')]:
 p=frames/f'a2_{n:02d}.jpg'
 if p.exists():add(p.read_bytes(),str(p),caption,'Animation direction',['ai-kofuku-strangers-email'],'Kofuku')

(ROOT/'content/process-artefacts.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
Path('/private/tmp/portfolio-artefact-provenance.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'artefacts':len(records),'groups':{g:sum(r['group']==g for r in records) for g in sorted({r['group'] for r in records})},'files':len(list(OUT.iterdir())),'bytes':sum(p.stat().st_size for p in OUT.iterdir()),'unreadable':unreadable}))
