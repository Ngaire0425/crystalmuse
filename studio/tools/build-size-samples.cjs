// Offline GLB geometry variants: preserve materials/UVs/embedded images and rebuild the independent bore.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,n))),cfg=read('size-samples.json'),catalog=read('beads.json'),products=read('products.json'),profiles=read('viewer-profiles.json'),pricing=read('pricing.json');
const write=(n,x)=>fs.writeFileSync(path.join(root,n),JSON.stringify(x,null,2));fs.mkdirSync(path.join(root,'assets/models/size-samples'),{recursive:true});
function variant(file,d,bore){
 const raw=fs.readFileSync(path.join(root,file)),jlen=raw.readUInt32LE(12),j=JSON.parse(raw.subarray(20,20+jlen)),bin=Buffer.from(raw.subarray(28+jlen));
 const mesh=j.meshes.find(m=>m.name.includes('drilled')),p=mesh.primitives[0];
 function view(idx){const a=j.accessors[idx],b=j.bufferViews[a.bufferView];return {a,offset:(b.byteOffset||0)+(a.byteOffset||0),stride:b.byteStride||12};}
 const pos=view(p.attributes.POSITION),norm=view(p.attributes.NORMAL),oldMouth=.135,oldBore=.135*.93,newBore=bore/d,newMouth=newBore/.93,oldA=Math.asin(oldMouth),newA=Math.asin(newMouth),oldEnd=Math.sqrt(1-oldMouth**2),newEnd=Math.sqrt(1-newMouth**2),positions=[];
 for(let i=0;i<pos.a.count;i++){
  const off=pos.offset+i*pos.stride,x=bin.readFloatLE(off),y=bin.readFloatLE(off+4),z=bin.readFloatLE(off+8),r=Math.hypot(x,y),phi=Math.atan2(y,x);let rr,zz;
  if(Math.abs(x*x+y*y+z*z-1)<.00001){const theta=Math.acos(Math.max(-1,Math.min(1,z))),t=(theta-oldA)/(Math.PI-2*oldA),angle=newA+t*(Math.PI-2*newA);rr=Math.sin(angle);zz=Math.cos(angle);}
  else{rr=r*newBore/oldBore;zz=Math.sign(z)*(newEnd-(oldEnd-Math.abs(z))*8/d);}
  const q=[rr*Math.cos(phi),rr*Math.sin(phi),zz];positions.push(q);q.forEach((v,k)=>bin.writeFloatLE(v,off+k*4));
 }
 // Area-weighted normals, welded across the UV seam; preserve the original triangle topology.
 const ia=j.accessors[p.indices],iv=j.bufferViews[ia.bufferView],io=(iv.byteOffset||0)+(ia.byteOffset||0),bytes=ia.componentType===5125?4:2,index=i=>bytes===4?bin.readUInt32LE(io+i*bytes):bin.readUInt16LE(io+i*bytes),sums=new Map(),keys=positions.map(v=>v.map(x=>x.toFixed(6)).join('/'));
 for(let i=0;i<ia.count;i+=3){const ids=[index(i),index(i+1),index(i+2)],a=positions[ids[0]],b=positions[ids[1]],c=positions[ids[2]],u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(const id of ids){const sum=sums.get(keys[id])||[0,0,0];for(let k=0;k<3;k++)sum[k]+=n[k];sums.set(keys[id],sum);}}
 for(let i=0;i<positions.length;i++){const n=sums.get(keys[i]),len=Math.hypot(...n);if(!len)throw Error('Invalid normal');for(let k=0;k<3;k++)bin.writeFloatLE(n[k]/len,norm.offset+i*norm.stride+k*4);}
 pos.a.min=[0,1,2].map(k=>Math.min(...positions.map(p=>p[k])));pos.a.max=[0,1,2].map(k=>Math.max(...positions.map(p=>p[k])));
 for(const node of j.nodes)if(node.scale)node.scale=node.scale.map(v=>v*d/8);
 let text=Buffer.from(JSON.stringify(j));text=Buffer.concat([text,Buffer.alloc((4-text.length%4)%4,32)]);const head=Buffer.from(raw.subarray(0,20)),bh=Buffer.from(raw.subarray(20+jlen,28+jlen));head.writeUInt32LE(28+text.length+bin.length,8);head.writeUInt32LE(text.length,12);return {buffer:Buffer.concat([head,text,bh,bin]),sizeMm:[d,d,d*newEnd]};
}
for(const base of cfg.families){const original=catalog.find(s=>s.id===base),product={...products.products[base]},profile=profiles[base];if(!original)throw Error('Missing base '+base);
 for(const defaults of cfg.specifications){const d=defaults.diameterMm,id=d===8?base:base+'-'+d+'mm',option={...defaults,...cfg.overrides?.[id]},model='assets/models/size-samples/'+id+'.glb';let spec;if(!Number.isFinite(option.boreDiameterMm)||option.boreDiameterMm<=0||option.boreDiameterMm>=d*.75)throw Error('Invalid bore '+id);if(d===8&&Math.abs(option.boreDiameterMm-1.0044)>.00001)throw Error('8mm兼容ID必须保留原孔径；不同孔径应另建SKU，不得覆盖旧设计');
  if(d===8)spec={...original};else{const out=variant(original.model,d,option.boreDiameterMm);fs.writeFileSync(path.join(root,model),out.buffer);spec={...original,id,model,sizeMm:out.sizeMm,occupancyMm:out.sizeMm[2],collisionRadiusMm:d/2,radialWidthMm:d};}
  Object.assign(spec,{sizeSeries:base,diameterMm:d,boreDiameterMm:option.boreDiameterMm,boreVerified:false,sizeSourceModel:base});spec.assumptions=[...(original.assumptions||[]).filter(n=>!cfg.notes.includes(n)),...cfg.notes];const at=catalog.findIndex(s=>s.id===id);if(at<0)catalog.push(spec);else catalog[at]=spec;
  const thumb=d===8?product.thumbnail:'assets/product-thumbs/'+id+'-size-v1.png';if(d!==8&&!fs.existsSync(path.join(root,thumb)))fs.copyFileSync(path.join(root,product.thumbnail),path.join(root,thumb));
  products.products[id]={...product,selection:'size',groupId:base+'-size-series',variantLabel:d+'mm',sortOrder:Math.floor(product.sortOrder)+d/100,thumbnail:thumb};
  if(profile&&d!==8)profiles[id]={...profile,id:base,diameter_mm:d,hole_diameter_mm:option.boreDiameterMm};
  if(!(id in pricing.unitPricesMinor))pricing.unitPricesMinor[id]=option.unitPriceMinor;
 }
}
write('beads.json',catalog);write('products.json',products);write('viewer-profiles.json',profiles);write('pricing.json',pricing);console.log('Built four size families; original 8mm GLBs unchanged');
