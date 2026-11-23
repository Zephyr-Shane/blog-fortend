import Link from 'next/link';
import { MapPin, MessageCircle } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import type { Moment } from '@/types/api';
import { MOOD_META, relativeTime } from '@/lib/format';
import { LikeButton } from '@/components/PostInteractions';
import { cn } from '@/lib/utils';

/**
 * 图片预览：始终按「每行三张」的网格排布，每张图固定占一个格子（1/3 宽），
 * 不随实际图片数量改变尺寸——1 张也只占一格，绝不放大撑满整卡。
 * 最多显示 3 张，超过时第 3 张叠加「+N」遮罩，点击整块进详情页看全部。
 */
function ImagePreview({ images }: { images: string[] }) {
  const list = images.slice(0, 3);
  const more = images.length - list.length;
  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5">
      {list.map((src, i) => (
        <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-control border border-line bg-canvas">
          <SmartImage src={src} alt="动态配图" fill className="object-cover" sizes="(max-width:768px) 30vw, 220px" />
          {more > 0 && i === list.length - 1 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/60 text-white">
              <span className="font-serif text-xl font-semibold leading-none">+{more}</span>
              <span className="mt-0.5 text-[10px] text-white/85">更多图片</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * 首页「生活碎片」专用动态卡片：正文只渲染一次（不硬凑标题/摘要），
 * 配图最多预览 3 张（超出显示 +N 遮罩），顶部标心情/时间/地点；整卡点击进入详情页看全文与全部图片/评论，
 * 卡片内不再就地展开评论区（保持首页轻量）。
 */
export function MomentFeedCard({ moment }: { moment: Moment }) {
  const mood = MOOD_META[moment.mood] ?? MOOD_META.thought;

  return (
    <article className="rounded-card border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={cn('rounded-control px-2 py-0.5 text-[11px] font-medium', mood.className)}>{mood.label}</span>
        <time className="text-xs text-ink-soft">{relativeTime(moment.publishedAt)}</time>
        {moment.location && (
          <span className="flex items-center gap-1 text-xs text-ink-soft">
            <MapPin size={12} strokeWidth={1.6} />{moment.location}
          </span>
        )}
      </div>

      <Link href={`/moments/${moment.id}`} className="group block">
        <p className="whitespace-pre-line text-[14px] leading-7 text-ink line-clamp-4 transition-colors group-hover:text-primary">
          {moment.content}
        </p>
        {moment.images?.length > 0 && <ImagePreview images={moment.images} />}
      </Link>

      <div className="mt-4 flex items-center gap-4 border-t border-line pt-3">
        <LikeButton targetType="moment" targetId={moment.id} initialLikes={moment.likeCount} />
        <Link
          href={`/moments/${moment.id}`}
          className="flex items-center gap-1.5 text-xs text-ink-soft transition-colors hover:text-primary"
        >
          <MessageCircle size={14} strokeWidth={1.6} />{moment.commentCount} 评论 · 查看详情
        </Link>
      </div>
    </article>
  );
}
