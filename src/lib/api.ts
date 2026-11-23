import { headers } from 'next/headers';
import type { ApiResponse } from '@/types/api';

// 基地址：生产环境走环境变量指向的 Spring Boot；否则走本应用 /api。
const REMOTE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

async function resolveBase(): Promise<string> {
  // 浏览器端：用构建期写死的公网地址，或同域相对路径。
  if (typeof window !== 'undefined') return REMOTE_BASE || '/api';
  // 服务端：优先 Docker 内网地址（容器名互访），其次公网地址。
  // 用中括号动态读取，避免构建期被内联成空串；容器访问本机公网 IP 会被云厂商 hairpin NAT 拦截而超时。
  const internalBase = process.env['API_BASE_URL_INTERNAL'] || '';
  if (internalBase) return internalBase;
  if (REMOTE_BASE) return REMOTE_BASE;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}/api`;
}

export class ApiError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = await resolveBase();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 200) throw new ApiError(json.code, json.message);
  return json.data;
}

export const apiGet = <T,>(path: string) => request<T>(path, { cache: 'no-store' });
export const apiPost = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
export const apiPatch = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = <T,>(path: string) => request<T>(path, { method: 'DELETE' });
