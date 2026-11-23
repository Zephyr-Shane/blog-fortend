# API 契约 v1.0（定稿）

> 版本：v1.1 ｜ 日期：2026-11-20（v1.0 定稿于 2026-11-19）
> 状态：**已定稿并持续同步**，前后端共同遵守
> 用途：Mock API（Next.js Route Handlers）与 Spring Boot 后端按此契约实现，切换时前端不改代码。
> v1.1 变更：新增 `GET /site-overview` 与 SiteOverview 模型、站点公告配置字段、评论 `hidden` 状态与后台手动校验接口；同步上传资源改为落库 + UUID + 分类 + 引用校验的真实契约。

---

## 一、通用约定

### 1.1 请求基地址

```
开发环境：/api            （Next.js Mock Route Handlers）
生产环境：${API_BASE_URL} （Spring Boot，如 http://localhost:8080/api）
```

前端通过环境变量 `NEXT_PUBLIC_API_BASE_URL` 切换；为空时默认 `/api`。

### 1.2 统一响应包装

所有接口返回如下结构：

```json
{
  "code": 200,
  "message": "ok",
  "data": {}
}
```

- `code`：`200` 成功；非 200 为业务错误码（见 1.5）
- `message`：提示语，成功为 `"ok"`
- `data`：业务数据，失败时可为 `null`

### 1.3 分页结构

列表接口统一用 `PageResult`：

```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "list": [],
    "total": 42,
    "page": 1,
    "pageSize": 10
  }
}
```

分页请求参数：`?page=1&pageSize=10`（页码从 1 开始）。

### 1.4 字段规则（已确认的 7 项）

| 项目 | 规则 | 示例 |
|---|---|---|
| 字段命名 | 驼峰 | `publishedAt` |
| ID 类型 | 数字 | `18` |
| 时间格式 | ISO 8601 字符串 | `2024-05-18T10:30:00+08:00` |
| 正文格式 | HTML 字符串 | `<p>你好</p>` |
| 枚举 | 小写字符串 | `draft` / `published` |
| 图片字段 | 相对路径 / http(s) 在线链接 / dataURL | `/images/post-fsm.svg`、`https://x.com/a.jpg`、`data:image/png;base64,...` |
| 标签 | 对象数组 | `[{id,name,slug}]` |

### 1.5 错误码

| code | 含义 |
|---|---|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录 / token 失效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务端错误 |

---

## 二、数据模型

### 2.1 Post（文章 / 技术长文）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | 主键 |
| title | string | 标题 |
| slug | string | URL 标识，唯一 |
| excerpt | string | 摘要 |
| content | string | 正文 HTML |
| coverImage | string \| null | 封面路径 |
| status | `draft` \| `published` | 状态 |
| category | string | 栏目：`tech` |
| tags | Tag[] | 标签 |
| publishedAt | string \| null | 发布时间 ISO8601 |
| allowComments | boolean | 是否允许评论 |
| commentCount | number | 评论数 |
| likeCount | number | 点赞数 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

### 2.2 Moment（生活动态）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | 主键 |
| content | string | 文字内容 |
| images | string[] | 图片路径数组 |
| mood | string | 心情：`calm`/`happy`/`solitude`/`thought`/`melancholy` |
| location | string \| null | 地点 |
| status | `draft` \| `published` | 状态 |
| tags | Tag[] | 标签 |
| publishedAt | string \| null | 发布时间 |
| allowComments | boolean | 是否允许评论 |
| commentCount | number | 评论数 |
| likeCount | number | 点赞数 |
| createdAt / updatedAt | string | 时间戳 |

### 2.3 Interview（面试档案）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | 主键 |
| kind | `experience` \| `question` \| `prep` | 子类型 |
| title | string | 标题 / 题干 |
| content | string | 正文 HTML（面经 / 准备笔记 / 答案解析） |
| company | string \| null | 公司 |
| position | string \| null | 岗位 |
| result | `pass` \| `fail` \| `ongoing` \| null | 面经结果 |
| knowledgePoint | string \| null | 知识点 |
| difficulty | `easy` \| `medium` \| `hard` \| null | 难度 |
| status | `draft` \| `published` | 状态 |
| tags | Tag[] | 标签 |
| publishedAt | string \| null | 发布时间 |
| allowComments | boolean | 是否允许评论 |
| commentCount / likeCount | number | 互动计数 |
| createdAt / updatedAt | string | 时间戳 |

### 2.4 Link（友链 / 娱乐网站卡片）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | 主键 |
| name | string | 名称 |
| url | string | 链接地址 |
| description | string | 简介 |
| logo | string \| null | 缩略图 / 头像路径 |
| category | `entertainment` \| `friend` | 分类 |
| group | string \| null | 分组（友链：技术同好 / 网友） |
| status | `draft` \| `published` | 状态 |
| tags | Tag[] | 标签 |
| publishedAt | string \| null | 发布时间 |
| allowComments | boolean | 是否允许评论 |
| commentCount / likeCount | number | 互动计数 |
| createdAt / updatedAt | string | 时间戳 |

### 2.5 Tag（标签）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | 主键 |
| name | string | 名称，如 `React` |
| slug | string | URL 标识，如 `react` |

### 2.6 Comment（评论）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | 主键 |
| targetType | `post` \| `moment` \| `interview` \| `link` | 目标类型 |
| targetId | number | 目标 ID |
| parentId | number \| null | 父评论 ID（楼中楼）；作者回复时指向被回复评论 |
| visitorId | string | 匿名访客标识（作者回复为空） |
| authorName | string | 昵称 |
| authorEmail | string | 邮箱（不公开） |
| content | string | 内容 |
| status | `pending` \| `approved` \| `spam` \| `hidden` | 状态；`hidden` 为后端定时校验命中后自动隐藏，不在前台展示 |
| createdAt | string | 创建时间 |

### 2.7 Like（点赞）

点赞按 `(visitorId, targetType, targetId)` 唯一。

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | 主键 |
| visitorId | string | 访客匿名 ID |
| targetType | string | 目标类型 |
| targetId | number | 目标 ID |
| createdAt | string | 创建时间 |

### 2.8 Notification（通知）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | UUID |
| type | `comment` \| `like` \| `system` | 通知类型 |
| title | string | 标题 |
| content | string | 摘要 |
| targetType | `post` \| `moment` \| `interview` \| `link` \| null | 跳转目标类型 |
| targetId | number \| null | 跳转目标 ID |
| read | boolean | 是否已读 |
| createdAt | string | 创建时间 |

计数口径：`like_count` / `comment_count` 以关联表 `blog_like` / `blog_comment` 为真相源，互动后同事务回写；`comment_count` 只统计 `approved` 评论。评论提交即 `approved`（即时显示），违规内容由后端定时任务兜底（已实现，见 3.2 `POST /admin/comments/moderate`）。

### 2.9 SiteConfig（站点全局配置）

| 字段 | 类型 | 说明 |
|---|---|---|
| siteName | string | 站点名 |
| subtitle | string | 副标题 |
| description | string | 描述 |
| authorName | string | 作者名 |
| authorBio | string | 作者简介 |
| avatar | string | 头像路径 |
| logo | string \| null | 站点 logo，用于导航栏与浏览器图标；为空回退默认图标 |
| socialLinks | `{label,url}[]` | 社交链接 |
| articleSignature | string | 文章署名，全站统一 |
| interviewEnabled | boolean | 面试栏目是否显示，默认 true；关闭后前台隐藏面试入口与内容 |
| cardSlots | object \| null | 卡片插槽配置 JSON（按 post/moment/interview/link 分组），缺省前端回退默认值 |
| announcement | object \| null | 站点公告配置：`{title, content, updatedAt, visible}`；未配置或 `visible=false` 时前台隐藏公告卡片 |

### 2.10 SiteOverview（首页侧栏聚合）

`GET /site-overview` 的返回结构，一次请求提供右侧信息栏四个模块数据，避免多次往返。

| 字段 | 类型 | 说明 |
|---|---|---|
| announcement | `{title,content,updatedAt,visible}` \| null | 站点公告；未配置时为「空公告」，`visible=false` |
| stats | `{posts,moments,interviews,links,comments,tags}` | 全部为真实计数；**不含访问量**（项目无 PV 埋点，不展示假数据） |
| popularTags | `{name,slug,count}[]` | 常用标签，按已发布内容引用次数降序，最多 12 条 |
| recentComments | `{id,authorName,content,createdAt,targetType,targetId,targetTitle,targetSlug}[]` | 最近 5 条 `approved` 评论；**不含邮箱与 visitorId**，内容截断为摘要 |

### 2.11 User（管理员）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | 主键 |
| email | string | 邮箱 / 账号 |
| name | string | 名称 |
| role | `admin` | 角色 |

---

## 三、接口清单

### 3.1 前台（公开）

| 方法 | 路径 | 说明 | 返回 |
|---|---|---|---|
| GET | `/posts` | 文章列表（支持 `?page&pageSize&tag&slug`） | PageResult&lt;Post&gt; |
| GET | `/posts/:slug` | 文章详情 | Post |
| GET | `/moments` | 动态列表（支持分页 / 心情筛选） | PageResult&lt;Moment&gt; |
| GET | `/interviews` | 面试档案列表（支持 `?kind`） | PageResult&lt;Interview&gt; |
| GET | `/links` | 链接列表（支持 `?category`） | PageResult&lt;Link&gt; |
| GET | `/tags` | 全部标签 | Tag[] |
| GET | `/tags/:slug/contents` | 某标签下的内容汇总 | `{posts,moments,interviews,links}` |
| GET | `/search?q=xxx` | 全站搜索 | `{posts,moments,interviews,links}` |
| GET | `/site-config` | 站点配置 | SiteConfig |
| GET | `/site-overview` | 首页侧栏聚合（公告 / 真实统计 / 常用标签 / 最新评论），见 2.10 | SiteOverview |
| GET | `/feed` | 首页混排时间线 | `{list,page,pageSize}` |
| GET | `/comments?targetType=&targetId=` | 评论列表 | Comment[] |
| POST | `/comments` | 发表评论（body 带 `visitorId`，即时显示；作者回复带 `parentId`） | Comment |
| POST | `/likes` | 点赞 / 取消（toggle） | `{liked,likeCount}` |
| GET | `/likes/state?visitorId=&targetType=&targetId=` | 当前访客点赞状态 + 真实计数 | `{liked,likeCount}` |
| GET | `/media/:id` | 从数据库直出上传资源（无需鉴权，带缓存头） | 二进制 |

### 3.2 后台（需鉴权，请求头带 `Authorization: Bearer <token>`）

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/auth/login` | 登录，返回 `{token,user}` |
| GET | `/admin/stats` | 仪表盘统计 |
| GET | `/admin/:resource` | 通用列表（post/moment/interview/link/tag/comment/user） |
| GET | `/admin/:resource/:id` | 详情 |
| POST | `/admin/:resource` | 新建 |
| PUT | `/admin/:resource/:id` | 更新 |
| DELETE | `/admin/:resource/:id` | 删除 |
| PATCH | `/admin/comments/:id/review` | 评论审核（`status: approved/spam/hidden`） |
| POST | `/admin/comments/moderate` | 手动触发一次评论批量校验（与定时任务同规则） | `{enabled,scanned,hidden,reasons}` |
| GET | `/admin/notifications?page=&pageSize=&status=` | 通知分页列表（含 unread）；`status` 为 `all` / `unread` / `read` | NotificationPage |
| GET | `/admin/notifications/unread-count` | 未读通知数 | `{unread}` |
| PATCH | `/admin/notifications/:id/read` | 单条标记已读 | Notification |
| PATCH | `/admin/notifications/read-all` | 全部标记已读 | `{updated}` |
| GET / PUT | `/admin/site-config` | 站点配置 |
| POST | `/admin/upload` | 图片上传，二进制落库（见 3.3） | UploadedFile |
| GET | `/admin/media?category=` | 媒体库列表（可按上传形式过滤） | UploadedFile[] |
| GET | `/admin/media/:id/references` | 查询资源被哪些内容引用 | MediaReference[] |
| DELETE | `/admin/media/:id` | 删除资源；被引用时返回 `409` 并附引用位置 | `{id}` |

### 3.3 图片上传接口

前端的图片选择器（封面图、图标、头像、正文配图）统一调用此接口。

**请求**：`POST /api/admin/upload`，`Content-Type: multipart/form-data`，需 Bearer Token

| 字段 | 类型 | 说明 |
|---|---|---|
| file | File | 图片文件，允许 png/jpg/jpeg/webp/gif/svg |
| category | string | 上传形式：`avatar` / `cover` / `content` / `logo` / `gallery` / `other`，默认 `other` |

**成功响应**：
```json
{
  "code": 200,
  "message": "ok",
  "data": {
    "id": "3f8a...-...-...(UUID)",
    "category": "cover",
    "fileName": "abc123.webp",
    "mimeType": "image/webp",
    "size": 204800,
    "url": "http://localhost:8080/api/media/3f8a...-...-...",
    "createdAt": "2026-11-20T12:00:00Z"
  }
}
```

- 二进制存 `blog_upload`（LONGBLOB），**不落文件系统**；`id` 为应用生成的 UUID，非自增。
- `url` 是完整可访问地址，指向公开接口 `GET /media/{id}` 从数据库直出（带缓存头），可直接写进内容字段 / `<img src>`；部署域名变更需同步 `blog.upload.public-url` 配置。
- 媒体列表接口只返回元数据 `toMeta()`，不吐二进制。
- 删除前按 UUID 扫描各内容表引用，**被引用返回 `code=409`** 并附引用位置，未引用才可删。
- 失败：`code=400`（参数错误）、`code=401`（未登录）、`code=409`（资源被引用）。
- **Mock 模式**：`ImagePicker` / `MultiImagePicker` 在 `IS_REMOTE_API=false` 时用 `FileReader.readAsDataURL` 内嵌预览；真实后端走本接口。图片字段因此允许三类值：`/media/{id}` 完整地址、http(s) 在线链接、dataURL。两种方式都支持「从媒体库选择」复用已上传资源，避免重复上传。

---

## 四、前端对接约定

1. 所有数据请求经过 `src/lib/api.ts` 封装，统一处理 `code !== 200` 的错误。
2. 页面层只调用 `src/lib/queries.ts` 中的语义函数（`getPosts`、`getFeed` 等），不直接写 fetch URL。
3. Mock 阶段：`NEXT_PUBLIC_API_BASE_URL` 为空 → 走 `/api`（Next.js Route Handlers）。
4. 后端阶段：设置该环境变量 → 走 Spring Boot。
5. 鉴权：登录后 token 存 Cookie，请求头统一注入。
