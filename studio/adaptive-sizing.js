import {layout,normalizeAngle} from './engine.js';
const TAU=2*Math.PI;
export function adaptivePlan(items,catalog,cfg,myWristMm){
 const max=cfg.commerce.maxItems??100;if(items.length>max)throw Error(`为保持操作流畅，最多添加${max}颗／件`);
 const specs=items.map(it=>{const s=catalog.find(s=>s.id===it.id);if(!s)throw Error('该素材暂不可用');return s});
 const half=s=>(s.category==='crystal'||s.collisionShape==='sphere')?s.collisionRadiusMm:s.radialWidthMm/2;
 const maxHalf=specs.length?Math.max(...specs.map(half)):cfg.commerce.emptyBeadDiameterMm/2;
 const extent=Math.max(6,...specs.map(s=>Math.hypot(s.occupancyMm,s.radialWidthMm)/2))+1;
 const gap=cfg.commerce.packingGapMm??cfg.gapMm,anchor=cfg.commerce.anchorAngle;
 function config(R){return {...cfg,gapMm:gap,tray:{...cfg.tray,trackRadiusMm:R,innerBoundaryMm:Math.max(.00001,R-extent),outerBoundaryMm:R+extent,outerDiameterMm:2*(R+extent+1),trackCenterMm:[0,0]}};}
 function separation(a,b,R,c){
  if((a.category==='crystal'||a.collisionShape==='sphere')&&(b.category==='crystal'||b.collisionShape==='sphere')){const q=(a.collisionRadiusMm+b.collisionRadiusMm+gap)/(2*R);if(q>=1)return Infinity;return 2*Math.asin(q)+.000002;}
  const pair=[{id:a.id,key:'a',angle:0},{id:b.id,key:'b',angle:Math.PI}];
  try{layout(pair,catalog,c)}catch{return Infinity;}
  let lo=0,hi=Math.PI;for(let k=0;k<20;k++){const mid=(lo+hi)/2;pair[1].angle=mid;try{layout(pair,catalog,c);hi=mid}catch{lo=mid;}}
  return hi+.000002;
 }
 function at(R){const c=config(R),steps=specs.map((s,i)=>separation(s,specs[(i+1)%specs.length],R,c));if(steps.reduce((a,b)=>a+b,0)>TAU-.000001)throw Error('当前半径无法容纳');let angle=anchor;const placed=items.map((it,i)=>{if(i)angle+=steps[i-1];return {...it,angle:normalizeAngle(angle)}});const checked=layout(placed,catalog,c);return {items:placed,gapMm:gap,tray:c.tray,usedRatio:checked.usedMm/checked.capacityMm,wristMm:myWristMm,estimated:true,allowancePending:cfg.commerce.allowanceMm===null};}
 if(items.length<3){const R=Math.max(cfg.commerce.minimumTrackRadiusMm??0,extent+1,(cfg.commerce.displayReferenceWristMm??160)/(TAU)+maxHalf);if(!items.length)return {items:[],gapMm:gap,tray:config(R).tray,wristMm:myWristMm,estimated:true};return at(R);}
 const minimum=cfg.commerce.minimumTrackRadiusMm??0;
 if(minimum>0){try{return at(Math.max(minimum,maxHalf+.0001))}catch{}}
 let lo=Math.max(maxHalf+.0001,minimum),hi=Math.max(lo,12,specs.reduce((n,s)=>n+Math.max(s.occupancyMm,s.radialWidthMm),0)/TAU+maxHalf),best;
 for(let k=0;k<16;k++){try{best=at(hi);break}catch{hi*=1.5;}}
 if(!best)throw Error('当前异形配件无法形成无碰撞排列，请调整搭配');
 for(let k=0;k<20;k++){const mid=(lo+hi)/2;try{best=at(mid);hi=mid}catch{lo=mid;}}
 return best;
}
export function fitSummary(items,catalog,cfg,myWristMm){
 const specs=items.map(it=>catalog.find(s=>s.id===it.id)).filter(s=>s&&s.category!=='pendant');
 if(specs.length<3)return {estimatedMm:null,status:'珠子较少，请继续添加后查看预计手围'};
 const half=Math.max(...specs.map(s=>(s.category==='crystal'||s.collisionShape==='sphere')?s.collisionRadiusMm:s.radialWidthMm/2));
 const estimatedMm=Math.max(0,(cfg.tray.trackRadiusMm-half)*2*Math.PI-(cfg.commerce.allowanceMm??0));
 const delta=myWristMm==null?null:estimatedMm-myWristMm,tolerance=cfg.commerce.fitToleranceMm??5;
 return {estimatedMm,delta,status:delta===null?'填写“我的手围”可比较大小':delta>tolerance?'当前搭配偏大，可减少珠子':delta< -tolerance?'当前搭配偏小，可继续加珠':'预计接近我的手围'};
}
