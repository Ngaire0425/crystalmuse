export function customerFitFeedback(fit,wristMm){
 if(fit.estimatedMm==null)return {status:'Add at least 3 beads to estimate wrist fit.',advice:''};
 if(wristMm==null)return {status:'Estimated from your current design. Keep customising.',advice:'Enter your wrist size to compare the fit.'};
 const delta=fit.estimatedMm-wristMm,diff=(Math.abs(delta)/10).toFixed(1);
 if(fit.status.includes('runs large'))return {status:'Larger than your wrist by approx.'+diff+' cm',advice:'Remove beads or choose smaller sizes.'};
 if(fit.status.includes('runs small'))return {status:'Smaller than your wrist by approx.'+diff+' cm',advice:'Add beads or choose larger sizes.'};
 return {status:'Estimated to fit your wrist',advice:'Estimated fit; final comfort may vary.'};
}
export function setupShoppingUX(){
 const $=id=>document.getElementById(id),body=document.body,buttons=[...document.querySelectorAll('[data-drawer-state]')];let state='collapsed';
 const set=value=>{state=value;body.dataset.drawer=value;body.classList.toggle('drawer-open',value!=='collapsed');buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.drawerState===value)));$('drawerToggle').setAttribute('aria-expanded',String(value!=='collapsed'));$('drawerToggle').textContent=value==='collapsed'?'Choose Beads ↑':'View bracelet ↓';if(value!=='collapsed')$('priceDetails').open=false;};
 buttons.forEach(b=>b.onclick=()=>set(b.dataset.drawerState));$('drawerToggle').onclick=()=>set(state==='collapsed'?'half':'collapsed');
 const size=()=>{body.style.setProperty('--price-panel-height',Math.ceil(document.querySelector('.price-summary').getBoundingClientRect().height)+'px');};new ResizeObserver(size).observe(document.querySelector('.price-summary'));size();set('collapsed');
 const controls=document.querySelector('.drawer-states'),library=$('library');
 const query=matchMedia('(max-width:1100px)');function responsive(){const collapsed=query.matches&&state==='collapsed';document.querySelector('.library-tools').inert=collapsed;library.inert=collapsed;document.querySelector('.browse').inert=collapsed;controls.inert=!query.matches;}query.addEventListener('change',responsive);buttons.forEach(b=>b.addEventListener('click',responsive));$('drawerToggle').addEventListener('click',responsive);responsive();
 return {setDrawer(value){set(value);responsive();}};
}
