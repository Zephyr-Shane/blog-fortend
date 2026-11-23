import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { getMomentById, getComments, getSiteConfig } from '@/lib/queries';
import { MOOD_META, formatDate } from '@/lib/format';
import { CommentSection } from '@/components/PostInteractions';
import { LikeButton } from '@/components/PostInteractions';
import { cn } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moment = await getMomentById(Number(id)).catch(() => null);
  if (!moment) return { title: '动态' };
  const text = moment.content.replace(/\s+/g, ' ').trim();
  return { title: `${text.slice(0, 24)}${text.length > 24 ? '…' : ''} · 动态` };
}

function DetailGrid({ images }: { images: string[] }) {
  const list = images.slice(0, 9);
  const cols = list.length === 1 ? 'grid-cols-1' : list.length === 2 || list.length === 4 ? 'grid-cols-2' : 'grid-cols-3';
  // 单图限制宽度，避免整卡被一张大图撑满
  return (
    <div className={cn('mt-6 grid gap-2', cols, list.length === 1 && 'max-w-md')}>
      {list.map((src, i) => (
        <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-canvas">
          <SmartImage src={src} alt="动态配图" fill className="object-cover" sizes="(max-width:768px) 100vw, 600px" />
        </div>
      ))}
    </div>
  );
}

export default async function MomentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const moment = await getMomentById(numericId).catch(() => null);
  if (!moment || moment.status !== 'published') notFound();

  const [comments, site] = await Promise.all([
    getComments('moment', moment.id),
    getSiteConfig(),
  ]);
  const mood = MOOD_META[moment.mood] ?? MOOD_META.thought;

  return (
    <div className="mx-auto max-w-[760px] px-6 py-12">
      <Link href="/moments" className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-primary">
        <ArrowLeft size={15} strokeWidth={1.6} /> 返回生活列表
      </Link>

      <article className="rounded-card border border-line bg-surface p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className={cn('rounded-control px-2.5 py-1 text-xs font-medium', mood.className)}>{mood.label}</span>
          <time className="text-sm text-ink-soft">{formatDate(moment.publishedAt)}</time>
          {moment.location && (
            <span className="flex items-center gap-1 text-sm text-ink-soft">
              <MapPin size={14} strokeWidth={1.6} />{moment.location}
            </span>
          )}
        </div>

        <p className="whitespace-pre-line font-serif text-[17px] leading-8 text-ink">{moment.content}</p>

        {moment.images?.length > 0 && <DetailGrid images={moment.images} />}

        <div className="mt-6 border-t border-line pt-5">
          <LikeButton targetType="moment" targetId={moment.id} initialLikes={moment.likeCount} />
        </div>
      </article>

      <div className="mt-10">
        <CommentSection
          targetType="moment"
          targetId={moment.id}
          initialComments={comments}
          authorName={site.authorName}
        />
      </div>
    </div>
  );
}
