// Bounded analytic refraction through an 8mm spherical GLB and its real cylindrical bore.
// The GLB remains the visible surface and retains its authored absorption/IOR/needles.
export const iceOpticsSettings={absorptionDistanceScale:3,edgeSamples:4};
export const iceOpticsGLSL=`
uniform vec3 iceCenter;
uniform vec3 iceAxis;
uniform float iceRadius;
uniform float iceBoreRadius;
vec3 iceEnvironment(vec3 ray,float rough){
 #ifdef ENVMAP_TYPE_CUBE_UV
 return textureCubeUV(envMap,ray,rough).rgb;
 #else
 return vec3(.08);
 #endif
}
vec3 iceTrace(vec3 pos,vec3 normal,vec3 viewDir,float eta,float rough,out float travelled,out vec3 exitPoint,out vec3 exitDir){
 vec3 p=pos-iceCenter,d=refract(-viewDir,normal,1./eta);bool glass=true;travelled=0.;
 p+=d*.002;
 for(int step=0;step<8;step++){
  float best=1e6;vec3 boundary=vec3(0.);bool outer=false;
  float b=dot(p,d),h=b*b-dot(p,p)+iceRadius*iceRadius;
  if(h>0.){float root=sqrt(h);for(int k=0;k<2;k++){float t=-b+(k==0?-root:root);vec3 q=p+t*d,rad=q-iceAxis*dot(q,iceAxis);if(t>.001&&t<best&&dot(rad,rad)>=iceBoreRadius*iceBoreRadius*.999){best=t;boundary=normalize(q);outer=true;}}}
  vec3 pp=p-iceAxis*dot(p,iceAxis),dd=d-iceAxis*dot(d,iceAxis);float aa=dot(dd,dd),bb=dot(pp,dd),cc=dot(pp,pp)-iceBoreRadius*iceBoreRadius,disc=bb*bb-aa*cc;
  if(aa>1e-6&&disc>=0.){float root=sqrt(disc);for(int k=0;k<2;k++){float t=(-bb+(k==0?-root:root))/aa;vec3 q=p+t*d;if(t>.001&&t<best&&dot(q,q)<=iceRadius*iceRadius*1.001){best=t;boundary=-normalize(q-iceAxis*dot(q,iceAxis));outer=false;}}}
  if(best>1e5)break;
  if(glass)travelled+=best;
  p+=best*d;vec3 next=refract(d,glass?-boundary:boundary,glass?eta:1./eta);
  if(dot(next,next)<.01){d=reflect(d,boundary);}else{d=normalize(next);glass=!glass;if(outer&&!glass){p+=d*.002;break;}}
  p+=d*.002;
 }
 exitPoint=p+iceCenter;exitDir=d;
 vec3 light=iceEnvironment(d,rough);
 if(d.z<-.001){float distance=(-iceRadius-.12-p.z)/d.z;if(distance>0.){vec3 q=p+d*distance;float contact=exp(-dot(q.xy,q.xy)/20.)*.38;light=vec3(.78,.77,.80)*(1.-contact);}}
 return light;
}
`;
export function analyticTransmission(T,pars){
 const start=pars.indexOf('\t\tvec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );',pars.indexOf('vec4 getIBLVolumeRefraction'));
 const end=pars.indexOf('\n\t\tvec3 F =',start);
 return iceOpticsGLSL+pars.slice(0,start)+`
 float travel;vec3 exitPoint,exitDir;
 vec3 radiance=iceTrace(position,n,v,ior,roughness,travel,exitPoint,exitDir);
 // Subpixel rays soften the narrow bore caustics without blurring needle geometry.
 vec3 px=dFdx(position)*.3,py=dFdy(position)*.3,nx=dFdx(n)*.3,ny=dFdy(n)*.3;
 float t1;vec3 ep1,ed1;
 radiance+=iceTrace(position+px+py,normalize(n+nx+ny),v,ior,roughness,t1,ep1,ed1);
 radiance+=iceTrace(position-px+py,normalize(n-nx+ny),v,ior,roughness,t1,ep1,ed1);
 radiance+=iceTrace(position-py,normalize(n-ny),v,ior,roughness,t1,ep1,ed1);radiance*=.25;
 vec4 clip=projMatrix*viewMatrix*vec4(exitPoint+exitDir*4.,1.);vec2 uv=clip.xy/clip.w*.5+.5;
 if(iceLayerEnabled&&all(greaterThanEqual(uv,vec2(0.)))&&all(lessThanEqual(uv,vec2(1.)))){vec4 behind=texture2D(iceBackBuffer,uv);radiance=mix(radiance,behind.rgb,behind.a);}
 vec4 transmittedLight=vec4(radiance,1.);
 vec3 attenuatedColor=applyVolumeAttenuation(radiance,travel,attenuationColor,attenuationDistance);
 `+pars.slice(end);
}
