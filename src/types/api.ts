// API 契约类型定义 v1.0
// 与 docs/API-CONTRACT.md 保持一致，Mock 与 Spring Boot 共同遵守

export type Status = 'draft' | 'published';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type TagCategory = 'tech' | 'life' | 'general';

export interface Tag {
  id: number;
  name: string;
  slug: string;
  category: TagCategory;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  status: Status;
  category: string;
  tags: Tag[];
  publishedAt: string | null;
  allowComments: boolean;
  commentCount: number;
  likeCount: number;
  /** 共创者列表（可选），与全站署名合并展示 */
  coAuthors: CoAuthor[];
  createdAt: string;
  updatedAt: string;
}

export type Mood = 'calm' | 'happy' | 'solitude' | 'thought' | 'melancholy';

export interface Moment {
  id: number;
  content: string;
  images: string[];
  mood: Mood;
  location: string | null;
  status: Status;
  tags: Tag[];
  publishedAt: string | null;
  allowComments: boolean;
  commentCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export type InterviewKind = 'experience' | 'question' | 'prep';
export type InterviewResult = 'pass' | 'fail' | 'ongoing';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Interview {
  id: number;
  kind: InterviewKind;
  title: string;
  content: string;
  company: string | null;
  position: string | null;
  result: InterviewResult | null;
  knowledgePoint: string | null;
  difficulty: Difficulty | null;
  status: Status;
  tags: Tag[];
  publishedAt: string | null;
  allowComments: boolean;
  commentCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export type LinkCategory = 'entertainment' | 'friend';

export interface SiteLink {
  id: number;
  name: string;
  url: string;
  description: string;
  logo: string | null;
  category: LinkCategory;
  group: string | null;
  status: Status;
  tags: Tag[];
  publishedAt: string | null;
  allowComments: boolean;
  commentCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export type CommentTargetType = 'post' | 'moment' | 'interview' | 'link';
export type CommentStatus = 'pending' | 'approved' | 'spam' | 'hidden';

export interface Comment {
  id: number;
  targetType: CommentTargetType;
  targetId: number;
  parentId: number | null;
  /** 匿名访客标识（作者回复为空） */
  visitorId?: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
}

export type NotificationType = 'comment' | 'like' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  targetType: CommentTargetType | null;
  targetId: number | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  list: Notification[];
  total: number;
  page: number;
  pageSize: number;
  unread: number;
}

export interface Like {
  id: number;
  visitorId: string;
  targetType: CommentTargetType;
  targetId: number;
  createdAt: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface CoAuthor {
  name: string;
  blogUrl: string;
}

/** 站点公告：后台自定义配置可编辑，visible=false 时前台不展示 */
export interface SiteAnnouncement {
  title: string;
  content: string;
  updatedAt?: string;
  visible: boolean;
}

/** 首页侧栏统计：全部为真实计数，不含未埋点的访问量 */
export interface SiteOverviewStats {
  posts: number;
  moments: number;
  interviews: number;
  links: number;
  comments: number;
  tags: number;
}

export interface PopularTag {
  name: string;
  slug: string;
  count: number;
}

/** 最新评论：只含可公开展示字段，不含邮箱与访客标识 */
export interface RecentComment {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
  targetType: CommentTargetType;
  targetId: number;
  targetTitle: string;
  targetSlug: string;
}

/** 首页侧栏聚合视图，对应 GET /site-overview */
export interface SiteOverview {
  announcement: SiteAnnouncement | null;
  stats: SiteOverviewStats;
  popularTags: PopularTag[];
  recentComments: RecentComment[];
}

export interface SiteConfig {
  siteName: string;
  subtitle: string;
  description: string;
  authorName: string;
  authorBio: string;
  avatar: string;
  /** 站点 logo 图片地址，用于导航栏与浏览器图标（可空，回退默认图标） */
  logo?: string;
  socialLinks: SocialLink[];
  /** 文章署名：全站统一，编辑文章时只读展示 */
  articleSignature: string;
  /** 面试栏目是否显示，默认 true */
  interviewEnabled: boolean;
  /** 卡片插槽配置（JSON 对象，按内容类型分组）；缺省时前端用默认配置 */
  cardSlots?: Record<string, unknown> | null;
  /** 站点公告配置；缺省/未开启时前台隐藏公告卡片 */
  announcement?: SiteAnnouncement | null;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin';
}

export interface FeedItem {
  type: CommentTargetType;
  data: Post | Moment | Interview | SiteLink;
  publishedAt: string;
}

export interface AdminStats {
  totalContents: number;
  published: number;
  drafts: number;
  pendingComments: number;
  [key: string]: number;
}

export type ResourceType = 'post' | 'moment' | 'interview' | 'link' | 'tag' | 'comment' | 'user';

export type ContentItem = Post | Moment | Interview | SiteLink;
