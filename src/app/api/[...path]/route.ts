import { NextResponse } from 'next/server';
import {
  listPublished,
  getPostBySlug,
  getFeed,
  getComments,
  toggleLike,
  getDB,
  createItem,
} from '@/mocks/store';
import type {
  ApiResponse, PageResult, ContentItem, Comment, CommentTargetType,
  SiteOverview, SiteAnnouncement, PopularTag, RecentComment, Post, Moment, Interview, SiteLink,
} from '@/types/api';

const ok = <T,>(data: T): ApiResponse<T> => ({ code: 200, message: 'ok', data });
const fail = (code: number, message: string) => NextResponse.json({ code, message, data: null }, { status: code });

function paginate<T>(list: T[], page: number, pageSize: number): PageResult<T> {
  const start = (page - 1) * pageSize;
  return { list: list.slice(start, start + pageSize), total: list.length, page, pageSize };
}

const plain = (s: string | null | undefined, max: number) => {
  const t = (s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : t.slice(0, max) + '…';
};

/** 首页侧栏聚合（mock 模式与后端 /site-overview 保持同一契约与真实统计口径） */
function buildOverview(): SiteOverview {
  const db = getDB();
  const published = {
    post: listPublished('post') as Post[],
    moment: listPublished('moment') as Moment[],
    interview: listPublished('interview') as Interview[],
    link: listPublished('link') as SiteLink[],
  };
  const titleIndex: Record<string, Map<number, [string, string]>> = {};
  const tagCount = new Map<string, { name: string; count: number }>();

  for (const [type, list] of Object.entries(published)) {
    const idx = new Map<number, [string, string]>();
    for (const item of list as ContentItem[]) {
      let title = '';
      let slug = '';
      if (type === 'post') { title = (item as Post).title; slug = (item as Post).slug; }
      else if (type === 'interview') title = (item as Interview).title;
      else if (type === 'link') title = (item as SiteLink).name;
      else title = plain((item as Moment).content, 24);
      idx.set(item.id, [title, slug]);
      for (const t of item.tags || []) {
        const prev = tagCount.get(t.slug);
        tagCount.set(t.slug, { name: t.name, count: (prev?.count || 0) + 1 });
      }
    }
    titleIndex[type] = idx;
  }

  const popularTags: PopularTag[] = [...tagCount.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }));

  const recentComments: RecentComment[] = db.comments
    .filter((c) => c.status === 'approved')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((c) => {
      const ts = titleIndex[c.targetType]?.get(c.targetId);
      return {
        id: c.id,
        authorName: c.authorName?.trim() || '匿名访客',
        content: plain(c.content, 60),
        createdAt: c.createdAt,
        targetType: c.targetType,
        targetId: c.targetId,
        targetTitle: ts?.[0] || '',
        targetSlug: ts?.[1] || '',
      };
    });

  const a = (db.siteConfig.announcement || null) as SiteAnnouncement | null;
  return {
    announcement: a,
    stats: {
      posts: published.post.length,
      moments: published.moment.length,
      interviews: db.siteConfig.interviewEnabled === false ? 0 : published.interview.length,
      links: published.link.length,
      comments: db.comments.filter((c) => c.status === 'approved').length,
      tags: db.tags.length,
    },
    popularTags,
    recentComments,
  };
}

export async function GET(request: Request) {
  const { pathname, searchParams } = new URL(request.url);
  const path = pathname.replace(/^\/api/, '');
  const page = Number(searchParams.get('page') || 1);
  const pageSize = Number(searchParams.get('pageSize') || 10);

  // 首页混排时间线
  if (path === '/feed') {
    return NextResponse.json(ok(paginate(getFeed(), page, pageSize)));
  }

  // 文章详情
  const slugMatch = path.match(/^\/posts\/([^/]+)$/);
  if (slugMatch) {
    const post = getPostBySlug(decodeURIComponent(slugMatch[1]));
    return post ? NextResponse.json(ok(post)) : fail(404, '文章不存在');
  }

  // 各栏目列表
  const listRoutes: Record<string, () => ContentItem[]> = {
    '/posts': () => listPublished('post'),
    '/moments': () => listPublished('moment'),
    '/interviews': () => listPublished('interview'),
    '/links': () => listPublished('link'),
  };
  if (listRoutes[path]) {
    let list = listRoutes[path]();
    const tag = searchParams.get('tag');
    if (tag) list = list.filter((x) => x.tags?.some((t) => t.slug === tag));
    const category = searchParams.get('category');
    if (category && path === '/links') list = list.filter((x) => (x as { category: string }).category === category);
    const kind = searchParams.get('kind');
    if (kind && path === '/interviews') list = list.filter((x) => (x as { kind: string }).kind === kind);
    return NextResponse.json(ok(paginate(list, page, pageSize)));
  }

  if (path === '/tags') {
    return NextResponse.json(ok(getDB().tags));
  }

  const tagContents = path.match(/^\/tags\/([^/]+)\/contents$/);
  if (tagContents) {
    const slug = decodeURIComponent(tagContents[1]);
    const match = (x: ContentItem) => x.tags?.some((t) => t.slug === slug);
    return NextResponse.json(ok({
      posts: listPublished('post').filter(match),
      moments: listPublished('moment').filter(match),
      interviews: listPublished('interview').filter(match),
      links: listPublished('link').filter(match),
    }));
  }

  if (path === '/search') {
    const q = (searchParams.get('q') || '').toLowerCase();
    const hit = (x: ContentItem) =>
      JSON.stringify(x).toLowerCase().includes(q);
    return NextResponse.json(ok({
      posts: listPublished('post').filter(hit),
      moments: listPublished('moment').filter(hit),
      interviews: listPublished('interview').filter(hit),
      links: listPublished('link').filter(hit),
    }));
  }

  if (path === '/site-config') {
    return NextResponse.json(ok(getDB().siteConfig));
  }

  if (path === '/site-overview') {
    return NextResponse.json(ok(buildOverview()));
  }

  if (path === '/comments') {
    const targetType = searchParams.get('targetType') || '';
    const targetId = Number(searchParams.get('targetId') || 0);
    return NextResponse.json(ok(getComments(targetType, targetId)));
  }

  if (path === '/likes/state') {
    const visitorId = searchParams.get('visitorId') || '';
    const targetType = searchParams.get('targetType') || '';
    const targetId = Number(searchParams.get('targetId') || 0);
    const liked = getDB().likes.some((l) => l.visitorId === visitorId && l.targetType === targetType && l.targetId === targetId);
    const likeCount = getDB().likes.filter((l) => l.targetType === targetType && l.targetId === targetId).length;
    return NextResponse.json(ok({ liked, likeCount }));
  }

  return fail(404, '接口不存在');
}

export async function POST(request: Request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/^\/api/, '');
  const body = await request.json();

  if (path === '/comments') {
    const comment = createItem('comment', {
      ...body,
      visitorId: body.visitorId || '',
      status: 'approved',
      createdAt: new Date().toISOString(),
    }) as Comment;
    return NextResponse.json(ok(comment), { status: 201 });
  }

  if (path === '/likes') {
    const result = toggleLike(body.visitorId, body.targetType as CommentTargetType, body.targetId);
    return NextResponse.json(ok(result));
  }

  return fail(404, '接口不存在');
}
