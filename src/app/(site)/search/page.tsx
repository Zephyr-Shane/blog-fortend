import { SearchClient } from '@/components/SearchClient';
import { getSiteConfig } from '@/lib/queries';

export const metadata = { title: '搜索' };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q = '' }, site] = await Promise.all([searchParams, getSiteConfig()]);
  return (
    <div className="content-column mx-auto px-6 py-12">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Search &amp; archive</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">搜索</h1>
        <p className="mt-2 text-sm text-ink-soft">在全站内容中检索</p>
      </header>
      <SearchClient initialQuery={q} showInterview={site.interviewEnabled !== false} />
    </div>
  );
}
