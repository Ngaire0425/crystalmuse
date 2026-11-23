(()=>{'use strict';
let frame=null,active=false,galleryDialog=null,galleryFrame=null;
const mount=document.getElementById('studioMount'),head=document.querySelector('.site-head');
function size(){document.documentElement.style.setProperty('--studio-head-height',Math.ceil(head.getBoundingClientRect().height)+'px');}
function visibility(value){if(frame?.contentWindow)frame.contentWindow.postMessage({namespace:'crystalmuse-studio-host',type:'visibility',active:value},location.origin);}
function notify(){visibility(active);}
function openGallery(){
  if(!galleryDialog){
    galleryDialog=document.createElement('dialog');
    galleryDialog.className='community-gallery-modal';
    galleryDialog.setAttribute('aria-label','Community Gallery');
    galleryFrame=document.createElement('iframe');
    galleryFrame.title='CrystalMuse Community Gallery';
    galleryFrame.src='studio/community-gallery/index.html?from=diy';
    galleryDialog.append(galleryFrame);
    document.body.append(galleryDialog);
    galleryDialog.addEventListener('close',()=>{document.body.classList.remove('community-open');notify();});
  }
  if(!galleryDialog.open){galleryDialog.showModal();document.body.classList.add('community-open');visibility(false);}
}
function closeGallery(){if(galleryDialog?.open)galleryDialog.close();}
function route(){active=location.hash.replace(/^#\/?/,'').split('?')[0]==='diy';document.body.classList.toggle('in-diy-studio',active);if(active&&!frame){frame=document.createElement('iframe');frame.id='crystalMuseStudio';frame.title='CrystalMuse DIY Studio 手链定制';frame.src='studio/index.html?embedded=1&v=framework-studio-2';frame.addEventListener('load',notify);mount.append(frame);}size();notify();}
window.addEventListener('hashchange',()=>{closeGallery();route();});
window.addEventListener('resize',size);new ResizeObserver(size).observe(head);
window.addEventListener('message',e=>{
  if(e.origin!==location.origin)return;
  const data=e.data;
  if(!data||typeof data!=='object')return;
  if(data.namespace==='crystalmuse-studio-host'&&e.source===frame?.contentWindow){if(data.type==='ready'){document.getElementById('studioLoading').hidden=true;notify();}return;}
  if(data.namespace==='crystalmuse-community'){
    if(data.type==='open'&&e.source===frame?.contentWindow)openGallery();
    if(data.type==='close'&&e.source===galleryFrame?.contentWindow)closeGallery();
  }
});
route();
})();
