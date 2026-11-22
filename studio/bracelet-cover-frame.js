// Cover models are positioned around the ring's local origin. Accessories may
// enlarge the framing radius, but must never move its optical centre.
export function braceletCoverFrame(bounds,fovDeg,padding=1.12){
 let radius=0;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])radius=Math.max(radius,Math.hypot(x,y,z));
 return {target:[0,0,0],distance:Math.max(radius,.1)/Math.sin(fovDeg*Math.PI/360)*padding};
}

// All zodiac covers use the same projected centre-line diameter (70% of image).
// This is camera magnification only; geometry and physical dimensions stay intact.
export function braceletRingCoverFrame(trackRadius){
 if(!Number.isFinite(trackRadius)||trackRadius<=0)throw Error('手链轨道半径无效');
 return {target:[0,0,0],halfExtent:trackRadius/.7};
}
