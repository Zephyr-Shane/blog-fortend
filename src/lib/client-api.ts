// 客户端统一请求封装：解决 P0-1（21 处直接 fetch 绕过封装）与 P1-1（token 未注入）
// 服务端组件请继续用 lib/api.ts（含 next/headers），本文件专供 'use client' 组件使用。

import type { ApiResponse, Notification, NotificationPage } from '@/types/api';

/** 后台 token 存储键（唯一来源） */
export const ADMIN_TOKEN_KEY = 'xiaoshuaige-admin-token';

/** 站点配置保存后通知后台布局刷新头像/昵称（唯一事件名来源） */
export const SITE_CONFIG_UPDATED_EVENT = 'site-config-updated';
export const notifySiteConfigUpdated = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SITE_CONFIG_UPDATED_EVENT));
};

/** 请求基地址：设置环境变量则指向 Spring Boot，否则走 Next.js 同域 /api */
const REMOTE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const base = () => REMOTE_BASE || '/api';
/** 是否已连接真实后端；mock 模式下上传退化为 dataURL 内嵌 */
export const IS_REMOTE_API = Boolean(REMOTE_BASE);

export class ClientApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'ClientApiError';
  }
}

async function request<T>(path: string, init?: RequestInit, withAuth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string> || {}) };
  if (withAuth) {
    const token = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${base()}${path}`, { ...init, headers });
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 200) throw new ClientApiError(json.code, json.message);
  return json.data;
}

/** 前台公开接口 */
export const clientGet = <T,>(path: string) => request<T>(path);
export const clientPost = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

/**
 * 后台接口路径前缀（唯一来源）。
 * 所有 admin* 调用只写资源相对路径（如 '/tag'），由这里统一补 '/admin'，
 * 避免每个调用点重复拼前缀、漏写或与后端 /admin/** 对不上。
 * 幂等：调用方若已写全 '/admin/xxx' 不会重复拼接。
 */
const withAdminPrefix = (path: string) =>
  path === '/admin' || path.startsWith('/admin/') ? path : `/admin${path}`;

/** 后台接口：自动补 /admin 前缀 + 注入 Bearer token */
export const adminFetch = async <T,>(path: string, init?: RequestInit): Promise<T> =>
  request<T>(withAdminPrefix(path), init, true);

export const adminGet = <T,>(path: string) => adminFetch<T>(path);
export const adminPost = <T,>(path: string, body: unknown) =>
  adminFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const adminPut = <T,>(path: string, body: unknown) =>
  adminFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });
export const adminPatch = <T,>(path: string, body: unknown) =>
  adminFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const adminDelete = <T,>(path: string) => adminFetch<T>(path, { method: 'DELETE' });

/** 上传形式：决定资源在媒体库中的分类与后续生命周期 */
export type UploadCategory = 'avatar' | 'cover' | 'content' | 'logo' | 'gallery' | 'other';

export interface UploadedFile {
  /** 应用生成的 UUID（非自增），同时用于 /media/{id} 直出与引用判断 */
  id: string;
  category: string;
  fileName: string;
  mimeType: string;
  size: number;
  /** 完整可访问地址，可直接写进内容字段 / <img src> */
  url: string;
  createdAt: string;
}

/** 资源被哪些内容引用（删除前校验） */
export interface MediaReference {
  type: string;
  name: string;
  field: string;
}

/**
 * 文件上传（multipart）：二进制由后端落库，返回可访问 URL。
 * 不能复用 request()——它强制 application/json 会破坏 multipart 边界。
 */
export async function uploadFile(file: File, category: UploadCategory = 'other'): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  form.append('category', category);
  const headers: Record<string, string> = {};
  const token = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base()}${withAdminPrefix('/upload')}`, {
    method: 'POST',
    headers,
    body: form,
  });
  const json: ApiResponse<UploadedFile> = await res.json();
  if (json.code !== 200) throw new ClientApiError(json.code, json.message);
  return json.data;
}

/** 媒体库列表：按上传形式过滤 */
export const listMedia = (category?: UploadCategory) =>
  adminGet<UploadedFile[]>(category ? `/media?category=${category}` : '/media');

/** 删除上传资源（后端会先校验引用，被引用返回 409） */
export const deleteMedia = (id: string) => adminDelete(`/media/${id}`);

/** 查看资源被哪些内容引用 */
export const getMediaReferences = (id: string) =>
  adminGet<MediaReference[]>(`/media/${id}/references`);

/** 当前访客点赞状态（公开接口，参数在 query） */
export const getLikeState = (visitorId: string, targetType: string, targetId: number) =>
  clientGet<{ liked: boolean; likeCount: number }>(
    `/likes/state?visitorId=${encodeURIComponent(visitorId)}&targetType=${targetType}&targetId=${targetId}`,
  );

// ============ 通知中心 ============
/** 通知列表：status 支持 all / unread / read；铃铛只看未读，通知记录页看全部 */
export const getNotifications = (page = 1, pageSize = 20, status: 'all' | 'unread' | 'read' = 'all') =>
  adminGet<NotificationPage>(`/notifications?page=${page}&pageSize=${pageSize}&status=${status}`);

export const getUnreadCount = () =>
  adminGet<{ unread: number }>('/notifications/unread-count');

export const markNotificationRead = (id: string) =>
  adminPatch(`/notifications/${id}/read`, {});

export const markAllNotificationsRead = () =>
  adminPatch('/notifications/read-all', {});
