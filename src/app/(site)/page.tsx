import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SmartImage as Image } from '@/components/ui/SmartImage';
import { getPosts, getMoments, getInterviews, getLinks, getSiteConfig, getSiteOverview } from '@/lib/queries';
import type { Post, Moment, Interview, SiteLink, ContentItem, SiteOverview } from '@/types/api';
import { stripHtml } from '@/lib/format';
import { FeedRow, type FeedRowData } from '@/components/cards/FeedRow';
import { MomentFeedCard } from '@/components/cards/MomentFeedCard';
import { HomeSidebar } from '@/components/layout/HomeSidebar';

export const metadata = { title: '首页' };

function clip(text: string, max = 96): string {
  const clean = stripHtml(text).replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/** 按栏目把原始内容映射成行卡片所需的最小展示数据 */
function toRow(item: ContentItem & { publishedAt?: string | null }, type: 'post' | 'interview' | 'link'): FeedRowData | null {
  const publishedAt = item.publishedAt ?? item.createdAt;
  switch (type) {
    case 'post': {
      const p = item as Post;
      return {
        href: `/posts/${p.slug}`,
        title: p.title,
        excerpt: clip(p.excerpt),
        category: '随笔',
        publishedAt,
        coverImage: p.coverImage,
      };
    }
    case 'interview': {
      const v = item as Interview;
      return {
        href: '/interviews',
        title: v.title,
        excerpt: clip(v.content, 120),
        category: v.company || '面经',
        publishedAt,
        coverImage: null,
      };
    }
    case 'link': {
      const l = item as SiteLink;
      return {
        href: l.url,
        title: l.name,
        excerpt: clip(l.description, 120),
        category: l.category === 'friend' ? '友链' : '发现',
        publishedAt,
        coverImage: l.logo,
      };
    }
    default:
      return null;
  }
}

const toRows = <T extends ContentItem>(list: T[], type: 'post' | 'interview' | 'link') =>
  list.map((x) => toRow(x, type)).filter((x): x is FeedRowData => x !== null);

function SectionShell({ title, subtitle, href, children }: {
  title: string;
  subtitle: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-3">
        <div>
          <h2 className="font-serif text-xl font-semibold text-ink sm:text-2xl">{title}</h2>
          <p className="mt-0.5 text-[11px] tracking-wide text-ink-soft/80">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-[13px] text-ink-soft transition-colors hover:text-primary"
        >
          查看全部 <ArrowUpRight size={14} strokeWidth={1.6} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Section({ title, subtitle, href, items }: {
  title: string;
  subtitle: string;
  href: string;
  items: FeedRowData[];
}) {
  if (items.length === 0) return null;
  return (
    <SectionShell title={title} subtitle={subtitle} href={href}>
      {items.map((row, i) => <FeedRow key={`${row.href}-${i}`} item={row} />)}
    </SectionShell>
  );
}

/** 侧栏聚合接口单独容错：旧后端未提供该接口时，首页主体照常展示 */
async function safeOverview(): Promise<SiteOverview | null> {
  try {
    return await getSiteOverview();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [site, overview] = await Promise.all([getSiteConfig(), safeOverview()]);
  const showInterview = site.interviewEnabled !== false;

  // 每个栏目独立取数，各取最新若干条；互不干扰，也不受 /feed 分页限制
  const [posts, moments, interviews, links] = await Promise.all([
    getPosts({ page: 1, pageSize: 5 }).catch(() => ({ list: [] as Post[] })),
    getMoments({ page: 1, pageSize: 4 }).catch(() => ({ list: [] as Moment[] })),
    showInterview
      ? getInterviews().catch(() => ({ list: [] as Interview[] }))
      : Promise.resolve({ list: [] as Interview[] }),
    getLinks({ category: '' }).catch(() => ({ list: [] as SiteLink[] })),
  ]);

  const writeups = toRows(posts.list, 'post');
  const life = moments.list.slice(0, 4);
  const interviewRows = toRows(interviews.list, 'interview');
  const entertainment = toRows(links.list.filter((l) => l.category === 'entertainment'), 'link');
  const friends = toRows(links.list.filter((l) => l.category === 'friend'), 'link');
  const hasSections = writeups.length + life.length + interviewRows.length + entertainment.length + friends.length > 0;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12">
      <section className="mb-12 flex flex-col items-start gap-6 rounded-card border border-line bg-surface p-8 md:flex-row md:items-center">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-primary-soft bg-canvas">
          <Image src={site.avatar} alt={site.authorName} fill className="object-cover" sizes="80px" />
        </div>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold text-ink">{site.siteName}</h1>
          <p className="mt-1 text-sm text-ink-soft">{site.subtitle} · {site.description}</p>
        </div>
        <Link href="/about" className="inline-flex items-center gap-1.5 rounded-control border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:border-primary hover:text-primary">
          关于我 <ArrowUpRight size={15} strokeWidth={1.6} />
        </Link>
      </section>

      {/* 参考 jiewen.run：主内容 + 右侧信息栏，不设左侧边栏；窄屏时侧栏堆叠到主内容下方 */}
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          {!hasSections && (
            <p className="rounded-card border border-line bg-surface p-10 text-center text-sm text-ink-soft">
              还没有已发布的内容，稍后再来看看。
            </p>
          )}
          <Section title="最近写下" subtitle="Writing · 文章与技术笔记" href="/posts" items={writeups} />
          {life.length > 0 && (
            <SectionShell title="生活碎片" subtitle="Moments · 此刻与日常" href="/moments">
              {life.map((m) => <MomentFeedCard key={m.id} moment={m} />)}
            </SectionShell>
          )}
          {showInterview && <Section title="面经锦囊" subtitle="Interviews · 面试与求职" href="/interviews" items={interviewRows} />}
          <Section title="发现" subtitle="Discovery · 好站与好工具" href="/entertainment" items={entertainment} />
          <Section title="我的朋友" subtitle="Friends · 同路人的站点" href="/links" items={friends} />
        </main>

        <div className="self-start lg:sticky lg:top-24">
          <HomeSidebar overview={overview} />
        </div>
      </div>
    </div>
  );
}
