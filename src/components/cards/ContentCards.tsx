import type { ReactNode } from 'react';
import Link from 'next/link';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { SmartImage as Image } from '@/components/ui/SmartImage';
import type { Post, Moment, Interview, SiteLink } from '@/types/api';
import { TagList } from './TagPill';
import { EngagementBar } from './EngagementBar';
import { TYPE_META, MOOD_META, formatDate, relativeTime, stripHtml } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  DEFAULT_CARD_SLOTS,
  type CardType,
  type CardTypeConfig,
  type SlotKey,
} from '@/lib/card-slots';

// 卡片外层：统一最小高度，让不同内容类型的卡片底部互动栏对齐。
// 外层栅格容器由各页面负责，这里只控制卡片内部。
const cardBase =
  'group flex min-h-[200px] flex-col rounded-card border border-line bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-line-strong';

const CLAMP: Record<number, string> = {
  1: 'line-clamp-1', 2: 'line-clamp-2', 3: 'line-clamp-3',
  4: 'line-clamp-4', 5: 'line-clamp-5', 6: 'line-clamp-6',
};

function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] || TYPE_META.post;
  return (
    <span className={cn('inline-flex items-center rounded-control px-2 py-0.5 text-[11px] font-medium', meta.className)}>
      {meta.label}
    </span>
  );
}

/** 按插槽顺序渲染；每个插槽自带间距，engagement 用 mt-auto 贴底 */
function SlotLayout({ config, slots }: { config: CardTypeConfig; slots: Partial<Record<SlotKey, ReactNode>> }) {
  return (
    <>
      {config.order.map((key) => {
        const node = slots[key];
        if (!node || config.visible[key] === false) return null;
        if (key === 'engagement') return <div key={key} className="mt-auto border-t border-line pt-4">{node}</div>;
        return <div key={key}>{node}</div>;
      })}
    </>
  );
}

/** 左文右图：cover 抽到右侧，其余插槽按 order 渲染在左侧 */
function SlotLayoutWithRightCover({
  config,
  slots,
  cover,
}: {
  config: CardTypeConfig;
  slots: Partial<Record<SlotKey, ReactNode>>;
  cover: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-stretch gap-5">
      <div className="flex min-w-0 flex-1 flex-col">
        {config.order.map((key) => {
          if (key === 'cover') return null;
          const node = slots[key];
          if (!node || config.visible[key] === false) return null;
          if (key === 'engagement') return <div key={key} className="mt-auto border-t border-line pt-4">{node}</div>;
          return <div key={key}>{node}</div>;
        })}
      </div>
      <div className="relative hidden w-40 shrink-0 overflow-hidden rounded-control border border-line bg-canvas sm:block md:w-48 lg:w-56">
        {cover}
      </div>
    </div>
  );
}

function excerptClass(config: CardTypeConfig) {
  return cn('text-sm leading-relaxed text-ink-soft', CLAMP[config.excerptLines] || 'line-clamp-2');
}

export function ArticleCard({ post, config }: { post: Post; config?: CardTypeConfig }) {
  const c = config ?? DEFAULT_CARD_SLOTS.post;
  const cover = post.coverImage ? (
    <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 240px" />
  ) : null;
  const rightCover = c.visible.cover && c.coverPosition === 'right' && !!cover;

  const slots: Partial<Record<SlotKey, ReactNode>> = {
    badge: (
      <div className="mb-3 flex items-center gap-3">
        <TypeBadge type="post" />
        <time className="ml-auto text-xs text-ink-soft">{formatDate(post.publishedAt)}</time>
      </div>
    ),
    title: (
      <Link href={`/posts/${post.slug}`}>
        <h2 className="font-serif text-xl font-semibold leading-snug text-ink transition-colors group-hover:text-primary">
          {post.title}
        </h2>
      </Link>
    ),
    excerpt: <p className={cn('mt-2.5', excerptClass(c))}>{post.excerpt}</p>,
    meta: <div className="mt-4"><TagList tags={post.tags} /></div>,
    cover: c.visible.cover && c.coverPosition === 'top' && cover ? (
      <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-control border border-line bg-canvas">{cover}</div>
    ) : null,
    engagement: (
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-soft">{post.category === 'tech' ? '技术笔记' : '随笔'}</span>
        <EngagementBar targetType="post" targetId={post.id} comments={post.commentCount} likes={post.likeCount} />
      </div>
    ),
  };

  return (
    <article className={cardBase}>
      {rightCover ? (
        <SlotLayoutWithRightCover config={c} slots={slots} cover={cover} />
      ) : (
        <SlotLayout config={c} slots={slots} />
      )}
    </article>
  );
}

/** 九宫格：按数量选栅格，最多 maxImages 张 */
function NineGrid({ images, max }: { images: string[]; max: number }) {
  const list = images.slice(0, Math.min(9, Math.max(1, max)));
  const cols = list.length === 1 ? 'grid-cols-1' : list.length === 2 || list.length === 4 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <div className={cn('mt-4 grid gap-2', cols, list.length === 1 && 'max-w-[320px]')}>
      {list.map((src, i) => (
        <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-control border border-line bg-canvas">
          <Image src={src} alt="动态配图" fill className="object-cover" sizes="(max-width:768px) 45vw, 320px" />
        </div>
      ))}
    </div>
  );
}

export function MomentCard({ moment, config }: { moment: Moment; config?: CardTypeConfig }) {
  const c = config ?? DEFAULT_CARD_SLOTS.moment;
  const mood = MOOD_META[moment.mood] || MOOD_META.thought;
  const slots: Partial<Record<SlotKey, ReactNode>> = {
    badge: (
      <div className="mb-3 flex items-center gap-3">
        <TypeBadge type="moment" />
        <span className={cn('rounded-control px-2 py-0.5 text-[11px] font-medium', mood.className)}>{mood.label}</span>
        <time className="ml-auto text-xs text-ink-soft">{relativeTime(moment.publishedAt)}</time>
      </div>
    ),
    excerpt: (
      <Link href={`/moments/${moment.id}`} className="group block">
        <p className={cn('whitespace-pre-line text-[15px] leading-7 text-ink group-hover:text-primary', CLAMP[c.excerptLines] || 'line-clamp-4')}>{moment.content}</p>
      </Link>
    ),
    cover: moment.images.length > 0 ? <NineGrid images={moment.images} max={c.maxImages} /> : null,
    meta: (
      <div className="mt-4 text-xs text-ink-soft">
        {moment.location ? <span className="flex items-center gap-1"><MapPin size={13} />{moment.location}</span> : <span>日常随记</span>}
      </div>
    ),
    engagement: <EngagementBar targetType="moment" targetId={moment.id} comments={moment.commentCount} likes={moment.likeCount} commentHref={`/moments/${moment.id}`} />,
  };
  return (
    <article className={cardBase}>
      <SlotLayout config={c} slots={slots} />
    </article>
  );
}

export function InterviewCard({ interview, config }: { interview: Interview; config?: CardTypeConfig }) {
  const c = config ?? DEFAULT_CARD_SLOTS.interview;
  const kindLabel = { experience: '面经', question: '题库', prep: '准备' }[interview.kind];
  const slots: Partial<Record<SlotKey, ReactNode>> = {
    badge: (
      <div className="mb-3 flex items-center gap-3">
        <TypeBadge type="interview" />
        <span className="rounded-control bg-surface-container px-2 py-0.5 text-[11px] font-medium text-ink-soft">{kindLabel}</span>
        {interview.company && <span className="text-xs text-ink-soft">{interview.company}</span>}
        <time className="ml-auto text-xs text-ink-soft">{formatDate(interview.publishedAt)}</time>
      </div>
    ),
    title: <h2 className="font-serif text-lg font-semibold leading-snug text-ink">{interview.title}</h2>,
    excerpt: <p className={cn('mt-2', excerptClass(c))}>{stripHtml(interview.content)}</p>,
    meta: <div className="mt-4"><TagList tags={interview.tags} /></div>,
    engagement: <EngagementBar targetType="interview" targetId={interview.id} comments={interview.commentCount} likes={interview.likeCount} />,
  };
  return (
    <article className={cardBase}>
      <SlotLayout config={c} slots={slots} />
    </article>
  );
}

export function SiteCard({ link, config }: { link: SiteLink; config?: CardTypeConfig }) {
  const c = config ?? DEFAULT_CARD_SLOTS.link;
  const coverNode = link.logo ? (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-control border border-line bg-canvas">
      <Image src={link.logo} alt={link.name} fill className="object-cover" sizes="40px" />
    </div>
  ) : null;
  const withSideCover = c.visible.cover && !!coverNode;

  // link 卡片：badge 置顶，封面（logo）与标题/摘要横向排列，互动栏贴底。
  // 这里针对 link 的视觉习惯单独排版，其余插槽显隐仍按配置生效。
  const titleNode = c.visible.title ? (
    <a href={link.url} target="_blank" rel="noreferrer" className="group/link inline-flex items-center gap-1 font-serif text-lg font-semibold text-ink hover:text-primary">
      {link.name}
      <ArrowUpRight size={15} strokeWidth={1.6} className="text-ink-soft group-hover/link:text-primary" />
    </a>
  ) : null;
  const excerptNode = c.visible.excerpt ? (
    <p className={cn('mt-1.5', excerptClass(c))}>{link.description}</p>
  ) : null;

  return (
    <article className={cardBase}>
      {c.visible.badge && (
        <div className="mb-3 flex items-center gap-3">
          <TypeBadge type={link.category === 'friend' ? 'friend' : 'entertainment'} />
          {link.group && <span className="text-xs text-ink-soft">{link.group}</span>}
          <time className="ml-auto text-xs text-ink-soft">{formatDate(link.publishedAt)}</time>
        </div>
      )}
      <div className="flex flex-1 items-start gap-3">
        {withSideCover && coverNode}
        <div className="min-w-0 flex-1">
          {titleNode}
          {excerptNode}
        </div>
      </div>
      {c.visible.engagement && (
        <div className="mt-auto border-t border-line pt-4">
          <EngagementBar targetType="link" targetId={link.id} comments={link.commentCount} likes={link.likeCount} />
        </div>
      )}
    </article>
  );
}
