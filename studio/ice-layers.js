// Back-to-front refraction buffers: transparent neighbours participate in transmission.
export const iceLayerState=new WeakMap();
const pipelines=new WeakMap();
const shadowScenes=new WeakMap();
function updateContactShadows(T,scene,groups){
 let state=shadowScenes.get(scene);if(!state){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(28,36,48,.30)');g.addColorStop(.5,'rgba(28,36,48,.18)');g.addColorStop(1,'rgba(28,36,48,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);const texture=new T.CanvasTexture(canvas),material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false});const root=new T.Group();root.name='ICE_CONTACT_SHADOWS';scene.add(root);state={root,material,planes:[]};shadowScenes.set(scene,state)}
 while(state.planes.length<groups.length){const o=new T.Mesh(new T.PlaneGeometry(11,11),state.material);state.root.add(o);state.planes.push(o)}
 state.planes.forEach((o,i)=>{o.visible=i<groups.length;if(!o.visible)return;const p=groups[i][0].getWorldPosition(new T.Vector3());o.position.set(p.x+.4,p.y-.5,p.z-4.12);});
}
export function renderIceLayers(T,renderer,scene,camera){
 if(renderer.iceLayeredDisabled){renderer.render(scene,camera);return;}
 camera.updateMatrixWorld();scene.updateMatrixWorld(true);
 const shells=[];scene.traverse(o=>{if(o.isMesh&&o.visible&&o.material?.userData?.iceShell){let visible=true;for(let p=o.parent;p;p=p.parent)if(!p.visible)visible=false;if(visible)shells.push(o)}});
 if(!shells.length){const shadow=shadowScenes.get(scene);if(shadow)shadow.root.visible=false;renderer.render(scene,camera);return;}
 let p=pipelines.get(renderer);if(!p){
  const options={type:renderer.capabilities.isWebGL2?T.HalfFloatType:T.UnsignedByteType,format:T.RGBAFormat,minFilter:T.LinearFilter,magFilter:T.LinearFilter};
  const vertex='varying vec2 uvCopy;void main(){uvCopy=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const copy=new T.ShaderMaterial({uniforms:{source:{value:null},sourceDepth:{value:null}},vertexShader:vertex,fragmentShader:'uniform sampler2D source;uniform sampler2D sourceDepth;varying vec2 uvCopy;void main(){gl_FragColor=texture2D(source,uvCopy);gl_FragDepthEXT=texture2D(sourceDepth,uvCopy).r;}',extensions:{fragDepth:true},depthTest:true,depthFunc:T.AlwaysDepth,depthWrite:true,toneMapped:false});
  const final=new T.ShaderMaterial({uniforms:{source:{value:null}},vertexShader:vertex,fragmentShader:'uniform sampler2D source;varying vec2 uvCopy;void main(){gl_FragColor=texture2D(source,uvCopy);\n// Decode premultiplied coverage before nonlinear colour mapping; restore it for canvas compositing.\nfloat coverage=gl_FragColor.a;\ngl_FragColor.rgb=coverage>0.00001?gl_FragColor.rgb/coverage:vec3(0.0);\n#include <tonemapping_fragment>\n#include <encodings_fragment>\ngl_FragColor.rgb*=coverage;\n}',depthTest:false,depthWrite:false});
  const quad=new T.Mesh(new T.PlaneGeometry(2,2),copy),screen=new T.Scene();screen.add(quad);
  p={a:new T.WebGLRenderTarget(1,1,options),b:new T.WebGLRenderTarget(1,1,options),copy,final,quad,screen,cam:new T.Camera()};p.a.depthTexture=new T.DepthTexture(1,1);p.b.depthTexture=new T.DepthTexture(1,1);pipelines.set(renderer,p);
 }
 const size=renderer.getDrawingBufferSize(new T.Vector2());if(p.a.width!==size.x||p.a.height!==size.y){p.a.setSize(size.x,size.y);p.b.setSize(size.x,size.y);}
 const oldTarget=renderer.getRenderTarget(),autoClear=renderer.autoClear,oldTone=renderer.toneMapping,background=scene.background,others=[];
 const state={enabled:false,texture:p.a.texture,size};iceLayerState.set(renderer,state);
 const roots=new Map();for(const o of shells){let root=o;while(root.parent&&root.parent!==scene&&root.parent.userData.key===root.userData.key)root=root.parent;const key=o.userData.key||root.uuid;if(!roots.has(key))roots.set(key,[]);roots.get(key).push(o)}
 const groups=[...roots.values()].sort((a,b)=>b[0].getWorldPosition(new T.Vector3()).applyMatrix4(camera.matrixWorldInverse).z-a[0].getWorldPosition(new T.Vector3()).applyMatrix4(camera.matrixWorldInverse).z).reverse();
 updateContactShadows(T,scene,groups);shadowScenes.get(scene).root.visible=true;scene.updateMatrixWorld(true);scene.traverse(o=>{if((o.isMesh||o.isLine||o.isPoints||o.isSprite)&&o.visible&&!shells.includes(o))others.push(o)});
 // Six depth bands bound mobile GPU cost; each band samples already-rendered farther bands.
 const bands=Array.from({length:Math.min(6,groups.length)},()=>[]);groups.forEach((g,i)=>bands[Math.min(bands.length-1,Math.floor(i*bands.length/groups.length))].push(...g));
 try{
  renderer.toneMapping=T.NoToneMapping;shells.forEach(o=>o.visible=false);renderer.autoClear=true;renderer.setRenderTarget(p.a);renderer.setClearColor(0,0);renderer.render(scene,camera);
  state.enabled=true;scene.background=null;others.forEach(o=>o.visible=false);
  for(const band of bands){
   state.texture=p.a.texture;renderer.setRenderTarget(p.b);renderer.autoClear=true;p.copy.uniforms.source.value=p.a.texture;p.copy.uniforms.sourceDepth.value=p.a.depthTexture;p.quad.material=p.copy;renderer.render(p.screen,p.cam);
   renderer.autoClear=false;band.forEach(o=>o.visible=true);renderer.render(scene,camera);band.forEach(o=>o.visible=false);[p.a,p.b]=[p.b,p.a];
  }
  state.enabled=false;renderer.toneMapping=oldTone;renderer.setRenderTarget(oldTarget);renderer.autoClear=true;p.final.uniforms.source.value=p.a.texture;p.quad.material=p.final;renderer.render(p.screen,p.cam);
 }finally{shells.forEach(o=>o.visible=true);others.forEach(o=>o.visible=true);scene.background=background;renderer.autoClear=autoClear;renderer.toneMapping=oldTone;renderer.setRenderTarget(oldTarget);state.enabled=false;}
}
