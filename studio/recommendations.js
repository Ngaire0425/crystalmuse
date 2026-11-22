import {commercePlan} from './attachments.js';
import {fitSummary} from './adaptive-sizing.js';
import {calculateQuote} from './pricing.js';
export function generateRecommendations(catalog,products,cfg,pricing,inventory,prefs){
 const stock=inventory?.items||{},liked=prefs.colors?.length?prefs.colors:['blue','white'];
 const available=s=>products.products[s.id]?.enabled!==false&&stock[s.id]?.available!==false&&stock[s.id]?.quantity!==0;
 const knownPrice=s=>{const n=pricing.unitPricesMinor?.[s.id];return Number.isSafeInteger(n)&&n>=0?n:null};
 const colorMatch=s=>products.products[s.id].colors.some(c=>liked.includes(c));
 const clear=s=>['ice','high','transparent'].includes(products.products[s.id].style);
 const mains=catalog.filter(s=>s.category==='crystal'&&products.products[s.id]?.usage==='crystal'&&available(s));
 if(!mains.length)throw Error('当前没有可用的主珠，请稍后重试');
 const score=s=>(colorMatch(s)?100:0)+(clear(s)?12:0)-(products.products[s.id].sortOrder||0)/10000;
 const pool=mains.slice().sort((a,b)=>score(b)-score(a)||(knownPrice(a)??Infinity)-(knownPrice(b)??Infinity));
 const preferred=pool.filter(colorMatch),source=preferred.length?preferred:pool;
 const metals=catalog.filter(s=>s.category==='spacer'&&products.products[s.id]?.material==='metal'&&available(s)).sort((a,b)=>a.occupancyMm-b.occupancyMm||a.id.localeCompare(b.id));
 const target=prefs.wristMm??cfg.recommendations.referenceWristMm,max=Math.min(cfg.recommendations.maxItems??48,cfg.commerce.maxItems??100);
 return [0,1,2].map(mode=>{
  let choices;
  if(mode===0){const first=source.find(clear)||source[0],color=products.products[first.id].colors.find(c=>liked.includes(c))||products.products[first.id].colors[0];choices=[first,...source.filter(s=>s.id!==first.id&&products.products[s.id].colors.includes(color))].slice(0,prefs.style==='rich'?2:1);}
  else {choices=[];for(const color of liked){const s=source.find(s=>products.products[s.id].colors.includes(color)&&!choices.includes(s));if(s)choices.push(s);}for(const s of source)if(choices.length<(prefs.style==='rich'?4:2)&&!choices.includes(s))choices.push(s);choices=choices.slice(0,prefs.style==='rich'?4:2);}
  const metal=mode===2?metals.find(s=>s.id.endsWith(liked.some(c=>['yellow','orange','red','brown'].includes(c))?'-gold':'-silver'))||metals[0]:null;
  function sequence(n){const used=new Map(),list=[];for(let i=0;i<n;i++){const gradient=Math.min(i,n-1-i)/Math.max(1,(n-1)/2),index=mode===0?i%choices.length:Math.min(choices.length-1,Math.floor(gradient*choices.length));const preferred=(metal&&(i===Math.floor(n*.25)||i===Math.floor(n*.75)))?metal:choices[index];
    const canUse=s=>available(s)&&(!Number.isInteger(stock[s.id]?.quantity)||(used.get(s.id)||0)<stock[s.id].quantity);
    const spec=[preferred,...choices,...source].find(canUse);if(!spec)break;used.set(spec.id,(used.get(spec.id)||0)+1);list.push({id:spec.id,key:'recommend-'+mode+'-'+i,angle:0});}return list;}
  const mean=choices.reduce((sum,s)=>sum+s.occupancyMm,0)/choices.length,guess=Math.max(3,Math.min(max,Math.round((target+Math.PI*mean)/mean)));let best=null;
  for(let n=Math.max(3,guess-3);n<=Math.min(max,guess+3);n++){const list=sequence(n);if(list.length<3)continue;try{const plan=commercePlan(list,catalog,cfg,prefs.wristMm),fit=fitSummary(plan.items,catalog,{...cfg,tray:plan.tray},prefs.wristMm),error=Math.abs(fit.estimatedMm-target);if(!best||error<best.error)best={items:plan.items,fit,error};}catch{}}
  if(!best)throw Error('当前库存或配件暂不能组成完整方案，请换一种颜色');
  let quote=calculateQuote(best.items,pricing),budgetAdjusted=false;
  while(prefs.budgetMinor!=null&&quote.knownMinor>prefs.budgetMinor&&best.items.length>3){const list=best.items.slice(0,-1),plan=commercePlan(list,catalog,cfg,prefs.wristMm);best={items:plan.items,fit:fitSummary(plan.items,catalog,{...cfg,tray:plan.tray},prefs.wristMm)};quote=calculateQuote(best.items,pricing);budgetAdjusted=true;}
  const unknownStock=best.items.some(it=>!Number.isInteger(stock[it.id]?.quantity));
  const warnings=[];if(!preferred.length)warnings.push('偏好颜色暂无可用主珠，展示相近替代方案');if(!prefs.wristMm)warnings.push(`未填手围，先按${(target/10).toFixed(1)}cm参考生成`);
  if(unknownStock)warnings.push('部分库存待商家确认');if(quote.totalMinor===null)warnings.push(prefs.budgetMinor!=null?'部分单价待定，暂不能保证符合预算':'部分单价待定，价格待商家确认');
  if(budgetAdjusted)warnings.push('已按已知价格缩减数量，请核对预计手围');if(prefs.budgetMinor!=null&&quote.knownMinor>prefs.budgetMinor)warnings.push('现有已知价格超出预算，暂无法同时满足条件');
  return {name:mode===0?(choices.every(clear)?'清透同色系':'同色系搭配'):mode===1?'柔和渐变':metal?'少量金属点缀':'简约双色',reason:mode===0?'减少颜色跳跃，用同色系突出素材本身。':mode===1?'沿圆周对称过渡，让相近或喜欢的颜色自然衔接。':metal?'以主珠为主体，少量金属隔珠增加节奏。':'用少量双色形成清爽的搭配。',items:best.items,fit:best.fit,quote,warnings,wristMm:prefs.wristMm,budgetMinor:prefs.budgetMinor};
 });
}
