/* CrystalMuse 12-material studies. Three.js r147. Retain these artistic real-time optical approximations for the demonstrated appearance. */
(function(global){
function crystal(THREE,mesh,options={}){
 const size=256,rgba=new Uint8Array(size*size*4);let seed=72319;
 for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const r=seed>>>24;rgba.set([r,r,r,255],i*4);}
 const noise=new THREE.DataTexture(rgba,size,size,THREE.RGBAFormat);noise.wrapS=noise.wrapT=THREE.RepeatWrapping;noise.minFilter=noise.magFilter=THREE.LinearFilter;noise.needsUpdate=true;
 const uniforms={uGemNoise:{value:noise},uGemInv:{value:new THREE.Matrix4()},uGemCloud:{value:options.cloud??1.35},uGemCrack:{value:options.crack??.85},uGemTint:{value:new THREE.Vector3(...(options.tint||[.42,.48,.54]))},uGemSeed:{value:options.seed||0},uGemIOR:{value:options.ior||1.544}};
 const material=mesh.material;material.transparent=false;material.opacity=1;material.depthWrite=true;material.transmission=options.trans??material.transmission;material.thickness=2;material.attenuationDistance=7.5;material.ior=options.ior||1.544;
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.fragmentShader=`uniform sampler2D uGemNoise;uniform mat4 uGemInv;uniform float uGemCloud,uGemCrack,uGemSeed,uGemIOR;uniform vec3 uGemTint;
float gemNoise(vec3 p){p+=vec3(uGemSeed*1.3,uGemSeed*.7,uGemSeed*2.1);vec3 a=floor(p);vec3 f=fract(p);f=f*f*(3.-2.*f);vec2 uv=a.xy+vec2(37.,17.)*a.z+f.xy;float x=texture2D(uGemNoise,(uv+.5)/256.).r;float y=texture2D(uGemNoise,(uv+vec2(37.,17.)+.5)/256.).r;return mix(x,y,f.z);}
float gemField(vec3 p){return gemNoise(p)*.68+gemNoise(p*2.13+17.4)*.32;}
float gemCloud(vec3 p){vec3 q=(p-vec3(-.27,.20,.05))/vec3(.59,.23,.42);float a=exp(-dot(q,q)*1.8);q=(p-vec3(.23,-.34,-.10))/vec3(.50,.28,.45);a+=exp(-dot(q,q)*1.6);q=(p-vec3(.37,.40,-.3))/vec3(.28,.38,.30);a+=exp(-dot(q,q)*1.9);float f=gemField(p*13.+vec3(gemNoise(p*4.)*1.8));return a*smoothstep(.39,.77,f)*uGemCloud;}
vec3 gemVolume(vec3 color,vec3 worldPos,vec3 worldNormal,vec3 worldView){
 vec3 ro=(uGemInv*vec4(worldPos,1.)).xyz;vec3 rd=normalize((uGemInv*vec4(refract(-worldView,worldNormal,1./uGemIOR),0.)).xyz);ro+=rd*.001;
 float b=dot(ro,rd),disc=b*b-dot(ro,ro)+1.;float distance=max(0.,-b+sqrt(max(0.,disc)));float stepSize=distance/40.;float T=1.;vec3 S=vec3(0.);
 for(int i=0;i<40;i++){vec3 p=ro+rd*(float(i)+.5)*stepSize;float d=gemCloud(p);float a=1.-exp(-d*stepSize*9.0);float light=.72+.28*clamp((p.y+1.)*.5,0.,1.);S+=T*a*uGemTint*light;T*=1.-a;}
 vec3 result=color*T+S;
 for(int i=0;i<6;i++){float fi=float(i);vec3 n=normalize(vec3(sin(fi*2.3+.3),cos(fi*1.9+.4),.42+sin(fi*3.1)*.3));vec3 c=vec3(sin(fi*3.7)*.36,cos(fi*4.2)*.38,sin(fi*2.9)*.30);float denom=dot(rd,n);float t=dot(c-ro,n)/(denom+1.e-5);vec3 p=ro+rd*t;vec3 delta=p-c;float radius=.24+.05*fi;float edge=1.-smoothstep(radius*.62,radius,length(delta));
 if(t>0.&&t<distance&&edge>0.){vec3 u=normalize(cross(n,vec3(.17,.83,.41)));vec3 v=cross(n,u);vec2 q=vec2(dot(delta,u),dot(delta,v));float pattern=gemField(vec3(q*70.,fi*17.));float veins=1.-smoothstep(.018,.07,abs(pattern-.51));float flecks=smoothstep(.66,.80,gemField(p*38.+fi));float seam=exp(-abs(q.y-.055*sin(q.x*14.)-.012*sin(q.x*83.+fi))*220.);float branch=exp(-abs(q.y-q.x*.55-.028*sin(q.x*41.+fi))*270.)*smoothstep(-.02,.12,q.x);float angle=.12+.55*pow(1.-abs(denom),2.);float a=edge*(.008+veins*.06+flecks*.04+seam*.55+branch*.32)*uGemCrack;vec3 silver=vec3(.25,.28,.30)+vec3(.65)*smoothstep(.30,.60,angle);result=mix(result,silver,clamp(a,0.,.6));}}
 return result;}
`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <transmission_fragment>',THREE.ShaderChunk.transmission_fragment+`\n#ifdef USE_TRANSMISSION\n totalDiffuse=gemVolume(totalDiffuse,pos,n,v);\n#endif\n`);
 };
 material.customProgramCacheKey=()=> 'CrystalMuseCrystal-v4';material.needsUpdate=true;
 return {uniforms,update(){mesh.updateWorldMatrix(true,false);uniforms.uGemInv.value.copy(mesh.matrixWorld).invert();},dispose(){noise.dispose();}};
}
function optical(THREE,mesh,kind){
 const uniforms={uOptInverse:{value:new THREE.Matrix4()},uOptAmount:{value:1}};
 const m=mesh.material;
 m.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='varying vec3 vGemPosition,vGemNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vGemPosition=position;vGemNormal=normal;');
  shader.fragmentShader='varying vec3 vGemPosition,vGemNormal;uniform mat4 uOptInverse;uniform float uOptAmount;\n'+shader.fragmentShader;
  let code=(kind==='moonstone'||kind==='peachmoon')?
  'vec3 gn=normalize(vGemNormal);vec3 gv=normalize((uOptInverse*vec4(cameraPosition,1.)).xyz-vGemPosition);vec3 gh=normalize(gv+normalize(vec3(-.4,.6,1.)));float flash=pow(max(dot(gn,gh),0.),5.);float angle=.35+.65*pow(abs(gv.y),3.);float haze=.8+.2*sin(vGemPosition.y*18.+vGemPosition.x*9.);outgoingLight+=vec3(.015,.30,.80)*flash*angle*haze*uOptAmount;':
  'vec3 gn=normalize(vGemNormal);vec3 gv=normalize((uOptInverse*vec4(cameraPosition,1.)).xyz-vGemPosition);vec3 gh=normalize(gv+normalize(vec3(-.5,.7,1.)));vec3 fiber=normalize(vec3(0.,0.,1.)-gn*dot(gn,vec3(0.,0.,1.)));float band=pow(max(0.,1.-abs(dot(fiber,gh))),22.);float front=pow(max(dot(gn,gv),0.),.6);outgoingLight+=vec3(.65,.34,.07)*band*front*.65*uOptAmount;';
  if(kind==='peachmoon')code=code.replace('vec3(.015,.30,.80)','vec3(.32,.19,.09)');shader.fragmentShader=shader.fragmentShader.replace('#include <output_fragment>',code+'\n#include <output_fragment>');
 };
 m.customProgramCacheKey=()=> 'CrystalMuseOptical-v4-'+kind;m.needsUpdate=true;
 return {uniforms,update(){mesh.updateWorldMatrix(true,false);uniforms.uOptInverse.value.copy(mesh.matrixWorld).invert()},dispose(){}};
}
global.CrystalMuseMaterials={crystal,optical};
})(typeof window==='undefined'?globalThis:window);

/* Additional artistic optical approximations for Three.js r147. */
(function(global){
global.CrystalMuseMaterials.special=function(THREE,mesh,kind){
 const m=mesh.material,u={uSpecInverse:{value:new THREE.Matrix4()},uSpecAmount:{value:1}};
 const bytes=new Uint8Array(128*128*4);let seed=18563;for(let i=0;i<128*128;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const a=seed>>>24;bytes.set([a,a,a,255],i*4)}const noise=new THREE.DataTexture(bytes,128,128,THREE.RGBAFormat);noise.wrapS=noise.wrapT=THREE.RepeatWrapping;noise.minFilter=noise.magFilter=THREE.LinearFilter;noise.needsUpdate=true;u.uSpecNoise={value:noise};
 m.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,u);shader.vertexShader='varying vec3 vSpecP,vSpecN;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vSpecP=position;vSpecN=normal;');
  shader.fragmentShader='varying vec3 vSpecP,vSpecN;uniform mat4 uSpecInverse;uniform float uSpecAmount;uniform sampler2D uSpecNoise;float specNoise(vec3 p){vec3 a=floor(p),f=fract(p);f=f*f*(3.-2.*f);vec2 uv=a.xy+vec2(37.,17.)*a.z+f.xy;return mix(texture2D(uSpecNoise,(uv+.5)/128.).r,texture2D(uSpecNoise,(uv+vec2(37.,17.)+.5)/128.).r,f.z);}\n'+shader.fragmentShader;
  let code='vec3 sn=normalize(vSpecN);vec3 sv=normalize((uSpecInverse*vec4(cameraPosition,1.)).xyz-vSpecP);float facing=clamp(dot(sn,sv),0.,1.);';
  if(kind==='cat')code+='float center=dot(sv,vec3(.35,0.,.20))*.6;float x=vSpecP.x*.75+vSpecP.z*.65-center;float line=exp(-pow(x*12.,2.));float soft=exp(-pow(x*5.,2.))*.20;outgoingLight+=vec3(.93,.97,1.)*(line+soft)*pow(facing,.65)*1.1*uSpecAmount;';
  if(kind==='pearl')code+='float phase=facing*5.+sn.x*2.+sn.z*4.;vec3 nacre=.5+.5*cos(phase+vec3(0.,2.1,4.2));outgoingLight=outgoingLight*(.96+nacre*.04)+nacre*(pow(1.-facing,.6)*.045+pow(facing,8.)*.027)*uSpecAmount;';
  if(kind==='opal')code+='float opalNoise1=specNoise(vSpecP*13.);float opalNoise2=specNoise(vSpecP*31.+vec3(7.,3.,5.));float phase=opalNoise1*17.+opalNoise2*2.+dot(sv,vec3(.4,.8,.2))*2.;vec3 fire=.5+.5*cos(phase+vec3(0.,2.1,4.2));float mask=smoothstep(.45,.76,opalNoise2)*pow(facing,.30);outgoingLight=mix(outgoingLight,outgoingLight*.30+fire*.85,mask*.70*uSpecAmount);';
  shader.fragmentShader=shader.fragmentShader.replace('#include <output_fragment>',code+'\n#include <output_fragment>');
 };
 m.customProgramCacheKey=()=> 'CrystalMuseSpecial-v5-'+kind;m.needsUpdate=true;
 return {uniforms:u,update(){mesh.updateWorldMatrix(true,false);u.uSpecInverse.value.copy(mesh.matrixWorld).invert()},dispose(){noise.dispose()}};
};
})(typeof window==='undefined'?globalThis:window);



