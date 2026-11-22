(()=>{
 const embedded=new URLSearchParams(location.search).has('embedded')&&parent!==window;
 let dialog,frame;
 function studio(){return document.getElementById('crystalMuseStudio');}
 function visibility(active){studio()?.contentWindow.postMessage({namespace:'crystalmuse-studio-host',type:'visibility',active},location.origin);}
 function close(){dialog?.close();}
 function open(){
  if(embedded){parent.postMessage({namespace:'crystalmuse-community',type:'open'},location.origin);return;}
  if(!dialog){dialog=document.createElement('dialog');dialog.className='community-gallery-modal';dialog.setAttribute('aria-label','Community Gallery');frame=document.createElement('iframe');frame.title='CrystalMuse Community Gallery';frame.src='community-gallery/index.html?from=diy';dialog.append(frame);document.body.append(dialog);dialog.addEventListener('close',()=>{document.body.classList.remove('community-open');visibility(document.body.classList.contains('in-diy-studio'));const source=studio()?.contentDocument||document;source.getElementById('openCommunity')?.focus();});}
  if(!dialog.open){dialog.showModal();document.body.classList.add('community-open');visibility(false);}
 }
 document.addEventListener('click',e=>{if(e.target.closest('#openCommunity'))open();});
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.namespace!=='crystalmuse-community')return;if(e.data.type==='open'&&e.source===studio()?.contentWindow)open();if(e.data.type==='close'&&e.source===frame?.contentWindow)close();});
 window.addEventListener('hashchange',()=>{if(dialog?.open)close();});
})();
