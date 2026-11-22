export function customerFitFeedback(fit,wristMm){
 if(fit.estimatedMm==null)return {status:'添加至少3颗主线珠子后，显示预计适合手围。',advice:''};
 if(wristMm==null)return {status:'按当前搭配估算，可继续调整。',advice:'展开“比较我的手围”，可查看偏大或偏小。'};
 const delta=fit.estimatedMm-wristMm,diff=(Math.abs(delta)/10).toFixed(1);
 if(fit.status.includes('偏大'))return {status:'比我的手围大约 '+diff+' cm',advice:'可尝试减少珠子，或将部分珠子换小；修改后重新比较。'};
 if(fit.status.includes('偏小'))return {status:'比我的手围小约 '+diff+' cm',advice:'可尝试增加珠子，或将部分珠子换大；修改后重新比较。'};
 return {status:'预计接近我的手围',advice:'这是尺寸估算，实际佩戴松紧及制作余量仍需确认。'};
}
export function setupShoppingUX(){
 const $=id=>document.getElementById(id),body=document.body,buttons=[...document.querySelectorAll('[data-drawer-state]')];let state='collapsed';
 const set=value=>{state=value;body.dataset.drawer=value;body.classList.toggle('drawer-open',value!=='collapsed');buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.drawerState===value)));$('drawerToggle').setAttribute('aria-expanded',String(value!=='collapsed'));$('drawerToggle').textContent=value==='collapsed'?'挑选珠子 ↑':'查看手链 ↓';if(value!=='collapsed')$('priceDetails').open=false;};
 buttons.forEach(b=>b.onclick=()=>set(b.dataset.drawerState));$('drawerToggle').onclick=()=>set(state==='collapsed'?'half':'collapsed');
 const size=()=>{body.style.setProperty('--price-panel-height',Math.ceil(document.querySelector('.price-summary').getBoundingClientRect().height)+'px');};new ResizeObserver(size).observe(document.querySelector('.price-summary'));size();set('collapsed');
 const controls=document.querySelector('.drawer-states'),library=$('library');
 const query=matchMedia('(max-width:1100px)');function responsive(){const collapsed=query.matches&&state==='collapsed';document.querySelector('.library-tools').inert=collapsed;library.inert=collapsed;document.querySelector('.browse').inert=collapsed;controls.inert=!query.matches;}query.addEventListener('change',responsive);buttons.forEach(b=>b.addEventListener('click',responsive));$('drawerToggle').addEventListener('click',responsive);responsive();
 return {setDrawer(value){set(value);responsive();}};
}
