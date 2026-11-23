import Link from 'next/link';
import { getMoments } from '@/lib/queries';
import { MomentFeedCard } from '@/components/cards/MomentFeedCard';
import { cn } from '@/lib/utils';

export const metadata = { title: '生活' };

const MOODS = [
  { key: '', label: '全部' },
  { key: 'calm', label: '🌿 平静' },
  { key: 'happy', label: '✨ 开心' },
  { key: 'solitude', label: '☕ 独处' },
  { key: 'thought', label: '🌙 随感' },
  { key: 'melancholy', label: '🌧️ 碎念' },
];

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: Promise<{ mood?: string }>;
}) {
  const { mood = '' } = await searchParams;
  const { list } = await getMoments({ pageSize: 50 });

  // 心情筛选在前端数据层做（mock 阶段），接后端后由 API 处理
  const filtered = mood ? list.filter((m) => m.mood === mood) : list;

  return (
    <div className="mx-auto max-w-[640px] px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Daily notes &amp; musings</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">生活</h1>
        <p className="mt-2 text-sm text-ink-soft">日常、心情与碎碎念 · 累计 {list.length} 条</p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="心情筛选">
        {MOODS.map((m) => (
          <Link
            key={m.key}
            href={m.key ? `/moments?mood=${m.key}` : '/moments'}
            className={cn(
              'rounded-control px-3 py-1.5 text-sm transition-colors',
              mood === m.key
                ? 'bg-primary font-medium text-white'
                : 'border border-line bg-surface text-ink-soft hover:border-primary hover:text-primary',
            )}
          >
            {m.label}
          </Link>
        ))}
      </nav>

      <section className="space-y-5">
        {filtered.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-10 text-center text-sm text-ink-soft">这个心情下还没有动态。</p>
        ) : filtered.map((m) => <MomentFeedCard key={m.id} moment={m} />)}
      </section>
    </div>
  );
}
