// A bounded Hermite curve preserves speed when another deliberate gesture arrives.
// One scroll-position write per frame; no competing browser smooth-scroll easing.
export class SceneTransition {
 position=0;target=0;velocity=0;moving=false;
 private from=0;private speed=0;private started=0;private duration=560;
 reset(position:number){this.position=this.target=this.from=position;this.velocity=this.speed=0;this.moving=false}
 move(target:number,time:number){
  this.sample(time);
  if(target===this.target&&this.moving)return;
  this.from=this.position;this.target=target;this.started=time;
  const distance=target-this.from;
  this.duration=Math.min(800,400+Math.sqrt(Math.abs(distance))*160);
  this.speed=Math.sign(distance)*Math.min(Math.max(0,this.velocity*Math.sign(distance)),3*Math.abs(distance)/this.duration);
  this.moving=Math.abs(distance)>.00001;
 }
 sample(time:number){
  if(!this.moving)return this.position;
  const u=Math.max(0,Math.min(1,(time-this.started)/this.duration)),d=this.target-this.from;
  this.position=this.from+d*(3*u*u-2*u*u*u)+this.speed*this.duration*(u*u*u-2*u*u+u);
  this.velocity=(d*(6*u-6*u*u)/this.duration)+this.speed*(3*u*u-4*u+1);
  if(u===1){this.position=this.target;this.velocity=0;this.moving=false}
  return this.position;
 }
}
