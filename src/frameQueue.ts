// A full period repeats both the frame positions and the project queue.
// The existing orbit clock and animations continue to move only the original frames.
export function orbitPeriod(slots:number,projects:number){
 let a=slots,b=projects;while(b){[a,b]=[b,a%b]}
 return slots*projects/a;
}
export function queuedFrames<T>(frames:T[],projects:T[]=frames,settledTurn=0):T[]{
 const slots=frames.length;
 // Replace an outgoing project only after its frame has reached the back slot.
 return frames.map((_,i)=>projects[(i+Math.max(0,Math.ceil((settledTurn-i)/slots))*slots)%projects.length]);
}
