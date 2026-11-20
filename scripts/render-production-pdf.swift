import Foundation
import PDFKit
import AppKit
let args=CommandLine.arguments
if args.count<3{exit(1)}
let path=args[2]
guard let doc=PDFDocument(url:URL(fileURLWithPath:path)) else {exit(2)}
if args[1]=="text" {
 var pages:[[String:Any]]=[]
 for index in 0..<doc.pageCount {pages.append(["page":index+1,"text":doc.page(at:index)?.string ?? ""])}
 let data=try JSONSerialization.data(withJSONObject:pages,options:[.sortedKeys]);FileHandle.standardOutput.write(data)
} else if args[1]=="render" && args.count>4 {
 let index=Int(args[3])!-1
 guard let page=doc.page(at:index) else {exit(3)}
 let rect=page.bounds(for:.mediaBox),width:CGFloat=1500
 let image=page.thumbnail(of:NSSize(width:width,height:width*rect.height/rect.width),for:.mediaBox)
 guard let data=image.tiffRepresentation,let bitmap=NSBitmapImageRep(data:data),let png=bitmap.representation(using:.png,properties:[:]) else {exit(4)}
 try png.write(to:URL(fileURLWithPath:args[4]))
}
