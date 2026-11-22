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
| `assets/guide/` | Crystal Guide 原石与净化配图（14 张 jpg） | D |
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

## Mystic Corner 本轮内容（D 部分，A 已整合）

- Crystal Guide 从 3 种扩到 10 种：Amethyst、Clear Quartz、Rose Quartz、Citrine、Garnet、Moonstone、Peridot、Lapis Lazuli、Obsidian、Tiger's Eye。每种一张原石微距图（`assets/guide/<id>.jpg`，暖白手工纸、自然光、无文字），文章按 Colour / Culture / Care 三段，并附 GIA 参考链接。
- 新增「Cleansing & recharging」板块三篇：Clear Quartz 原石净化（日晒与月光、清水与干布）、Sage 鼠尾草烟熏（来源、简短方法、替代做法）、Herb bundle 药草窝充能（干草与花瓣窝、静置一晚）。配图 `assets/guide/cleanse_quartz.jpg`、`cleanse_sage.jpg`、`cleanse_herbs.jpg`。
- 生辰石文章重写为《Birthstones, month by month》：什么是生辰石、为什么各家的名单不同、不想按石头选时怎么办、按月送礼、送出前的护理、关于寓意的说明；全篇不点名任何一种水晶，配图为中性礼盒与棉麻袋（`assets/guide/gifting.jpg`）。
- 十二星座页改为完整档案：日期、元素、模式、关键词，加 Reflection / A small step / Worth noticing 三段，文案取自 D 提供的 12 段英文原文；每张卡底部附「今日一句」，按本地日期从对应元素的提示池里取句，同一天稳定、跨天自动更换。
- 星座结果页：深紫「Today」条 + Reflection / A small step / Worth noticing / Stone to pair / Crystal Guide 五张卡；三卡牌阵与单牌结果页的卡片文字颜色按卡面深浅自适应（深紫卡浅色字、奶油卡深色字），说明性小字改为中紫灰，避免看不清。
## 已知限制

- 整站约 700MB（`studio/` 659MB，其中 glb 模型 600MB），已整体推到 GitHub（分支 `deploy`，远端 `main` 为同一内容）。仓库软上限 1GB，后续不要再往里塞大素材；若加载偏慢，优先做模型按需加载。
- 商品里的项链与戒指是 B 的商店品类；DIY 工作室只做手链，没有项链、戒指选项。
- 页面文案、价格、评价、占卜内容均为课程原型，占卜写成“文化参考 / 仅供娱乐”，不做功效承诺；表单不发送数据。
- Collections 第 2 页的两张卡图已按晶体归属修正：08 A Spark of Creativity 用拉长石吊坠（NE05），09 Embrace New Beginnings 用月光石手串（BR09）。

## 线上地址（GitHub Pages）

- 站点：<https://ngaire0425.github.io/crystalmuse/>（Pages 源：仓库 `main` 分支根目录，push 后自动重建）
- 首页 <https://ngaire0425.github.io/crystalmuse/crystalmuse.html>
- 商店 Shop：<https://ngaire0425.github.io/crystalmuse/shop.html>
- Collections <https://ngaire0425.github.io/crystalmuse/collection.html#/collections>
- DIY Studio <https://ngaire0425.github.io/crystalmuse/diy.html>
- Mystic Corner <https://ngaire0425.github.io/crystalmuse/mystic.html#/mystic>
- 仓库 <https://github.com/Ngaire0425/crystalmuse>（本地分支 `deploy`，与远端 `main` 同一提交）