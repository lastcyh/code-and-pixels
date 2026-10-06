# Code & Pixels

![Node.js >= 20](https://img.shields.io/badge/node.js-%3E%3D20-brightgreen)
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

基于开源博客主题 [Fuwari](https://github.com/saicaca/fuwari) 构建的个人博客，运行在腾讯云 [EdgeOne Pages](https://edgeone.ai/products/pages) 上。

**线上地址**：[www.sakasa.cn](https://www.sakasa.cn/)

## ✨ 站点特性

在 Fuwari 原有能力（Astro 5 + Svelte 5 + Tailwind CSS、明暗模式、主题色自定义、Pagefind 全文搜索、文章目录、RSS、平滑切页动画）基础上，做了以下定制：

- 📊 **文章浏览量 & 点赞** — 基于 EdgeOne Pages Functions（`functions/api/stats.js`）+ KV 存储实现；浏览器端通过 sessionStorage / localStorage 防止刷新重复计数
- 📖 **阅读进度条** — 固定在页面顶部，跟随滚动（`src/components/control/ReadingProgress.astro`）
- 🔍 **中文搜索优化** — Pagefind 强制中文分词（`pagefind.yml`）
- 🚧 **自定义 404 页** — 展示最近的文章（`src/pages/404.astro`）
- 🇨🇳 **页脚 ICP / 公安备案信息**

## 🚀 部署（EdgeOne Pages）

仓库已通过 Git 集成绑定 EdgeOne Pages：**push 到 `master` 分支即自动构建部署**，无需手动操作。

- 构建命令：`pnpm build`（Astro 构建 + Pagefind 搜索索引），输出目录 `dist/`
- 环境要求：Node.js >= 20

**必需的资源绑定**：

| 绑定 | 变量名 | 用途 |
|------|--------|------|
| KV 命名空间 | `BLOG_STATS` | 浏览量 / 点赞计数存储；未绑定时 `/api/stats` 会返回 500 |

`/api/stats` 接口说明（`functions/api/stats.js`）：

- `GET /api/stats?slug=<文章slug>` — 查询某篇文章的浏览量和点赞数
- `POST /api/stats?slug=<文章slug>&action=view` — 浏览量 +1（同一 IP 每天每篇只计一次）
- `POST /api/stats?slug=<文章slug>&action=like` — 点赞 +1

## ✍️ 写文章

```sh
pnpm new-post <filename>
```

然后在 `src/content/posts/` 中编辑生成的 Markdown 文件：

```yaml
---
title: 文章标题
published: 2026-01-01
description: 文章摘要
image: ./cover.jpg            # 可选，封面图（相对文章目录或 /public）
tags: [标签1, 标签2]
category: 分类
draft: false                  # true 则不会发布
---
```

站点标题、导航链接、头像、社交链接等在 `src/config.ts` 中修改；主题色、banner、目录开关也在这里配置。

## ⚡ 常用命令

| 命令 | 作用 |
|:---------------------------|:----------------------------------------|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 启动本地开发服务器 `localhost:4321` |
| `pnpm build` | 构建生产版本到 `./dist/`（含 Pagefind 索引） |
| `pnpm preview` | 本地预览构建产物 |
| `pnpm new-post <filename>` | 新建文章 |
| `pnpm format` | 使用 Biome 格式化代码 |

## 📄 致谢与许可

- 界面与主题基于 [saicaca/fuwari](https://github.com/saicaca/fuwari)（MIT License），感谢原作者与社区贡献者
- 本仓库的定制部分同样以 MIT License 发布
