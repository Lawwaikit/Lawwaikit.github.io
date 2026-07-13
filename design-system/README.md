# design-system/

本站的设计探索与方案存档目录。**这些文件均为设计稿 / 规划文档，不参与线上部署的页面逻辑**。站点实际使用的视觉由 `css/clay-cool.css`（限定 `body.clay` 作用域）+ `css/style.css` 决定。

## 目录结构

```
design-system/
├── README.md                 # 本说明
├── palettes.json             # 【当前可用】8 套配色方案（W1-W4 暖 / C1-C4 冷），含完整色值与阴影
├── CONTENT-PLAN.md           # 【选定方向】内容架构方案（A 作品集 / B 写作花园 / C 单页滚动★ / D 完整分站）+ 执行计划
├── styles/                   # 视觉风格探索（独立 HTML，可浏览器直接打开）
│   ├── compare.html          # 对比中枢：内嵌 iframe 展示 01–05（注意仅链接到 05，06/07/08 为独立页）
│   ├── 01-swiss.html         # 国际主义 Swiss（纯白 + 瑞士红，无圆角无阴影）
│   ├── 02-brutalist.html     # 新粗野主义（米黄 + 黑边 + 撞色，硬偏移阴影、旋转贴纸）
│   ├── 03-clay.html          # 有机柔感 Clay（暖奶油 + 陶土，全圆角，原始暖色版）
│   ├── 04-terminal.html      # 终端暗色（近黑暖底 + 琥珀/青，等宽，点阵背景）
│   ├── 05-clay-cool.html     # 冷调克制 Clay（基于 03，圆角收紧 + C3 冷色，最终采用方向）
│   ├── 06-palettes.html      # 暖/冷各 4 组配色对比（固定 05 圆角，仅换色）
│   ├── 07-content-plans.html# 内容架构方案（文字 + 线框版，已被 08 替代为渲染版）
│   └── 08-content-designs.html # 内容架构方案（渲染版，真实 mockup，对应 CONTENT-PLAN.md）
└── archive/                  # 历史快照（不再维护）
    └── 2026-07-13-paper-and-ink/
        ├── design-tokens.json   # 最初的 Paper & Ink 设计令牌导出
        ├── themes.json          # 最初的 4 套替代主题
        └── theme-explorer.html  # 最初的主题可视化预览
```

## 说明

- `archive/` 内的三份文件（design-tokens / themes / theme-explorer）是 **Paper & Ink 暖色编辑风** 时期的产物，已被 Clay Cool（C3 冷色）全面取代，仅留档备查。根目录原先也有它们的副本，已删除去重。
- 站点当前视觉语言：**Clay Cool（05）+ C3 配色（青碧 `#2E8B86` / 板岩 `#5C7C84`）**，圆角克制（大面 14 / 按钮 12 / 导航 16 / 导航链接 10 / 图标 12，微芯片药丸）。
- 切换配色方案：编辑 `css/style.css` 的 `:root` 与 `[data-theme="dark"]` 变量块，或直接套用 `palettes.json` 中某套的色值。
- `styles/compare.html` 仅内嵌了 01–05 的 iframe；06/07/08 为独立预览页，可直接打开。
