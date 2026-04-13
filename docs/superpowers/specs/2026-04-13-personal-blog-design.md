# 个人博客网站设计文档

**日期：** 2026-04-13  
**项目：** fred.github.io 个人博客网站

---

## 1. 项目概述

### 1.1 目标
基于 Hexo 静态站点生成器，构建类似 cxhello.top 的个人博客网站，通过 GitHub Actions 自动部署到 GitHub Pages。

### 1.2 核心功能
- **博客文章系统**：Markdown 文章、分类、标签、归档、搜索
- **项目作品展示**：项目列表、详情页、技术栈、GitHub 链接
- **代码片段集合**：代码示例、分类管理、复制功能
- **关于我页面**：个人介绍、工作经历、技能栈、联系方式

### 1.3 目标用户
- 访客：阅读技术文章、查看项目作品、了解博主
- 博主：通过 Git 管理内容、快速发布更新

---

## 2. 技术方案

### 2.1 技术栈
- **站点生成器**：Hexo (Node.js)
- **主题**：Butterfly（功能强大、支持深色模式、可定制性强）
- **部署平台**：GitHub Pages
- **CI/CD**：GitHub Actions
- **内容管理**：Git 仓库 + Markdown 文件

### 2.2 架构流程
```
本地 Markdown → Git Push → GitHub Actions → Hexo Generate → GitHub Pages → 用户访问
```

### 2.3 目录结构
```
fred.github.io/
├── source/
│   ├── _posts/              # 博客文章
│   ├── _data/               # 数据文件
│   │   ├── projects.yml     # 项目列表
│   │   └── snippets.yml     # 代码片段
│   ├── about/
│   │   └── index.md         # 关于页面
│   └── projects/
│       └── index.md         # 项目页面
├── themes/
│   └── butterfly/           # Butterfly 主题
├── scaffolds/               # 文章模板
├── public/                  # 生成的静态文件
├── _config.yml              # 站点配置
├── _config.butterfly.yml    # 主题配置
└── .github/
    └── workflows/
        └── deploy.yml       # 自动部署配置
```

---

## 3. 视觉设计

### 3.1 配色方案
采用**深色主题**（参考现有 index.html 的配色风格）：
- 主背景：#080810 ~ #12121f
- 强调色：#6c63ff（紫色调）
- 辅助强调：#00d4aa（绿色调）
- 文字：#e8e8f0（主）、#8888aa（次）
- 边框：#1e1e38 ~ #2a2a50

### 3.2 主题定制要点
- **导航栏**：固定顶部、深色背景、包含 Logo 和主要导航链接
- **首页**：个人简介卡片 + 最新文章列表 + 快速入口
- **文章页**：清爽排版、代码高亮、评论区（可选 Giscus）
- **项目页**：网格布局、项目卡片、技术标签
- **片段页**：分类过滤、代码展示、一键复制

### 3.3 响应式设计
- 支持移动端适配
- 断点：768px（平板）、480px（手机）

---

## 4. 核心功能设计

### 4.1 博客文章系统
- **文章结构**：
  ```markdown
  ---
  title: 文章标题
  date: 2026-04-13
  categories: [技术分类]
  tags: [标签1, 标签2]
  ---
  
  文章内容...
  ```
- **列表展示**：按时间排序、显示分类和标签
- **归档页面**：按年份归档文章
- **标签页面**：按标签聚合文章
- **搜索功能**：使用 Hexo 搜索插件

### 4.2 项目作品展示
- **数据存储**：source/_data/projects.yml
  ```yaml
  projects:
    - name: 项目名称
      desc: 项目描述
      tech: [Java, Redis, Kafka]
      link: https://github.com/...
      demo: https://demo-url
  ```
- **展示方式**：网格卡片布局、技术栈标签、GitHub 链接

### 4.3 代码片段集合
- **数据存储**：source/_data/snippets.yml
  ```yaml
  snippets:
    - title: 片段标题
      category: Java
      code: |
        public class Example {
          // 代码内容
        }
  ```
- **展示方式**：分类过滤、代码块展示、复制按钮

### 4.4 关于我页面
- **内容结构**：
  - 个人简介（照片、姓名、职业）
  - 工作经历
  - 技能栈
  - 联系方式（邮箱、GitHub、LinkedIn）

---

## 5. 部署方案

### 5.1 GitHub Actions 配置
```yaml
name: Deploy Hexo Blog

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: |
          npm install
          npm install hexo-cli -g
      
      - name: Generate Static Files
        run: hexo generate
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
          publish_branch: gh-pages
```

### 5.2 部署流程
1. 本地编写 Markdown 文章
2. Git push 到 main 分支
3. GitHub Actions 自动触发
4. 2-3 分钟完成构建和部署
5. 访问 fred.github.io 查看更新

---

## 6. 实施计划

### 6.1 第一阶段：基础搭建
- 初始化 Hexo 项目
- 安装并配置 Butterfly 主题
- 创建基本页面结构
- 配置 GitHub Actions 自动部署

### 6.2 第二阶段：功能开发
- 创建博客文章系统
- 实现项目展示功能
- 开发代码片段功能
- 完善关于我页面

### 6.3 第三阶段：内容填充
- 编写示例文章
- 添加项目数据
- 创建代码片段
- 优化视觉效果

### 6.4 第四阶段：优化与测试
- SEO 优化
- 性能优化
- 移动端测试
- 功能测试

---

## 7. 成功标准

- 所有功能模块正常工作
- GitHub Actions 自动部署成功
- 网站访问流畅、响应快速
- 移动端体验良好
- SEO 基础优化完成

---

## 8. 风险与应对

| 风险 | 应对措施 |
|------|----------|
| 主题定制困难 | 参考 Butterfly 文档和社区示例 |
| 部署失败 | 检查 GitHub Actions 日志、逐步调试 |
| 功能需求变化 | Hexo 灵活配置、逐步迭代 |

---

**设计完成，等待用户确认后开始实施。**