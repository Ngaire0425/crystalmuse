研究路径未在app.js启用。锁定依赖见package-lock.json。
重建：npm ci，然后 npx esbuild ice-pathtrace.js --bundle --format=esm --minify --outfile=../vendor/ice-pathtrace.js
实际商业页面的有界折射源码在上级ice-optics.js、ice-materials.js、ice-layers.js，无需npm构建。
