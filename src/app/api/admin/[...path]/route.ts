import { NextResponse } from 'next/server';
import {
  getCollection,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  reviewComment,
  getStats,
  getDB,
} from '@/mocks/store';
import type { ApiResponse, ResourceType } from '@/types/api';

const ok = <T,>(data: T): ApiResponse<T> => ({ code: 200, message: 'ok', data });
const fail = (code: number, message: string) => NextResponse.json({ code, message, data: null }, { status: code });

const RESOURCES: ResourceType[] = ['post', 'moment', 'interview', 'link', 'tag', 'comment', 'user'];

export async function GET(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/admin/, '');

  if (path === '/stats') return NextResponse.json(ok(getStats()));

  if (path === '/site-config') return NextResponse.json(ok(getDB().siteConfig));

  // 通知中心（mock 模式：事件落库在真实后端，此处返回空集保证铃铛不报错）
  if (path === '/notifications/unread-count') return NextResponse.json(ok({ unread: 0 }));
  if (path.startsWith('/notifications')) {
    const page = Number(new URL(request.url).searchParams.get('page') || 1);
    const pageSize = Number(new URL(request.url).searchParams.get('pageSize') || 20);
    return NextResponse.json(ok({ list: [], total: 0, page, pageSize, unread: 0 }));
  }

  const parts = path.split('/').filter(Boolean);
  if (parts.length === 1 && RESOURCES.includes(parts[0] as ResourceType)) {
    return NextResponse.json(ok(getCollection(parts[0] as ResourceType)));
  }
  if (parts.length === 2 && RESOURCES.includes(parts[0] as ResourceType)) {
    const item = getItem(parts[0] as ResourceType, Number(parts[1]));
    return item ? NextResponse.json(ok(item)) : fail(404, '资源不存在');
  }

  return fail(404, '接口不存在');
}

export async function POST(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/admin/, '');
  const body = await request.json().catch(() => ({}));

  if (path === '/auth/login') {
    const user = getDB().users.find((u) => u.email === body.email);
    if (!user || body.password !== 'admin123') return fail(401, '账号或密码错误');
    return NextResponse.json(ok({ token: 'mock-token-' + user.id, user }));
  }

  if (path === '/upload') {
    return NextResponse.json(ok({ url: '/images/placeholder.svg' }));
  }

  const parts = path.split('/').filter(Boolean);
  if (parts.length === 1 && RESOURCES.includes(parts[0] as ResourceType)) {
    const created = createItem(parts[0] as ResourceType, body);
    return NextResponse.json(ok(created), { status: 201 });
  }

  return fail(404, '接口不存在');
}

export async function PUT(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/admin/, '');
  const body = await request.json().catch(() => ({}));
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'site-config') {
    getDB().siteConfig = { ...getDB().siteConfig, ...body };
    return NextResponse.json(ok(getDB().siteConfig));
  }

  if (parts.length === 2 && RESOURCES.includes(parts[0] as ResourceType)) {
    const updated = updateItem(parts[0] as ResourceType, Number(parts[1]), body);
    return updated ? NextResponse.json(ok(updated)) : fail(404, '资源不存在');
  }

  return fail(404, '接口不存在');
}

export async function PATCH(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/admin/, '');
  const body = await request.json().catch(() => ({}));
  const match = path.match(/^\/comments\/(\d+)\/review$/);
  if (match) {
    const c = reviewComment(Number(match[1]), body.status);
    return c ? NextResponse.json(ok(c)) : fail(404, '评论不存在');
  }
  if (path === '/notifications/read-all') return NextResponse.json(ok({ updated: 0 }));
  const notifMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (notifMatch) {
    return NextResponse.json(ok({ id: notifMatch[1], read: true }));
  }
  return fail(404, '接口不存在');
}

export async function DELETE(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/admin/, '');
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 2 && RESOURCES.includes(parts[0] as ResourceType)) {
    const removed = deleteItem(parts[0] as ResourceType, Number(parts[1]));
    return removed ? NextResponse.json(ok({ id: Number(parts[1]) })) : fail(404, '资源不存在');
  }
  return fail(404, '接口不存在');
}
