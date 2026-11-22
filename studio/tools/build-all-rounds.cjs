const fs=require('fs'),path=require('path'),geo=require('./round-geometry.cjs'),root=path.resolve(__dirname,'..'),read=n=>JSON.parse(fs.readFileSync(path.join(root,n))),write=(n,v)=>fs.writeFileSync(path.join(root,n),JSON.stringify(v,null,2));
const catalog=read('beads.json'),products=read('products.json'),profiles=read('viewer-profiles.json'),families=catalog.filter(s=>products.products[s.id]?.shape==='round'&&(!s.sizeSourceModel||s.id===s.sizeSourceModel)),out=path.join(root,'assets/models/round-sizes');fs.mkdirSync(out,{recursive:true});const manifest=[];
for(const source of families){const inspection=geo.inspect(path.join(root,source.model),source),native=Math.round(inspection.diameter),product={...products.products[source.id]},made=[];
 const sizes=[...new Set([native,6,8,10,12])].sort((a,b)=>a-b);
 for(const [order,d] of sizes.entries()){
  const id=d===native?source.id:source.id+'-'+d+'mm',exists=catalog.find(s=>s.id===id);let spec;
  if(d===native){spec={...source,boreDiameterMm:inspection.bore*inspection.diameter};}
  else{const bore=1,result=geo.build(path.join(root,source.model),source,d,bore),model='assets/models/round-sizes/'+id+'.glb';fs.writeFileSync(path.join(root,model),result.buffer);const size=exists&&exists.sizeMm.every((v,k)=>Math.abs(v-result.sizeMm[k])<.02)?exists.sizeMm:result.sizeMm.map(v=>Number(v.toFixed(6)));spec={...source,id,model,sizeMm:size,centerMm:result.centerMm,occupancyMm:size[source.holeAxis.findIndex(v=>v!==0)],radialWidthMm:Math.max(...size.filter((_,k)=>!source.holeAxis[k])),collisionRadiusMm:Math.max(...size)/2,boreDiameterMm:bore};if(profiles[source.id])profiles[id]={...profiles[source.id],id:profiles[source.id].id,diameter_mm:d,hole_diameter_mm:bore};}
  Object.assign(spec,{diameterMm:d,sizeSeries:source.id,sizeSourceModel:source.id,boreVerified:false,collisionShape:'sphere'});
  const i=catalog.findIndex(s=>s.id===id);if(i<0)catalog.push(spec);else catalog[i]=spec;
  products.products[id]={...product,selection:'size',groupId:source.id+'-size-series',variantLabel:d+'mm',sortOrder:Math.floor(product.sortOrder)+order*.001,thumbnail:product.thumbnail||source.thumbnail};made.push({id,diameterMm:d,boreDiameterMm:spec.boreDiameterMm,model:spec.model});
 }
 manifest.push({sourceId:source.id,name:source.name,nativeDiameterMm:native,variants:made});if(manifest.length%20===0)console.log('Generated families',manifest.length);
}
write('beads.json',catalog);write('products.json',products);write('viewer-profiles.json',profiles);write('round-size-manifest.json',{version:1,families:manifest,notes:['新增规格均暂按1mm实际贯穿孔建模，商家实物待确认；原规格文件及孔径保留','原尺寸为4mm的圆形金属配珠继续保留原4mm，并新增6/8/10/12mm','仅shape=round扩展，异形、隔片、吊坠、玻璃米珠系列保持原规格','新规格缩略图复用同款原外观的标准展示图；真实尺寸在拖拽和制作区中显示','原规格ID保留，旧设计兼容；每种外观一张卡，卡内及选中珠子可切换尺寸']});console.log('DONE',manifest.length,'families',manifest.reduce((n,f)=>n+f.variants.length,0),'round SKUs',catalog.length,'total SKUs');
