# CF Pages Resume Template

一个基于 Markdown 的开源静态简历模板，适合作为公开仓库、个人站点示例，或二次定制的起点。

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

## 页面预览

![CF Pages Resume Template Screenshot](./screenshots/cf-pages-resume-template-preview.png)

## 项目结构

```text
.
├── public/
│   ├── resume.md
│   ├── resume.en.md
│   ├── index.html
│   ├── main.js
│   ├── style.css
│   ├── robots.txt
│   └── _headers
├── package.json
├── wrangler.toml
└── .gitignore
```

## 特性

- Markdown 驱动
- 内置中英文切换
- 支持导出 PDF 和 Markdown
- 可直接部署到 Cloudflare Pages

## 快速开始

```bash
npm install
npm run dev
```

然后访问 `http://localhost:8080`。

## 如何自定义

- 编辑 `public/resume.md` 自定义中文简历
- 编辑 `public/resume.en.md` 自定义英文简历
- 编辑 `public/style.css` 调整样式

## 部署

### 一键进入 Cloudflare Pages

点击上方 `Deploy to Cloudflare Pages` 按钮，会打开 Cloudflare 的 `Workers & Pages` 控制台入口，你可以直接创建并连接这个仓库。

### Wrangler 直接部署

```bash
npm run login
npm run deploy
```

### GitHub 仓库连接部署

1. 进入 Cloudflare `Workers & Pages`
2. 选择 `Create application`
3. 选择 `Pages` -> `Connect to Git`
4. 选择你的仓库 `wenyuanw/cf-pages-resume-template`
5. 构建配置保持为空，输出目录填写 `public`
