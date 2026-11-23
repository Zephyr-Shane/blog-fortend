import { apiGet, apiPost } from './api';
import type {
  PageResult, Post, Moment, Interview, SiteLink, Tag, SiteConfig,
  Comment, FeedItem, ContentItem, SiteOverview,
} from '@/types/api';

// 页面层只调用这里的语义函数，不直接拼 fetch URL。
// 后端切换时只改 api.ts 的 BASE，本文件与页面都不用动。

export const getFeed = (page = 1, pageSize = 12) =>
  apiGet<PageResult<FeedItem>>(`/feed?page=${page}&pageSize=${pageSize}`);

export const getPosts = (params: { page?: number; pageSize?: number; tag?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  if (params.tag) q.set('tag', params.tag);
  return apiGet<PageResult<Post>>(`/posts?${q}`);
};

export const getPostBySlug = (slug: string) => apiGet<Post>(`/posts/${slug}`);

export const getMoments = (params: { page?: number; pageSize?: number; mood?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  if (params.mood) q.set('mood', params.mood);
  return apiGet<PageResult<Moment>>(`/moments?${q}`);
};

/**
 * 单条动态详情。后端暂无 /moments/{id} 端点，先从列表按 id 查找（博客量级足够）。
 * 将来后端补上详情接口时，只需改这里一处为 apiGet<Moment>(`/moments/${id}`)。
 */
export const getMomentById = async (id: number): Promise<Moment | null> => {
  const { list } = await getMoments({ pageSize: 200 });
  return list.find((m) => m.id === id) ?? null;
};

export const getInterviews = (params: { kind?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.kind) q.set('kind', params.kind);
  return apiGet<PageResult<Interview>>(`/interviews?${q}`);
};

export const getLinks = (params: { category?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.category) q.set('category', params.category);
  return apiGet<PageResult<SiteLink>>(`/links?${q}`);
};

export const getTags = () => apiGet<Tag[]>('/tags');

export const getTagContents = (slug: string) =>
  apiGet<Record<'posts' | 'moments' | 'interviews' | 'links', ContentItem[]>>(`/tags/${slug}/contents`);

export const search = (q: string) =>
  apiGet<Record<'posts' | 'moments' | 'interviews' | 'links', ContentItem[]>>(`/search?q=${encodeURIComponent(q)}`);

import { normalizeCardSlots, type CardSlotsConfig } from './card-slots';

// 站点配置兜底：后端 site_config 表为空时 getSiteConfig 会返回 null，
// 下游多处直接读 site.interviewEnabled 会崩，故在此统一补齐默认值。
const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: '阿申の小破站',
  subtitle: '',
  description: '',
  authorName: '',
  authorBio: '',
  avatar: '',
  socialLinks: [],
  articleSignature: '',
  interviewEnabled: true,
  cardSlots: null,
  announcement: null,
};

export const getSiteConfig = async (): Promise<SiteConfig> => {
  const site = await apiGet<SiteConfig | null>('/site-config');
  // null、极简对象都做合并；interviewEnabled 缺省时按“显示”处理（与后端 DEFAULT 1 一致）。
  return {
    ...DEFAULT_SITE_CONFIG,
    ...(site || {}),
    interviewEnabled: site?.interviewEnabled !== false,
    socialLinks: site?.socialLinks || [],
  };
};

/** 首页侧栏聚合数据：公告 + 真实统计 + 常用标签 + 最新评论 */
export const getSiteOverview = () => apiGet<SiteOverview>('/site-overview');

/** 从站点配置中取出规整后的卡片插槽配置（缺省/损坏时用默认值兜底） */
export const getCardSlots = async (): Promise<CardSlotsConfig> => {
  const site = await getSiteConfig();
  return normalizeCardSlots(site.cardSlots);
};

export const getComments = (targetType: string, targetId: number) =>
  apiGet<Comment[]>(`/comments?targetType=${targetType}&targetId=${targetId}`);

export const postComment = (body: Omit<Comment, 'id' | 'status' | 'createdAt'>) =>
  apiPost<Comment>('/comments', body);

export const toggleLike = (visitorId: string, targetType: string, targetId: number) =>
  apiPost<{ liked: boolean; likeCount: number }>('/likes', { visitorId, targetType, targetId });
