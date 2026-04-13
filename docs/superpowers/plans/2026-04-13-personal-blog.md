# 个人博客网站实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal blog website based on Hexo, with automatic deployment to GitHub Pages.

**Architecture:** Hexo static site generator with Butterfly theme, content managed via Markdown files, deployed automatically via GitHub Actions.

**Tech Stack:** Hexo, Butterfly theme, Node.js 18, GitHub Pages, GitHub Actions

---

## File Structure

**Create:**
- `package.json` - Node.js project dependencies
- `_config.yml` - Hexo site configuration
- `_config.butterfly.yml` - Butterfly theme configuration
- `.github/workflows/deploy.yml` - GitHub Actions deployment workflow
- `.gitignore` - Ignore node_modules and generated files
- `source/_posts/` - Blog posts directory
- `source/_data/projects.yml` - Projects data
- `source/_data/snippets.yml` - Code snippets data
- `source/about/index.md` - About page
- `source/projects/index.md` - Projects page
- `source/snippets/index.md` - Snippets page
- `themes/butterfly/` - Butterfly theme (installed via npm)

**Backup:**
- `index.html` - Backup existing index.html for reference

---

## Phase 1: Project Initialization

### Task 1: Install Hexo and Initialize Project

**Files:**
- Create: `package.json`

- [ ] **Step 1: Check Node.js version**

Run: `node --version`
Expected: Node.js 18.x or higher installed

- [ ] **Step 2: Initialize Hexo project**

Run: `npx hexo init . --no-install`
Expected: Hexo scaffolding created in current directory

- [ ] **Step 3: Install Hexo dependencies**

Run: `npm install`
Expected: Dependencies installed successfully

- [ ] **Step 4: Verify Hexo installation**

Run: `npx hexo version`
Expected: Hexo version info displayed

- [ ] **Step 5: Commit initial setup**

Run: `git add package.json package-lock.json scaffolds/ source/ && git commit -m "feat: initialize Hexo project"`
Expected: Initial commit created

---

### Task 2: Backup Existing Index.html

**Files:**
- Move: `index.html` → `backup/index.html`

- [ ] **Step 1: Create backup directory**

Run: `mkdir -p backup`
Expected: backup directory created

- [ ] **Step 2: Move index.html to backup**

Run: `mv index.html backup/index.html`
Expected: index.html moved to backup directory

- [ ] **Step 3: Commit backup**

Run: `git add backup/ && git commit -m "backup: save original index.html"`
Expected: Backup committed

---

## Phase 2: Theme Installation and Configuration

### Task 3: Install Butterfly Theme

**Files:**
- Create: `themes/butterfly/`

- [ ] **Step 1: Install Butterfly theme**

Run: `npm install hexo-theme-butterfly`
Expected: Butterfly theme installed in node_modules

- [ ] **Step 2: Copy theme to themes directory**

Run: `cp -r node_modules/hexo-theme-butterfly themes/butterfly`
Expected: Theme copied to themes/butterfly

- [ ] **Step 3: Verify theme installation**

Run: `ls themes/butterfly`
Expected: Theme files visible

- [ ] **Step 4: Commit theme setup**

Run: `git add themes/ && git commit -m "feat: install Butterfly theme"`
Expected: Theme committed

---

### Task 4: Configure Site Settings

**Files:**
- Modify: `_config.yml`

- [ ] **Step 1: Read current _config.yml**

Run: `cat _config.yml`
Expected: Default Hexo config displayed

- [ ] **Step 2: Update site configuration**

Edit `_config.yml`:

```yaml
# Site
title: fred's Blog
subtitle: 'Backend Engineer'
description: 'Personal blog for sharing technical knowledge and experience'
keywords: 'backend, java, go, distributed systems'
author: fred
language: zh-CN
timezone: 'Asia/Shanghai'

# URL
url: https://fred.github.io
permalink: :year/:month/:day/:title/
permalink_defaults:
pretty_urls:
  trailing_index: false

# Directory
source_dir: source
public_dir: public
tag_dir: tags
archive_dir: archives
category_dir: categories
code_dir: downloads/code
i18n_dir: :lang
skip_render:

# Writing
new_post_name: :title.md
default_layout: post
titlecase: false
external_link:
  enable: true
filename_case: 0
render_drafts: false
post_asset_folder: false
relative_link: false
future: true
highlight:
  enable: true
  line_number: true
  auto_detect: false
  tab_replace: ''
  wrap: true
  hljs: false
prismjs:
  enable: false
  preprocess: true
  line_number: true
  tab_replace: ''

# Home page setting
index_generator:
  path: ''
  per_page: 10
  order_by: -date

# Category & Tag
default_category: uncategorized
category_map:
tag_map:

# Metadata elements
meta_generator: true

# Date / Time format
date_format: YYYY-MM-DD
time_format: HH:mm:ss

# Pagination
per_page: 10
pagination_dir: page

# Theme
theme: butterfly

# Deployment
deploy:
  type: git
  repo: https://github.com/fred/fred.github.io.git
  branch: gh-pages
```

- [ ] **Step 3: Commit site configuration**

Run: `git add _config.yml && git commit -m "feat: configure site settings"`
Expected: Config committed

---

### Task 5: Configure Butterfly Theme

**Files:**
- Create: `_config.butterfly.yml`

- [ ] **Step 1: Create Butterfly config file**

Create `_config.butterfly.yml`:

```yaml
# Theme Configuration for Butterfly

# Navigation
menu:
  Home: / || fa fa-home
  Blog: /archives/ || fa fa-archive
  Projects: /projects/ || fa fa-folder-open
  Snippets: /snippets/ || fa fa-code
  About: /about/ || fa fa-user

# Code highlight
highlight_theme: dark

# Theme style
theme_style: dark

# Font
font:
  global-font-size: 14px
  code-font-size: 13px

# Footer
footer:
  owner:
    enable: true
    since: 2026
  custom_text: <span style="color: #8888aa;">Built with Hexo and Butterfly</span>

# Social links
social:
  github: https://github.com/fred || fa fa-github
  email: mailto:your@email.com || fa fa-envelope

# Post settings
post:
  meta:
    author: true
    date: true
    categories: true
    tags: true
  toc:
    enable: true
    number: true

# Archives
archive:
  enable: true
  type: month

# Search
search:
  enable: true
  type: local
  placeholder: Search articles

# Comments (optional - using Giscus)
comments:
  enable: false
  # Can enable Giscus later if needed

# CDN optimization
cdn:
  enable: false

# Lazy loading
lazyload:
  enable: true

# PWA support
pwa:
  enable: false

# Performance optimization
optimize:
  enable: true
```

- [ ] **Step 2: Commit theme configuration**

Run: `git add _config.butterfly.yml && git commit -m "feat: configure Butterfly theme"`
Expected: Theme config committed

---

## Phase 3: GitHub Actions Deployment

### Task 6: Setup GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `.gitignore`

- [ ] **Step 1: Create .github/workflows directory**

Run: `mkdir -p .github/workflows`
Expected: Directory created

- [ ] **Step 2: Create deployment workflow file**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Hexo Blog to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install Dependencies
        run: |
          npm ci
          npm install hexo-cli -g
      
      - name: Generate Static Files
        run: |
          hexo clean
          hexo generate
      
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public
  
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Create .gitignore file**

Create `.gitignore`:

```
.DS_Store
node_modules/
public/
.deploy_git/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.idea/
.superpowers/
backup/
```

- [ ] **Step 4: Commit deployment configuration**

Run: `git add .github/ .gitignore && git commit -m "feat: add GitHub Actions deployment workflow"`
Expected: Deployment config committed

---

## Phase 4: Content Creation

### Task 7: Create About Page

**Files:**
- Create: `source/about/index.md`

- [ ] **Step 1: Create about directory**

Run: `mkdir -p source/about`
Expected: Directory created

- [ ] **Step 2: Create about page content**

Create `source/about/index.md`:

```markdown
---
title: 关于我
type: "about"
---

## 个人简介

Hi! I'm **fred** 👋

一名后端开发工程师，专注于高并发系统设计与分布式架构。

## 基本信息

- 📍 地点：中国
- 💼 职业：后端工程师
- 🔧 技术栈：Java / Go / Python / Node.js
- ⚡ 兴趣：系统设计、性能优化、开源项目

## 工作经历

### 202X - 现在：某科技公司

**职位：后端工程师**

- 负责核心系统的设计与开发
- 参与多个项目的性能优化工作
- 推动团队的技术规范和最佳实践

## 技术栈

### 编程语言
- **Java** - 主要开发语言，熟悉 Spring Boot/Cloud
- **Go** - 服务端开发，高性能场景
- **Python** - 数据处理、自动化脚本
- **Node.js** - 服务端开发、工具链

### 框架与中间件
- Spring Boot / Spring Cloud
- Redis / Kafka / MySQL
- Elasticsearch / MongoDB

### 云原生
- Docker / Kubernetes
- CI/CD (Jenkins / ArgoCD)
- Prometheus / Grafana

## 联系方式

- 📧 Email：your@email.com
- 🔗 GitHub：https://github.com/fred
- 💼 LinkedIn：linkedin.com/in/fred

---

> 专注于技术分享与知识沉淀，欢迎交流！
```

- [ ] **Step 3: Commit about page**

Run: `git add source/about/ && git commit -m "content: create about page"`
Expected: About page committed

---

### Task 8: Create Projects Page and Data

**Files:**
- Create: `source/projects/index.md`
- Create: `source/_data/projects.yml`

- [ ] **Step 1: Create projects directory**

Run: `mkdir -p source/projects && mkdir -p source/_data`
Expected: Directories created

- [ ] **Step 2: Create projects data file**

Create `source/_data/projects.yml`:

```yaml
projects:
  - name: 高并发交易系统
    desc: 面向C端的核心交易链路，支撑大促场景下的瞬时流量洪峰
    tech:
      - Java
      - Redis
      - Kafka
      - Spring Cloud
    highlights:
      - QPS 从 3000 提升至 50000+
      - 接口 P99 从 800ms 降至 120ms
      - 大促零故障
    link: https://github.com/fred/trading-system
    demo: 
    status: completed
  
  - name: 微服务网关平台
    desc: 统一的 API 网关服务，负责鉴权、限流、路由与监控
    tech:
      - Go
      - Netty
      - Nacos
      - Prometheus
    highlights:
      - 网关吞吐提升 40%
      - 支持 JWT + OAuth2 双模认证
      - 实时监控 500+ 指标
    link: https://github.com/fred/api-gateway
    demo: 
    status: completed
  
  - name: 智能数据同步引擎
    desc: 跨数据库、跨数据源的实时同步系统，基于 CDC 技术实现
    tech:
      - Java
      - Canal
      - Elasticsearch
      - Flink
    highlights:
      - MySQL → ES 实时同步
      - 数据一致性 99.99%
      - 支持百万级 TPS
    link: https://github.com/fred/data-sync
    demo: 
    status: completed
  
  - name: DevOps 自动化平台
    desc: 内部 CI/CD 与运维管理平台，提升研发效率
    tech:
      - Python
      - Docker
      - Kubernetes
      - ArgoCD
    highlights:
      - 发布耗时从 40 分钟降至 8 分钟
      - 生产变更风险降低 70%
      - 自动化覆盖 200+ 运维任务
    link: https://github.com/fred/devops-platform
    demo: 
    status: in-progress
```

- [ ] **Step 3: Create projects page**

Create `source/projects/index.md`:

```markdown
---
title: 项目作品
type: "projects"
---

{% for project in site.data.projects.projects %}
<div class="project-card">
  <h3>{{ project.name }}</h3>
  <p>{{ project.desc }}</p>
  
  <div class="project-tech">
    {% for tech in project.tech %}
    <span class="tech-tag">{{ tech }}</span>
    {% endfor %}
  </div>
  
  {% if project.highlights %}
  <ul class="project-highlights">
    {% for highlight in project.highlights %}
    <li>{{ highlight }}</li>
    {% endfor %}
  </ul>
  {% endif %}
  
  <div class="project-links">
    {% if project.link %}
    <a href="{{ project.link }}" target="_blank">GitHub →</a>
    {% endif %}
    {% if project.demo %}
    <a href="{{ project.demo }}" target="_blank">Demo →</a>
    {% endif %}
  </div>
</div>
{% endfor %}
```

- [ ] **Step 4: Commit projects setup**

Run: `git add source/projects/ source/_data/ && git commit -m "content: create projects page and data"`
Expected: Projects committed

---

### Task 9: Create Snippets Page and Data

**Files:**
- Create: `source/snippets/index.md`
- Create: `source/_data/snippets.yml`

- [ ] **Step 1: Create snippets directory**

Run: `mkdir -p source/snippets`
Expected: Directory created (source/_data already exists)

- [ ] **Step 2: Create snippets data file**

Create `source/_data/snippets.yml`:

```yaml
snippets:
  - title: Java - 分布式锁实现
    category: Java
    description: 基于 Redis 的分布式锁实现示例
    code: |
      public class RedisDistributedLock {
          private final RedisTemplate<String, String> redisTemplate;
          
          public boolean tryLock(String key, String value, long expireTime) {
              return redisTemplate.opsForValue()
                  .setIfAbsent(key, value, expireTime, TimeUnit.SECONDS);
          }
          
          public void unlock(String key, String value) {
              String script = "if redis.call('get', KEYS[1]) == ARGV[1] " +
                              "then return redis.call('del', KEYS[1]) " +
                              "else return 0 end";
              redisTemplate.execute(
                  new DefaultRedisScript<>(script, Long.class),
                  Collections.singletonList(key),
                  value
              );
          }
      }
  
  - title: Go - 并发控制模式
    category: Go
    description: 使用 channel 控制并发任务
    code: |
      func concurrentWorker(tasks []Task, maxWorkers int) {
          sem := make(chan struct{}, maxWorkers)
          var wg sync.WaitGroup
          
          for _, task := range tasks {
              wg.Add(1)
              sem <- struct{}{}
              
              go func(t Task) {
                  defer wg.Done()
                  defer func() { <-sem }()
                  
                  processTask(t)
              }(task)
          }
          
          wg.Wait()
      }
  
  - title: Python - 数据处理管道
    category: Python
    description: 使用生成器实现数据处理管道
    code: |
      def data_pipeline(source):
          """数据处理管道示例"""
          # Step 1: 读取数据
          for item in read_data(source):
              # Step 2: 过滤无效数据
              if validate(item):
                  # Step 3: 转换格式
                  transformed = transform(item)
                  # Step 4: 输出结果
                  yield transformed
      
      def process_data(source):
          pipeline = data_pipeline(source)
          for data in pipeline:
              save_to_database(data)
  
  - title: Redis - 缓存穿透防护
    category: Redis
    description: 使用布隆过滤器防止缓存穿透
    code: |
      # Redis Bloom Filter 使用示例
      # 1. 初始化布隆过滤器
      BF.ADD user_ids:filter user123
      BF.ADD user_ids:filter user456
      
      # 2. 检查用户是否存在
      BF.EXISTS user_ids:filter user123  # 返回 1
      BF.EXISTS user_ids:filter nonexist # 返回 0
      
      # 3. 在应用层配合使用
      # 先检查布隆过滤器，不存在直接返回
      # 存在再查询缓存和数据库
```

- [ ] **Step 3: Create snippets page**

Create `source/snippets/index.md`:

```markdown
---
title: 代码片段
type: "snippets"
---

{% for snippet in site.data.snippets.snippets %}
<div class="snippet-card">
  <div class="snippet-header">
    <span class="snippet-category">{{ snippet.category }}</span>
    <h3>{{ snippet.title }}</h3>
  </div>
  
  <p class="snippet-desc">{{ snippet.description }}</p>
  
  <div class="snippet-code">
    <pre><code class="language-{{ snippet.category | downcase }}">{{ snippet.code }}</code></pre>
  </div>
</div>
{% endfor %}
```

- [ ] **Step 4: Commit snippets setup**

Run: `git add source/snippets/ source/_data/snippets.yml && git commit -m "content: create snippets page and data"`
Expected: Snippets committed

---

### Task 10: Create Sample Blog Posts

**Files:**
- Create: `source/_posts/2026-04-13-hello-world.md`
- Create: `source/_posts/2026-04-12-distributed-system-design.md`

- [ ] **Step 1: Create first sample post**

Create `source/_posts/2026-04-13-hello-world.md`:

```markdown
---
title: Hello World - 博客开篇
date: 2026-04-13 10:00:00
categories: 
  - 博客
tags:
  - Hexo
  - 开始
---

欢迎来到我的博客！

这是第一篇测试文章，用来验证博客系统是否正常工作。

## 为什么写博客？

作为一名后端工程师，我希望通过博客：

1. **记录学习过程** - 系统化整理技术知识
2. **分享经验** - 帮助遇到类似问题的开发者
3. **沉淀思考** - 深入思考技术背后的原理

## 博客技术栈

这个博客使用的技术：

- **Hexo** - 静态站点生成器
- **Butterfly** - 优雅的主题
- **GitHub Pages** - 免费的托管服务
- **GitHub Actions** - 自动部署

## 未来计划

后续会陆续分享：

- 分布式系统设计
- 性能优化实践
- 技术架构思考
- 开源项目介绍

---

> 持续学习，持续分享！
```

- [ ] **Step 2: Create second sample post**

Create `source/_posts/2026-04-12-distributed-system-design.md`:

```markdown
---
title: 分布式系统设计基础概念
date: 2026-04-12 15:30:00
categories:
  - 技术架构
tags:
  - 分布式
  - 系统设计
  - CAP理论
---

分布式系统是现代大规模系统的基础架构。本文介绍分布式系统的核心概念。

## 什么是分布式系统？

分布式系统是由多台计算机组成的系统，这些计算机：

- 协同工作
- 对用户呈现为单一系统
- 通过网络通信

## CAP 理论

CAP 理论指出分布式系统最多只能同时满足三项中的两项：

1. **Consistency（一致性）** - 所有节点看到相同的数据
2. **Availability（可用性）** - 每个请求都能得到响应
3. **Partition tolerance（分区容错）** - 网络分区时系统仍能运行

### 常见选择

- **CP 系统**：MongoDB、HBase
- **AP 系统**：Cassandra、DynamoDB
- **CA 系统**：传统单机数据库（无网络分区场景）

## 分布式系统的挑战

### 1. 网络不可靠

网络延迟、丢包、分区是常态。

### 2. 数据一致性

如何在分布式环境下保证数据一致性？

### 3. 容错设计

系统需要处理节点故障。

## 解决方案

- **副本机制** - 数据冗余提高可用性
- **分片机制** - 数据分散提高扩展性
- **一致性协议** - Paxos、Raft 等

## 实践建议

1. **明确需求** - 根据业务选择合适的架构
2. **简化设计** - 不必要的分布式会带来复杂性
3. **监控到位** - 分布式系统的可观测性非常重要

---

> 分布式系统没有银弹，根据场景选择合适的方案。
```

- [ ] **Step 3: Commit sample posts**

Run: `git add source/_posts/ && git commit -m "content: add sample blog posts"`
Expected: Sample posts committed

---

## Phase 5: Testing and Deployment

### Task 11: Test Local Build

**Files:**
- None (verification task)

- [ ] **Step 1: Clean previous build**

Run: `npx hexo clean`
Expected: Public directory cleaned

- [ ] **Step 2: Generate static files**

Run: `npx hexo generate`
Expected: Static files generated successfully

- [ ] **Step 3: Start local server**

Run: `npx hexo server`
Expected: Server started at http://localhost:4000

- [ ] **Step 4: Verify in browser**

Manual: Open http://localhost:4000
Expected: Blog website displays correctly

- [ ] **Step 5: Stop server**

Run: Stop server with Ctrl+C (in terminal running hexo server)
Expected: Server stopped

---

### Task 12: Push to GitHub and Deploy

**Files:**
- None (deployment task)

- [ ] **Step 1: Push all commits to GitHub**

Run: `git push origin main`
Expected: All commits pushed to GitHub

- [ ] **Step 2: Verify GitHub Actions trigger**

Manual: Check GitHub Actions page at https://github.com/fred/fred.github.io/actions
Expected: Workflow triggered and running

- [ ] **Step 3: Wait for deployment completion**

Manual: Wait 2-3 minutes for workflow to complete
Expected: Workflow shows "Success" status

- [ ] **Step 4: Enable GitHub Pages**

Manual: 
1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Save settings
Expected: GitHub Pages enabled with Actions source

- [ ] **Step 5: Verify deployed website**

Manual: Open https://fred.github.io
Expected: Blog website accessible and functional

---

## Post-Deployment: Additional Enhancements

### Task 13: Add More Blog Posts (Optional)

**Files:**
- Create: `source/_posts/` (additional posts)

- [ ] **Step 1: Create additional technical posts**

Create additional markdown files in `source/_posts/` as needed for your content.

- [ ] **Step 2: Generate and deploy**

Run: `git add source/_posts/ && git commit -m "content: add more blog posts" && git push`
Expected: New posts deployed

---

## Self-Review Checklist

After completing all tasks:

- [ ] Spec coverage: All 4 functional modules (Blog, Projects, Snippets, About) implemented?
- [ ] Placeholder scan: No TBD, TODO, or vague instructions in plan?
- [ ] Type consistency: Data file structures match page templates?
- [ ] Deployment: GitHub Actions workflow tested and working?
- [ ] Testing: Local build verified, deployed site accessible?

---

## Success Criteria

1. ✅ All functional modules working
2. ✅ GitHub Actions auto-deploy configured
3. ✅ Website accessible at fred.github.io
4. ✅ Mobile-responsive design
5. ✅ Blog posts displaying correctly
6. ✅ Projects and snippets pages functional

---

**Plan complete. Ready for execution.**