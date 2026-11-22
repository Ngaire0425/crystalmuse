import {analyticTransmission,iceOpticsSettings} from './ice-optics.js';
import {iceLayerState} from './ice-layers.js';
const opticalEnvironments=new WeakMap();let defaultOpticalEnvironment;
export function registerIceEnvironment(T,renderer){
 const env=new T.Scene();env.background=new T.Color(.16,.18,.21);
 const panel=(x,y,z,w,h,c)=>{const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(...c),side:T.DoubleSide}));o.position.set(x,y,z);o.lookAt(0,0,0);env.add(o)};
 panel(-3,3,5,2.5,4,[3.5,3.5,3.5]);panel(3.5,1.5,4,.65,4,[2.5,2.7,3]);panel(0,-4,2,5,.8,[1.1,1.2,1.3]);panel(-3,-2,-1,4,4,[.035,.045,.065]);
 const pm=new T.PMREMGenerator(renderer),target=pm.fromScene(env,.006);pm.dispose();opticalEnvironments.set(renderer,target.texture);defaultOpticalEnvironment??=target.texture;
 env.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});
}
// Only new ice/high-clarity variants use this path. Existing crystal shaders remain untouched.
export function applyIceMaterial(T,mesh,s){
 if(!s.iceVariant)return;const baseId=s.sizeSourceModel||s.id;
 const source=mesh.material;if(!(source.name.endsWith('_clear')||source.name.endsWith('_bore_wall')||source.name.includes('_zone_')))return; // Keep original needle materials.
 // Three's transmission shader multiplies thickness by modelMatrix scale already.
 // Geometry is scaled 1000 at its parent: retaining metre-local thickness produces 4mm rays.
 const m=mesh.material=source.clone();m.thickness=source.thickness||.004;
 m.userData.iceShell=true;const layer={map:{value:null},enabled:{value:false}};
 m.depthWrite=true;m.side=T.FrontSide;const optics={center:{value:new T.Vector3()},axis:{value:new T.Vector3(0,1,0)},radius:{value:(s.diameterMm||8)/2},bore:{value:(s.boreDiameterMm||1)/2}};
 m.attenuationDistance=Number.isFinite(source.attenuationDistance)?source.attenuationDistance*1000*iceOpticsSettings.absorptionDistanceScale:40000;
 m.envMap=defaultOpticalEnvironment;m.envMapIntensity=1;let flash={value:0};
 m.onBeforeCompile=shader=>{
  shader.uniforms.iceCenter=optics.center;shader.uniforms.iceAxis=optics.axis;shader.uniforms.iceRadius=optics.radius;shader.uniforms.iceBoreRadius=optics.bore;shader.uniforms.iceBackBuffer=layer.map;shader.uniforms.iceLayerEnabled=layer.enabled;
  shader.fragmentShader='uniform sampler2D iceBackBuffer;uniform bool iceLayerEnabled;\n'+shader.fragmentShader;
  const pars=T.ShaderChunk.transmission_pars_fragment.replace('vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );','vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior ); transmittedLight.rgb=mix(vec3(.975,.965,.985),transmittedLight.rgb,transmittedLight.a); transmittedLight.a=1.0;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <transmission_pars_fragment>',analyticTransmission(T,pars));
  if(baseId==='moonstone-clear'){shader.uniforms.moonFlash=flash;shader.fragmentShader='uniform float moonFlash;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance += vec3(.025,.13,.38)*moonFlash*pow(max(0.0,normal.z),7.0);');}
 };
 mesh.onBeforeRender=(renderer,scene,camera)=>{optics.center.value.setFromMatrixPosition(mesh.matrixWorld);optics.axis.value.set(0,1,0).transformDirection(mesh.matrixWorld);m.envMap=opticalEnvironments.get(renderer)||defaultOpticalEnvironment;const state=iceLayerState.get(renderer);layer.enabled.value=!!state?.enabled;layer.map.value=state?.texture||null;if(baseId==='moonstone-clear'){const axis=new T.Vector3(0,1,0).transformDirection(mesh.matrixWorld),direction=camera.getWorldPosition(new T.Vector3()).sub(mesh.getWorldPosition(new T.Vector3())).normalize();flash.value=Math.pow(Math.abs(axis.dot(direction)),10)*.7;}};
 m.customProgramCacheKey=()=>baseId==='moonstone-clear'?'ice-layer-moon-v1':'ice-layer-v1';
}
// Bore geometry is already present in the GLB; the shader traces its air interfaces.
export function addIceBore(){}
