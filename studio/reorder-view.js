// Reordering an existing item is not a command to rotate the whole bracelet.
export function stabilizeReorder(plan,oldItems,movingKey,swapKey,isMain){
 const reference=oldItems.find(x=>x.key!==movingKey&&x.key!==swapKey&&isMain(x))||oldItems.find(x=>x.key!==movingKey&&isMain(x));
 const placed=reference&&plan.find(x=>x.key===reference.key);
 if(!placed)return plan;
 const shift=Math.atan2(Math.sin(reference.angle-placed.angle),Math.cos(reference.angle-placed.angle));
 return plan.map(x=>({...x,angle:((x.angle+shift)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)}));
}
