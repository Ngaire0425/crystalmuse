function pearlEnvironment(T,renderer){
 const w=512,h=256,data=new Float32Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const v=(y+.5)/h,latitude=(v-.5)*Math.PI,phi=x/w*Math.PI*2;
  // Broad studio ceiling and a soft dark belt: reflection, never a painted highlight.
  const band=Math.exp(-Math.pow((latitude-.03)/.22,2));
  const upper=3.8*Math.exp(-Math.pow((latitude-.67)/.40,2));
  const base=.28+upper, az=.82+.18*Math.cos(phi-.8);
  const pink=.035*Math.sin(phi*2+.7),cool=.025*Math.cos(phi-1.1);
  const k=(y*w+x)*4;
  data[k]=(base*az*(1-.97*band))*(1+pink);
  data[k+1]=(base*az*(1-.92*band))*(1-pink*.4);
  data[k+2]=(base*az*(1-.92*band))*(1+cool);
  // Large feathered rectangular softbox, offset from the viewing axis.
  const a=Math.atan2(Math.sin(phi-.8),Math.cos(phi-.8));
  const box=4*Math.exp(-Math.pow(a/.42,6)-Math.pow((latitude-.65)/.34,6));
  for(let c=0;c<3;c++)data[k+c]+=box;
  data[k+3]=1;
 }
 const tex=new T.DataTexture(data,w,h,T.RGBAFormat,T.FloatType);tex.mapping=T.EquirectangularReflectionMapping;tex.needsUpdate=true;
 const g=new T.PMREMGenerator(renderer),out=g.fromEquirectangular(tex);tex.dispose();g.dispose();return out.texture;
}

const environments=new WeakMap();
export function registerPearlEnvironment(T,renderer){environments.set(renderer,pearlEnvironment(T,renderer));}
export function applyPearlAppearance(T,mesh,s){if(!s.pearlLustre)return;mesh.material=mesh.material.clone();mesh.onBeforeRender=renderer=>{mesh.material.envMap=environments.get(renderer)||null;};}
