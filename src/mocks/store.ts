import type { Post, Moment, Interview, SiteLink, Tag, Comment, Like, SiteConfig, User, ContentItem, ResourceType, CommentTargetType } from '@/types/api';
import * as seed from './data';

// 可写的内存存储。Mock 阶段进程内持久；接后端后整个文件被真实 API 取代。
// 数据结构严格遵循 API 契约 v1.0。

type DB = {
  posts: Post[];
  moments: Moment[];
  interviews: Interview[];
  links: SiteLink[];
  tags: Tag[];
  comments: Comment[];
  likes: Like[];
  siteConfig: SiteConfig;
  users: User[];
};

const db: DB = {
  posts: structuredClone(seed.posts),
  moments: structuredClone(seed.moments),
  interviews: structuredClone(seed.interviews),
  links: structuredClone(seed.links),
  tags: structuredClone(seed.tags),
  comments: structuredClone(seed.comments),
  likes: structuredClone(seed.likes),
  siteConfig: structuredClone(seed.siteConfig),
  users: structuredClone(seed.users),
};

let nextId = 1000;
export const newId = () => ++nextId;

const collectionMap: Record<ResourceType, keyof DB> = {
  post: 'posts',
  moment: 'moments',
  interview: 'interviews',
  link: 'links',
  tag: 'tags',
  comment: 'comments',
  user: 'users',
};

export function getCollection(type: ResourceType): unknown[] {
  return db[collectionMap[type]] as unknown[];
}

export function getDB(): DB {
  return db;
}

// —— 前台查询 ——

export function listPublished(type: 'post' | 'moment' | 'interview' | 'link'): ContentItem[] {
  const key = collectionMap[type] as 'posts' | 'moments' | 'interviews' | 'links';
  return (db[key] as ContentItem[]).filter((x) => x.status === 'published');
}

export function getItem(type: ResourceType, id: number): unknown | null {
  const list = getCollection(type) as { id: number }[];
  return list.find((x) => x.id === id) ?? null;
}

export function getPostBySlug(slug: string): Post | null {
  return db.posts.find((p) => p.slug === slug) ?? null;
}

export function getFeed(): { type: string; data: ContentItem; publishedAt: string }[] {
  const items: { type: string; data: ContentItem; publishedAt: string }[] = [];
  for (const type of ['post', 'moment', 'interview', 'link'] as const) {
    for (const data of listPublished(type)) {
      if (data.publishedAt) items.push({ type, data, publishedAt: data.publishedAt });
    }
  }
  return items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getComments(targetType: string, targetId: number): Comment[] {
  return db.comments.filter(
    (c) => c.targetType === targetType && c.targetId === targetId && c.status === 'approved',
  );
}

export function toggleLike(visitorId: string, targetType: CommentTargetType, targetId: number): { liked: boolean; likeCount: number } {
  const idx = db.likes.findIndex(
    (l) => l.visitorId === visitorId && l.targetType === targetType && l.targetId === targetId,
  );
  let liked: boolean;
  if (idx >= 0) {
    db.likes.splice(idx, 1);
    liked = false;
  } else {
    db.likes.push({ id: newId(), visitorId, targetType, targetId, createdAt: new Date().toISOString() });
    liked = true;
  }
  const base = countBaseLikes(targetType, targetId);
  return { liked, likeCount: base + (liked ? 1 : 0) };
}

function countBaseLikes(targetType: string, targetId: number): number {
  const key = collectionMap[targetType as ResourceType] as 'posts' | 'moments' | 'interviews' | 'links' | undefined;
  if (!key) return 0;
  const item = (db[key] as { id: number; likeCount: number }[]).find((x) => x.id === targetId);
  return item?.likeCount ?? 0;
}

// —— 写操作 ——

// 新建时补齐契约字段，保证任何入口创建的数据都能被前台正常渲染
const defaultsByType: Record<ResourceType, Record<string, unknown>> = {
  post: {
    excerpt: '', content: '', coverImage: null, status: 'draft', category: 'tech',
    tags: [], publishedAt: null, allowComments: true, commentCount: 0, likeCount: 0, coAuthors: [],
  },
  moment: {
    content: '', images: [], mood: 'calm', location: null, status: 'draft',
    tags: [], publishedAt: null, allowComments: true, commentCount: 0, likeCount: 0,
  },
  interview: {
    kind: 'experience', title: '', content: '', company: null, position: null,
    result: null, knowledgePoint: null, difficulty: null, status: 'draft',
    tags: [], publishedAt: null, allowComments: true, commentCount: 0, likeCount: 0,
  },
  link: {
    name: '', url: '', description: '', logo: null, category: 'friend', group: null,
    status: 'draft', tags: [], publishedAt: null, allowComments: true, commentCount: 0, likeCount: 0,
  },
  tag: { name: '', slug: '', category: 'general' },
  comment: {
    targetType: 'post', targetId: 0, parentId: null, authorName: '', authorEmail: '',
    content: '', status: 'pending',
  },
  user: { email: '', name: '', role: 'admin' },
};

const timestampTypes: ResourceType[] = ['post', 'moment', 'interview', 'link', 'comment'];
const updatedAtTypes: ResourceType[] = ['post', 'moment', 'interview', 'link'];

export function createItem(type: ResourceType, payload: Record<string, unknown>): unknown {
  const list = getCollection(type) as Record<string, unknown>[];
  const now = new Date().toISOString();
  const item: Record<string, unknown> = {
    ...defaultsByType[type],
    ...payload,
    id: newId(),
    ...(timestampTypes.includes(type) ? { createdAt: payload.createdAt ?? now } : {}),
    ...(updatedAtTypes.includes(type) ? { updatedAt: now } : {}),
  };
  list.unshift(item);
  return item;
}

export function updateItem(type: ResourceType, id: number, payload: Record<string, unknown>): unknown | null {
  const list = getCollection(type) as Record<string, unknown>[];
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    ...payload,
    id,
    ...(updatedAtTypes.includes(type) ? { updatedAt: new Date().toISOString() } : {}),
  };
  return list[idx];
}

export function deleteItem(type: ResourceType, id: number): boolean {
  const list = getCollection(type) as { id: number }[];
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return false;
  list.splice(idx, 1);
  return true;
}

export function reviewComment(id: number, status: 'approved' | 'spam'): Comment | null {
  const c = db.comments.find((x) => x.id === id);
  if (!c) return null;
  c.status = status;
  return c;
}

export function getStats() {
  const all = [...db.posts, ...db.moments, ...db.interviews, ...db.links];
  return {
    totalContents: all.length,
    published: all.filter((x) => x.status === 'published').length,
    drafts: all.filter((x) => x.status === 'draft').length,
    pendingComments: db.comments.filter((c) => c.status === 'pending').length,
  };
}
