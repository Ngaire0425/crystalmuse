import {commercePlan} from './attachments.js';
import {fitSummary} from './adaptive-sizing.js';
import {calculateQuote} from './pricing.js';
export function generateZodiacRecommendations(catalog,products,cfg,pricing,inventory,prefs,zodiacs){
 if(!prefs.zodiac)throw Error('请选择星座');
 const theme=zodiacs.themes.find(t=>t.id===prefs.zodiac);if(!theme)throw Error('请选择有效星座');
 const stocks=inventory?.items||{},used=new Map(),missing=new Map(),notes=new Set(),items=[];const lookup=new Map(catalog.map(s=>[s.id,s]));
 for(const [i,token] of theme.recipe.entries()){
  const mapping=zodiacs.mapping[token],spec=lookup.get(mapping?.id),entry=stocks[mapping?.id];
  const available=spec&&products.products[spec.id]?.enabled!==false&&entry?.available!==false&&entry?.quantity!==0&&(!Number.isInteger(entry?.quantity)||(used.get(spec.id)||0)<entry.quantity);
  if(!available){missing.set(token,(missing.get(token)||0)+1);continue;}
  if(mapping.note)notes.add(mapping.note);used.set(spec.id,(used.get(spec.id)||0)+1);const item={id:spec.id,key:theme.id+'-theme-'+i,angle:i*.1};if(spec.category==='pendant')item.afterKey=items.filter(x=>lookup.get(x.id).category!=='pendant').at(-1)?.key;items.push(item);
 }
 const mains=items.filter(x=>lookup.get(x.id).category!=='pendant');
 const budget=null;
 let first;
 if(mains.length>=3&&items.length<=(cfg.commerce.maxItems??100)){
  const plan=commercePlan(items,catalog,cfg,prefs.wristMm),fit=fitSummary(plan.items,catalog,{...cfg,tray:plan.tray},prefs.wristMm),quote=calculateQuote(plan.items,pricing),warnings=[...notes];
  if(missing.size)warnings.unshift('参考改编 · 当前未加入：'+[...missing].map(([token,n])=>token+' × '+n).join('、'));
  if(plan.items.some(it=>!Number.isInteger(stocks[it.id]?.quantity)))warnings.push('部分库存待商家确认');
  if(quote.totalMinor===null)warnings.push('部分单价待定，价格待商家确认');
  if(theme.designNote)warnings.push(theme.designNote);
  warnings.push('按现有素材设计，未按手围自动增减珠子；可放入DIY继续调整。星座仅作配色与造型灵感。');
  first={name:theme.name+(missing.size?' · 主题参考改编':' · 星座主题款'),reason:theme.description||theme.sign+'主题搭配，可放入DIY继续调整。',palette:theme.palette,items:plan.items,fit,quote,warnings,wristMm:prefs.wristMm,budgetMinor:budget,missing:[...missing].map(([name,quantity])=>({name,quantity})),referenceRecipe:theme.recipe,zodiac:theme.id};
 }else first={name:theme.name+' · 星座主题款',reason:'该主题主珠暂未齐，待补齐后可使用。',unavailable:true,warnings:['当前未加入：'+[...missing].map(([token,n])=>token+' × '+n).join('、')],items:[],zodiac:theme.id};
 const missingMain=[...missing].filter(([name])=>{const spec=lookup.get(zodiacs.mapping[name]?.id);return spec?spec.category!=='pendant'&&spec.kind!=='spacer':!name.includes('隔珠')&&!name.includes('吊坠');}).map(([name,quantity])=>({name,quantity}));
 if(missingMain.length){first.unavailable=true;first.missingMain=missingMain;first.name=theme.name+' · 主珠待补齐';first.reason='这套设计的主要用料暂未齐，补齐后再开放使用。';}
 return [first];
}
