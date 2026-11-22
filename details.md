# CrystalMuse — 整合版站点说明（A 部分负责人：韦沂均）

## 怎么打开 / 怎么预览

- 双击 `Preview CrystalMuse.cmd`，会在本机启动一个小服务器并打开 `http://127.0.0.1:8899/`。
- 不能直接双击 `index.html`：DIY 工作室用的是 ES module 与 3D 模型，`file://` 下会被浏览器安全策略拦住，必须走 http。
- `index.html` 只是跳转页，真正的首页是 `crystalmuse.html`。

## 文件结构

| 文件 | 内容 | 负责 |
| --- | --- | --- |
| `crystalmuse.html` | 首页（Bento Grid）+ About + Contact & FAQ | A |
| `shop.html` | 商店：30 件商品、分类筛选、商品详情 | B |
| `diy.html` | DIY Studio 外壳页，内嵌 `studio/` 的 3D 串珠工作室 | C |
| `mystic.html` | Mystic Corner / Tarot / Zodiac / Crystal Guide / Crystal Quiz / Reading Results | D |
| `collection.html` | Collections 模块：九章 Impulse stories + 故事详情 | 组员模块（A 整合） |
| `assets/collection/` | Collections 章节配图（webp） | 组员模块（A 整合） |
| `studio/` | 串珠工作室本体（Three.js + 654 个 glb 模型） | C |
| `assets/`、`assets/products/` | 首页视觉稿 + 商品图 | A / B |
| `framework-studio-host.js/.css` | DIY 外壳页与工作室之间的 iframe 宿主 | A |

## 导航与跳转对照（全部已验证）

顶部导航（五个页面完全一致，8 项）：

1. Home → `crystalmuse.html`
2. Shop → `shop.html`
3. DIY Studio → `diy.html`
4. Mystic Corner → `mystic.html#/mystic`
5. Crystal Guide → `mystic.html#/guide`
6. About → `crystalmuse.html#/about`
7. Contact → `crystalmuse.html#/contact`

首页卡片是一整块可点击（`.card-hit` 覆盖层），点哪都能进：

- Featured 商品卡 → `shop.html`
- DIY 卡 → `diy.html`
- Mystic Corner 卡 → `mystic.html#/mystic`
- Crystal Quiz 卡 → `mystic.html#/quiz`
- 底部 Popular this week：商品 → `shop.html`，Design your own → `diy.html`，Impulse stories → `collection.html#/collections`
- 底部 Crystal Guide 三条 → `mystic.html#/guide`

移动端抽屉菜单已同步为同样的 8 项，编号 01–08；页脚 Explore 列也已补上 Collections。

## 视觉统一（A 的规范，接入新内容时沿用）

- 底色 `--bg #FAF6F0`；`--ink #220B4E`；`--plum #410F70`；`--violet #B69DFF`；`--lilac #DBC8FF`；`--cream #FFFDB6`；`--teal #75E8E7` 只作点缀。
- 字体：标题 Cormorant Garamond（`--serif`），正文 Inter（`--sans`）。B / C / D 页面统一加载同一组 Google Fonts。
- 卡片 34px 圆角、无描边、不用线框分割，靠 15px 留白分开。
- 站内不出现中文：B / D / Collections 的原生页面文本已全部英文化；C 的工作室除 `studio-english.js` 运行时本地化之外，款式名（`products.json`、`beads.json` 里的「蜜桃色」「天然木纹」等）已直接改成英文（Peach、Natural grain 等），headless 渲染后 DOM 里已无中文字符。另外新增 `studio/crystalmuse-theme.css` 把工作室的米白底、无边框面板、衬线标题对齐到首页。
- 占卜相关：`.md-setup`（抽牌设置）与 `.md-position`（解读结果）为深紫渐变、无边框，文字与塔罗牌面直接落在卡面上；牌面本身去白底去描边，只留投影。
- Mystic Corner 落地页为 2×2 四宫格（≤700px 自动变单列）。

## 已知限制

- 整站约 700MB（`studio/` 659MB，其中 glb 模型 600MB），已整体推到 GitHub（分支 `deploy`，远端 `main` 为同一内容）。仓库软上限 1GB，后续不要再往里塞大素材；若加载偏慢，优先做模型按需加载。
- 商品里的项链与戒指是 B 的商店品类；DIY 工作室只做手链，没有项链、戒指选项。
- 页面文案、价格、评价、占卜内容均为课程原型，占卜写成“文化参考 / 仅供娱乐”，不做功效承诺；表单不发送数据。
- Collections 第 2 页的两张卡图已按晶体归属修正：08 A Spark of Creativity 用拉长石吊坠（NE05），09 Embrace New Beginnings 用月光石手串（BR09）。
