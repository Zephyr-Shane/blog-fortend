import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTags, getTagContents, getSiteConfig } from '@/lib/queries';
import { normalizeCardSlots } from '@/lib/card-slots';
import { ArticleCard, MomentCard, InterviewCard, SiteCard } from '@/components/cards/ContentCards';
import type { Post, Moment, Interview, SiteLink } from '@/types/api';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `#${slug}` };
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tags = await getTags();
  const tag = tags.find((t) => t.slug === slug);
  if (!tag) notFound();

  const [contents, site] = await Promise.all([getTagContents(slug), getSiteConfig()]);
  const showInterview = site.interviewEnabled !== false;
  const slots = normalizeCardSlots(site.cardSlots);
  const total = contents.posts.length + contents.moments.length + (showInterview ? contents.interviews.length : 0) + contents.links.length;

  return (
    <div className="content-column mx-auto px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Tag archive</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">#{tag.name}</h1>
        <p className="mt-2 text-sm text-ink-soft">共 {total} 篇聚合内容 · 跨越多个栏目</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.filter((t) => t.id !== tag.id).slice(0, 8).map((t) => (
            <Link key={t.id} href={`/tags/${t.slug}`} className="rounded-control border border-line bg-surface px-2.5 py-1 text-xs text-accent hover:border-accent hover:bg-accent-soft">#{t.name}</Link>
          ))}
        </div>
      </header>

      <section className="space-y-5">
        {contents.posts.map((x) => <ArticleCard key={`p${x.id}`} post={x as Post} config={slots.post} />)}
        {contents.moments.map((x) => <MomentCard key={`m${x.id}`} moment={x as Moment} config={slots.moment} />)}
        {showInterview && contents.interviews.map((x) => <InterviewCard key={`i${x.id}`} interview={x as Interview} config={slots.interview} />)}
        {contents.links.map((x) => <SiteCard key={`l${x.id}`} link={x as SiteLink} config={slots.link} />)}
        {total === 0 && (
          <p className="rounded-card border border-line bg-surface p-10 text-center text-sm text-ink-soft">这个标签下还没有内容。</p>
        )}
      </section>
    </div>
  );
}
