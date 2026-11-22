// Equalise names within each visible grid row, without reserving two lines everywhere.
export function setupProductAlignment(root){
 let frame;
 function align(){
  frame=null;
  const cards=[...root.querySelectorAll('.product-card')],rows=new Map();
  const names=cards.map(card=>card.querySelector('.product-add strong'));
  names.forEach(name=>name.style.minHeight='0px');
  const top=root.getBoundingClientRect().top;
  for(let i=0;i<cards.length;i++){
   const rect=cards[i].getBoundingClientRect();if(!rect.width)continue;
   const key=Math.round(rect.top-top),row=rows.get(key)||[];
   row.push({name:names[i],height:names[i].getBoundingClientRect().height});rows.set(key,row);
  }
  for(const row of rows.values()){
   const height=Math.max(...row.map(x=>x.height));
   row.forEach(({name})=>name.style.minHeight=height+'px');
  }
 }
 const schedule=()=>{if(frame==null)frame=requestAnimationFrame(align);};
 new ResizeObserver(schedule).observe(root);
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true});
 document.fonts?.ready.then(schedule);document.fonts?.addEventListener('loadingdone',schedule);
 schedule();
}
