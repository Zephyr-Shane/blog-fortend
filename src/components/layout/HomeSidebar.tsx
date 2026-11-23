import Link from 'next/link';
import { Megaphone, BarChart3, Hash, MessageCircle, ArrowUpRight } from 'lucide-react';
import type { SiteOverview, RecentComment } from '@/types/api';

/**
 * 首页右侧信息栏（参考 jiewen.run：站点公告 / 小小统计 / 常用标签 / 最新评论）。
 * 纯服务端渲染，数据来自 GET /site-overview；不含左侧边栏。
 * 所有数字均为真实统计，不展示未做埋点的「访问量」。
 */

const PANEL = 'rounded-card border border-line bg-surface p-5 shadow-card';

function shortDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function commentHref(c: RecentComment): string {
  switch (c.targetType) {
    case 'post': return c.targetSlug ? `/posts/${c.targetSlug}` : '/posts';
    case 'moment': return '/moments';
    case 'interview': return '/interviews';
    default: return '/links';
  }
}

function PanelTitle({ icon: Icon, eyebrow, title }: {
  icon: typeof Megaphone;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2 border-b border-line pb-3">
      <div className="flex items-center gap-2">
        <Icon size={15} strokeWidth={1.8} className="text-primary" />
        <h2 className="font-serif text-sm font-semibold text-ink">{title}</h2>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft/70">{eyebrow}</span>
    </div>
  );
}

function AnnouncementPanel({ data }: { data: SiteOverview['announcement'] }) {
  if (!data || !data.visible || !data.content?.trim()) return null;
  return (
    <section className={PANEL}>
      <PanelTitle icon={Megaphone} eyebrow="Notice" title="站点公告" />
      <p className="font-serif text-[15px] font-medium leading-relaxed text-ink">
        {data.title?.trim() || '公告'}
      </p>
      <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">
        {data.content}
      </p>
      {data.updatedAt && (
        <p className="mt-4 border-t border-line pt-3 font-mono text-[10px] uppercase tracking-wider text-ink-soft/80">
          最近更新 {shortDate(data.updatedAt)}
        </p>
      )}
    </section>
  );
}

function StatsPanel({ stats }: { stats: SiteOverview['stats'] }) {
  const items = [
    { value: stats.posts, label: '篇文章' },
    { value: stats.moments, label: '条动态' },
    { value: stats.comments, label: '条评论' },
    { value: stats.tags, label: '个标签' },
  ];
  return (
    <section className={PANEL}>
      <PanelTitle icon={BarChart3} eyebrow="Stats" title="小小统计" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-baseline gap-1.5">
            <span className="font-serif text-xl font-semibold tabular-nums text-ink">{it.value}</span>
            <span className="text-[11px] text-ink-soft">{it.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-[11px] text-ink-soft/80">数据实时统计自已发布内容</p>
    </section>
  );
}

function TagsPanel({ tags }: { tags: SiteOverview['popularTags'] }) {
  return (
    <section className={PANEL}>
      <PanelTitle icon={Hash} eyebrow="Tags" title="常用标签" />
      {tags.length === 0 ? (
        <p className="text-[12px] text-ink-soft">还没有标签，发布内容后会自动汇总。</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Link
              key={t.slug}
              href={`/tags/${t.slug}`}
              className="inline-flex items-center gap-1 rounded-control border border-line bg-canvas px-2 py-1 text-[11px] text-ink-soft transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
            >
              <span># {t.name}</span>
              <span className="font-mono text-[10px] text-ink-soft/70">{t.count}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CommentsPanel({ comments }: { comments: SiteOverview['recentComments'] }) {
  return (
    <section className={PANEL}>
      <PanelTitle icon={MessageCircle} eyebrow="Comments" title="最新评论" />
      {comments.length === 0 ? (
        <p className="text-[12px] text-ink-soft">还没有评论，来留下第一条吧。</p>
      ) : (
        <ul className="space-y-3.5">
          {comments.map((c) => (
            <li key={c.id}>
              <Link href={commentHref(c)} className="group block">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft font-serif text-[11px] text-primary">
                    {c.authorName?.trim().charAt(0) || '访'}
                  </span>
                  <span className="truncate text-[12px] font-medium text-ink">{c.authorName}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-ink-soft/80">
                    {shortDate(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 pl-8 text-[12px] leading-relaxed text-ink-soft group-hover:text-primary">
                  {c.content}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function HomeSidebar({ overview }: { overview: SiteOverview | null }) {
  // 接口不可用时不让首页整体报错：只隐藏侧栏数据区
  if (!overview) return null;
  return (
    <aside className="flex flex-col gap-4" aria-label="站点信息栏">
      <AnnouncementPanel data={overview.announcement} />
      <StatsPanel stats={overview.stats} />
      <TagsPanel tags={overview.popularTags} />
      <CommentsPanel comments={overview.recentComments} />
      <Link
        href="/about"
        className="inline-flex items-center justify-center gap-1.5 rounded-control border border-line bg-surface px-4 py-2.5 text-[12px] text-ink-soft transition-colors hover:border-primary hover:text-primary"
      >
        关于本站 <ArrowUpRight size={13} strokeWidth={1.6} />
      </Link>
    </aside>
  );
}
