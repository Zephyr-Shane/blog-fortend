# 个人博客 · Blog

一个记录生活与技术、可对外分享的个人博客。当前处于**前端先行阶段**：Next.js 全栈应用 + 可写的 Mock API，前台与后台在同一工程，数据符合既定 API 契约，将来切换到 Spring Boot 后端只需改一个环境变量。

## 技术栈

- **Next.js 16**（App Router）+ **React 19** + **TypeScript**
- **Tailwind CSS 4**（Warm Editorial 设计系统）
- **TipTap 3**（富文本编辑器，正文输出 HTML）
- **lucide-react**（线性图标）
- Mock API：Next.js Route Handlers + 进程内可写存储

## 快速启动

```bash
npm install
npm run dev
```

打开 http://localhost:3000

后台入口 http://localhost:3000/admin，Mock 账号：`admin@zephyr.dev` / `admin123`

## 切换到真实后端

前端所有请求经 `src/lib/api.ts`，基地址由环境变量决定：

```bash
# 不设置 → 走 /api（当前 Mock）
# 设置后 → 走 Spring Boot
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

页面代码与 `src/lib/queries.ts` 无需改动。

## 图片

当前使用 `public/images/` 下的本地 SVG 占位图（暖编辑风格），不使用外部图床。mock 数据中的图片路径均指向这些 SVG。

`SmartImage` 组件统一处理三类图片源：本地相对路径走 next/image 优化，http(s) 在线链接与本地上传的 dataURL 走原生 img。后台的图片字段提供选择器：可填在线链接，也可选本地图片（Mock 阶段转 dataURL 内嵌，后端就绪后改调 `/api/admin/upload`，见 API 契约 3.3）。

文章署名是全站配置：在后台「系统管理 → 自定义配置」中修改「文章署名」，编辑器发布设置里只读展示；单篇文章可开启「是否共创」单独添加共创者。

面试栏目可在后台「自定义配置」中一键显示/隐藏（默认显示）。关闭后，前台导航、首页筛选与混排、面试页、搜索与标签聚合中的面试内容都会隐藏，面试页直接访问返回 404。

## 目录结构

```
src/
├── app/
│   ├── (site)/                      前台路由组（7 个栏目 + 标签 + 搜索）
│   ├── admin/                       管理后台（同工程，非独立服务）
│   │   ├── page.tsx                 仪表盘
│   │   ├── login/page.tsx           登录
│   │   ├── posts/                   文章列表 + TipTap 编辑器
│   │   ├── moments/ interviews/ entertainment/ links/ about/
│   │   └── tags/ media/ comments/ settings/
│   ├── api/
│   │   ├── [...path]/route.ts       前台公开接口（feed/posts/moments/search...）
│   │   └── admin/[...path]/route.ts 后台接口（登录/CRUD/审核/统计）
│   ├── globals.css                  设计系统 token
│   └── layout.tsx                   根布局
├── components/
│   ├── admin/
│   │   ├── AdminShell.tsx           后台布局与登录守卫
│   │   ├── ResourceManager.tsx      配置驱动的通用 CRUD 表格/表单
│   │   └── PostEditor.tsx           TipTap 富文本编辑器
│   ├── cards/ layout/               前台复用组件
│   └── PostInteractions.tsx         点赞 + 评论
├── lib/
│   ├── api.ts                       统一请求封装（含错误处理）
│   ├── queries.ts                   语义数据函数（页面只调这里）
│   ├── format.ts utils.ts
├── mocks/
│   ├── data.ts                      mock 种子数据（符合契约）
│   └── store.ts                     可写存储（CRUD/点赞/审核）
└── types/
    └── api.ts                       API 契约类型定义
docs/
├── API-CONTRACT.md                  API 契约 v1.0（前后端共同遵守）
scripts/
└── download-images.mjs              图片下载脚本（当前未用，改用本地 SVG 占位）
```

## API 契约

见 `docs/API-CONTRACT.md`。要点：驼峰命名、ID 数字、时间 ISO8601、正文 HTML、枚举小写字符串、图片相对路径、标签对象数组。统一响应 `{ code, message, data }`。

## 当前进度

- [x] F0 工程骨架、设计系统、API 契约、Mock API、本地图片占位
- [x] F1 布局组件 + 首页 + 技术列表/详情
- [x] F2 其余前台页面与交互（点赞、评论）
- [x] F3 后台 11 个模块（仪表盘、登录 + 6 内容 + 4 管理）
- [x] F4 后台全模块联调验证（真实浏览器实测写作/审核闭环）
- [x] 后端 Spring Boot 实现（按 API 契约）

> 移动端按约定暂不实现，当前为完整 Web 端。
> `npm run build` 在部分沙箱环境会因删除保护中断，验证手段为 `tsc --noEmit` + dev server + 真实浏览器实测。
