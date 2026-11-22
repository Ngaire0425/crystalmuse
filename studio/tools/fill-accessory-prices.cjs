// Run from the repository root. Preserve all already configured SKU prices.
const fs=require('fs'),path=require('path');
const root=path.resolve('outputs/CrystalMuse-DIY');
const read=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
const write=(n,v)=>fs.writeFileSync(path.join(root,n),JSON.stringify(v,null,2)+'\n');
const catalog=read('beads.json'),products=read('products.json').products,pricing=read('pricing.json'),reference=read('price-reference.json');
const sources=[
 {id:'glass-seed',url:'https://yiwugo.com/product/detail/957810560.html?loc=56&q=%E7%8F%A0%E5%AD%90',title:'义乌购：透明玻璃米珠按包销售',unit:'人民币/15g包',observations:{price:0.62,approxCounts:{'2mm':1000,'3mm':500,'4mm':150}},note:'2mm约1000颗/包，0.62元为整包价；约0.00062元/颗只是大包装原料折算。本站0.10元/颗为自定小量零售参考估算，包含分拣包装余量，不声称是来源的单颗报价。'},
 {id:'metal-spacer',url:'https://yiwugo.com/product/detail/973856005.html?loc=24&q=%E7%AE%97%E7%9B%98&searchMethod=original',title:'义乌购：黄铜隔片与算盘隔珠',unit:'人民币/个，100个起购',observations:{range:[0.01,0.62]},note:'公开页面仅确认多规格批发价格范围，未将最低价套用于所有款式。本站按造型复杂程度估算小量零售价；镶钻款按普通仿钻/合成装饰估算，非天然钻石。金色/银色均按普通非贵金属配件估算，不代表已确认基材或镀层。'},
 {id:'metal-pendant',url:'https://yiwugo.com/product/detail/985978650.html?loc=7',title:'义乌购：星形金属吊坠配件',unit:'人民币/个，2个起购',observations:{goldStarAccessory:3,silverStarAccessory:3},note:'星形配件公开标价3元/个。本站各款为不同造型，按非贵金属吊坠类别及复杂程度估算5—8元/件，含连接环参考成本；不是逐款同款报价。'},
 {id:'jade-accessory',url:'https://www.yiwugo.com/hu/0672427.html',title:'义乌购：岫玉平安扣配件类别报价',unit:'人民币/个，100个起购',observations:{jadePeaceDisc:2.5},note:'商铺公开列表平安扣配件2.50元、100个起购，未明确对应本站8mm规格。只用作普通玉石配件类别背景，不作为本站玉种、等级或尺寸的认证。异形玉石和琥珀外观均为暂估，实际材质与成本待商家核验。'}
];
for(const s of sources)if(!reference.sources.some(x=>x.id===s.id))reference.sources.push(s);
const spacerMinor={3:80,4:100,5:80,6:50,7:100,8:60,9:100,10:120,11:100,12:150,13:120,14:120,15:80,16:250,17:300,18:200,19:80,20:100};
const pendantMinor={5:800,6:700,7:500,9:700,11:600,13:500,16:600,17:500,20:600};
const shapedMinor={'peace-disc':600,'princess-disc':1000,'meander-round':400,drum:1000,'straight-barrel':600,'faceted-round':300,apple:300,'melon-rib':150,dunzi:100,'engraved-silver':200,armor:250,'baixiang-seed':200,lantern:200,'diamond-cut':80,'three-way':800,'six-sided':150,tube:800,'double-lotus':800,'faceted-spacer':200,'running-ring':150,barrel:600,'meander-drum':800,'old-barrel':300,lotus:1000,vajra:500};
const additions=[];
for(const s of catalog){
 if(Number.isSafeInteger(pricing.unitPricesMinor[s.id])&&reference.rows.some(x=>x.id===s.id))continue;
 const p=products[s.id];let minor,basis,sourceId,basisLabel;
 if(/^spacer-3\d\d-glass$/.test(s.id)){minor=10;basis='glass-seed-retail-estimate';sourceId='glass-seed';basisLabel='玻璃米珠小量零售估算，非整包折算价';}
 else if(s.id.startsWith('spacer-')){minor=spacerMinor[Number(s.id.split('-')[1])];basis='metal-spacer-retail-estimate';sourceId='metal-spacer';basisLabel='非贵金属隔珠同类零售估算，工艺待核';}
 else if(s.kind==='pendant'||s.category==='pendant'){minor=pendantMinor[Number(s.id.split('-')[1])];basis='pendant-retail-estimate';sourceId='metal-pendant';basisLabel='非贵金属吊坠同类零售估算，含连接环';}
 else {minor=shapedMinor[s.id];basis='shaped-accessory-estimate';sourceId=p.material==='metal'?'metal-spacer':p.material==='wood'?'wood':p.material==='glass'?'glass-seed':p.material==='stone'?'gemstone-category':'jade-accessory';basisLabel='异形配珠同类估算，材质与等级待核';}
 if(!Number.isSafeInteger(minor)||minor<=0)throw Error('Missing explicit price rule: '+s.id);
 if(Number.isSafeInteger(pricing.unitPricesMinor[s.id]))minor=pricing.unitPricesMinor[s.id];
 pricing.unitPricesMinor[s.id]=minor;
 const row={id:s.id,name:p.displayName||s.name,appearance:p.tags||[],sizeMm:s.sizeMm,priceMinor:minor,currency:'CNY',unit:s.category==='pendant'?'件':'颗',basis,sourceId,estimatedSize:true,merchantConfirmed:false,gradeVerified:false,renderStylePremium:false,basisLabel};
 reference.rows=reference.rows.filter(x=>x.id!==s.id);reference.rows.push(row);additions.push(row);
}
const rowMap=new Map(reference.rows.map(x=>[x.id,x]));
for(const s of catalog){const row=rowMap.get(s.id);if(!row)throw Error('Missing provenance: '+s.id);row.unit=s.category==='pendant'?'件':'颗';}
reference.unit='CNY per bead / per pendant';reference.method+=' 非圆珠使用明确列出的逐SKU参考零售模板，按实际造型分别估算；批发价与参考零售价分开记录。';
reference.limitations=reference.limitations.filter(x=>!x.includes('原非圆珠'));reference.limitations.push('全607个SKU均有参考价；非圆珠为同类估算，不代表同款市场成交价或商家确认售价。','金色/银色仅为外观，不按足金或S925银计价；琥珀、玉石、稀有木种和装饰钻材质需商家确认。','小量零售估算中的分拣包装余量为本站定价假设，并非外部报价；制作费与运费不含在内。');
pricing.estimatedSkuIds=[...new Set([...(pricing.estimatedSkuIds||[]),...additions.map(x=>x.id)])];
pricing.note='全部商品采用人民币参考单价；珠子按颗、吊坠按件。含公开报价换算与同类零售估算，品质、采购成本及最终售价待商家核验；不含运费与未配置的制作费。';
write('pricing.json',pricing);write('price-reference.json',reference);
const labels=read('price-method-labels.json');for(const r of additions)labels[r.basis]=r.basisLabel;write('price-method-labels.json',labels);
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
let html='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CrystalMuse 参考定价依据</title><style>body{max-width:1100px;margin:auto;padding:24px;font:14px/1.8 system-ui;color:#27104e;background:#faf8ff}table{border-collapse:collapse;width:100%;background:white}td,th{padding:9px;text-align:left;border-bottom:1px solid #e6deef}a{color:#64379f}.table{overflow:auto}h1{font-size:24px}li{margin:8px 0}</style><h1>人民币参考定价依据</h1><p>调研日：'+reference.checkedOn+'。607款商品均有参考价，珠子按颗、吊坠按件。公开报价换算与同类估算有明确区别，不代表实物等级或商家最终售价已确认。不含运费与未配置的制作费。</p><p><a href="index.html">返回DIY</a></p><h2>定价限制与假设</h2><ul>'+reference.limitations.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul><h2>公开来源、原始单位与估算方法</h2><ul>';
for(const s of reference.sources)html+='<li id="source-'+esc(s.id)+'"><a href="'+esc(s.url)+'" target="_blank" rel="noopener">'+esc(s.title)+'</a> · '+esc(s.unit)+'<br>'+esc(s.note)+'<br>报价记录：'+esc(JSON.stringify(s.observations||{}))+'</li>';
html+='</ul><h2>各商品参考单价</h2><p>同类估算不是外部网站的同款实价；金色/银色不表示贵金属含量。</p><div class="table"><table><thead><tr><th>商品</th><th>外观</th><th>规格</th><th>参考单价</th><th>定价依据</th></tr></thead><tbody>';
for(const x of reference.rows)html+='<tr><td>'+esc(x.name)+'</td><td>'+esc((x.appearance||[]).join(' / '))+'</td><td>'+esc(x.diameterMm?x.diameterMm+'mm':(x.sizeMm||[]).join(' × ')+'mm')+'</td><td>¥'+(x.priceMinor/100).toFixed(2)+' / '+x.unit+'</td><td><a href="#source-'+esc(x.sourceId)+'">'+esc(x.basisLabel)+'</a></td></tr>';
fs.writeFileSync(path.join(root,'price-reference.html'),html+'</tbody></table></div></html>');
console.log(JSON.stringify({added:additions.length,total:catalog.length,priced:catalog.filter(x=>Number.isSafeInteger(pricing.unitPricesMinor[x.id])).length}));
