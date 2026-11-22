import {commercePlan as pack} from './packing.js';
import {normalizeAngle as norm} from './engine.js';
import {fitSummary as summarizeNatural} from './adaptive-sizing.js';
// Editor track never contracts after an edit. Natural sizing and covers stay independent.
export function editorPlan(all,catalog,cfg,wrist){return commercePlan(all,catalog,{...cfg,commerce:{...cfg.commerce,minimumTrackRadiusMm:Math.max(cfg.commerce.editorMinTrackRadiusMm??32.4,cfg.tray.trackRadiusMm)}},wrist);}
export function editorFitSummary(all,catalog,cfg,wrist){const n=naturalPlan(all,catalog,{...cfg,commerce:{...cfg.commerce,minimumTrackRadiusMm:0}},wrist);return summarizeNatural(all,catalog,n?{...cfg,tray:n.tray}:cfg,wrist);}
export {circularOrder,insertOrdered} from './packing.js';
const distance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
export function commercePlan(all,catalog,cfg,wrist){
 const mains=all.filter(x=>catalog.find(s=>s.id===x.id)?.category!=='pendant'),hanging=all.filter(x=>catalog.find(s=>s.id===x.id)?.category==='pendant');
 if(hanging.length&&mains.length<2)throw Error('Please keep at least two beadsmain beads, reattachCharms');
 const valid=mains.slice(0,-1); // The last bead borders the unfinished gap, not a completed bead-to-bead join.
 const attachments=hanging.map(a=>{const old=valid.find(x=>x.key===a.afterKey);const left=old||valid.reduce((best,x)=>distance(x.angle,a.angle)<distance(best.angle,a.angle)?x:best,valid[0]);return {...a,afterKey:left.key,orientation:'outward'}});
 const specs=catalog.map(s=>s.category==='pendant'?{...s,occupancyMm:cfg.attachments?.wireThicknessMm??.36,radialWidthMm:1.8,bodyWidthMm:undefined,outwardLengthMm:undefined}:s);
 const thread=mains.flatMap(x=>[x,...attachments.filter(a=>a.afterKey===x.key)]);
 const anchor=mains[0]?.angle??cfg.commerce.anchorAngle;
 const p=pack(thread,specs,{...cfg,commerce:{...cfg.commerce,anchorAngle:anchor}},wrist);
 // Bodies hang beyond the outside of the adjacent main beads; only wire consumes string length.
 const maxHalf=Math.max(1,...mains.map(x=>{const s=catalog.find(s=>s.id===x.id);return s.radialWidthMm/2}));
 p.items=p.items.map(x=>{const a=attachments.find(a=>a.key===x.key);return a?{...x,afterKey:a.afterKey,orientation:'outward',radialOffsetMm:maxHalf+1}:x});
 const bodies=p.items.filter(x=>attachments.some(a=>a.key===x.key));
 for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){const a=bodies[i],b=bodies[j],sa=catalog.find(s=>s.id===a.id),sb=catalog.find(s=>s.id===b.id);if(2*(p.tray.trackRadiusMm+maxHalf+4)*Math.sin(distance(a.angle,b.angle)/2)<(sa.bodyWidthMm+sb.bodyWidthMm)/2)throw Error('Two charms are too close together; choose another space between beads');}
 p.tray.outerBoundaryMm+=Math.max(0,...bodies.map(a=>catalog.find(s=>s.id===a.id).outwardLengthMm+maxHalf));
 p.tray.outerDiameterMm=2*(p.tray.outerBoundaryMm+1);
 return p;
}
export function naturalPlan(all,catalog,cfg,wrist){if(cfg.commerce.autoExpand){if(all.filter(x=>catalog.find(s=>s.id===x.id)?.category!=='pendant').length<3)return null;const p=commercePlan(all,catalog,cfg,wrist),half=Math.max(...all.filter(x=>catalog.find(s=>s.id===x.id)?.category!=='pendant').map(x=>catalog.find(s=>s.id===x.id).radialWidthMm/2));return {...p,estimatedWristMm:Math.max(0,(p.tray.trackRadiusMm-half)*2*Math.PI-(cfg.commerce.allowanceMm??0))}}
 const n=all.filter(x=>catalog.find(s=>s.id===x.id)?.category!=='pendant').length;if(n<3)return null;
 let lo=1,hi=Math.max(1000,wrist*2),best;
 for(let i=0;i<18;i++){const mid=(lo+hi)/2;try{best=commercePlan(all,catalog,cfg,mid);hi=mid}catch{lo=mid}}
 best=commercePlan(all,catalog,cfg,hi+.05);return {...best,estimatedWristMm:hi};
}
