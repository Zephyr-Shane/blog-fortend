import Link from 'next/link';
import { getPosts, getTags, getCardSlots } from '@/lib/queries';
import { ArticleCard } from '@/components/cards/ContentCards';
import { cn } from '@/lib/utils';

export const metadata = { title: '文章' };

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const [{ list }, tags, slots] = await Promise.all([
    getPosts({ pageSize: 50, tag }),
    getTags(),
    getCardSlots(),
  ]);

  return (
    <div className="content-column mx-auto px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Technical logs &amp; essays</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">文章</h1>
        <p className="mt-2 text-sm text-ink-soft">写下、整理与沉淀 · 共 {list.length} 篇文章</p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="标签筛选">
        <Link href="/posts" className={cn(
          'rounded-control px-3.5 py-1.5 text-sm transition-colors',
          !tag ? 'bg-primary font-medium text-white' : 'border border-line bg-surface text-ink-soft hover:border-primary hover:text-primary',
        )}>全部</Link>
        {tags.map((t) => (
          <Link key={t.id} href={`/posts?tag=${t.slug}`} className={cn(
            'rounded-control px-3.5 py-1.5 text-sm transition-colors',
            tag === t.slug ? 'bg-primary font-medium text-white' : 'border border-line bg-surface text-ink-soft hover:border-primary hover:text-primary',
          )}>#{t.name}</Link>
        ))}
      </nav>

      <section className="space-y-5">
        {list.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-10 text-center text-sm text-ink-soft">这个标签下还没有文章。</p>
        ) : list.map((post) => <ArticleCard key={post.id} post={post} config={slots.post} />)}
      </section>
    </div>
  );
}
