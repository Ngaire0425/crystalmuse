import {commercePlan} from './attachments.js';
import {fitSummary} from './adaptive-sizing.js';
import {calculateQuote} from './pricing.js';
export function generateZodiacRecommendations(catalog,products,cfg,pricing,inventory,prefs,zodiacs){
 if(!prefs.zodiac)throw Error('Choose a zodiac sign');
 const theme=zodiacs.themes.find(t=>t.id===prefs.zodiac);if(!theme)throw Error('Choose a valid zodiac sign');
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
  if(missing.size)warnings.unshift('reference adaptation · not added yet: '+[...missing].map(([token,n])=>token+' × '+n).join(', '));
  if(plan.items.some(it=>!Number.isInteger(stocks[it.id]?.quantity)))warnings.push('some stock pending maker confirmation');
  if(quote.totalMinor===null)warnings.push('some Price pending, price pending maker confirmation');
  if(theme.designNote)warnings.push(theme.designNote);
  warnings.push('Design from available beads, beads were not auto-adjusted to the wrist size; can be addedDIYkeep adjusting. Zodiac colours are only for Shapeinspiration. ');
  first={name:theme.name+(missing.size?' · themed reference adaptation':' · Zodiac theme'),reason:theme.description||theme.sign+'Themed pairing, can be addedDIYkeep adjusting. ',palette:theme.palette,items:plan.items,fit,quote,warnings,wristMm:prefs.wristMm,budgetMinor:budget,missing:[...missing].map(([name,quantity])=>({name,quantity})),referenceRecipe:theme.recipe,zodiac:theme.id};
 }else first={name:theme.name+' · Zodiac theme',reason:'this themeBeadsstill incomplete, usable once completed. ',unavailable:true,warnings:['not added yet: '+[...missing].map(([token,n])=>token+' × '+n).join(', ')],items:[],zodiac:theme.id};
 const missingMain=[...missing].filter(([name])=>{const spec=lookup.get(zodiacs.mapping[name]?.id);return spec?spec.category!=='pendant'&&spec.kind!=='spacer':!name.includes('spacer')&&!name.includes('Charms');}).map(([name,quantity])=>({name,quantity}));
 if(missingMain.length){first.unavailable=true;first.missingMain=missingMain;first.name=theme.name+' · Beadsincomplete';first.reason='the main beads for this design are incomplete, available once the set is complete. ';}
 return [first];
}
