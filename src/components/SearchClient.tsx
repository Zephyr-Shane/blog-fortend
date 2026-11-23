'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Loader2 } from 'lucide-react';
import type { Post, Moment, Interview, SiteLink } from '@/types/api';
import { formatDate } from '@/lib/format';
import { clientGet } from '@/lib/client-api';

type Results = {
  posts: Post[];
  moments: Moment[];
  interviews: Interview[];
  links: SiteLink[];
};

const EMPTY: Results = { posts: [], moments: [], interviews: [], links: [] };

export function SearchClient({ initialQuery, showInterview = true }: { initialQuery: string; showInterview?: boolean }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = initialQuery.trim();
    if (!q) return;
    setLoading(true);
    clientGet<Results>(`/search?q=${encodeURIComponent(q)}`)
      .then((data) => {
        setResults(data ?? EMPTY);
        setSearched(true);
      })
      .catch(() => setResults(EMPTY))
      .finally(() => setLoading(false));
  }, [initialQuery]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    window.history.replaceState(null, '', q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    if (!q) {
      setResults(EMPTY);
      setSearched(false);
      return;
    }
    setLoading(true);
    clientGet<Results>(`/search?q=${encodeURIComponent(q)}`)
      .then((data) => {
        setResults(data ?? EMPTY);
        setSearched(true);
      })
      .catch(() => setResults(EMPTY))
      .finally(() => setLoading(false));
  }

  const total = results.posts.length + results.moments.length + (showInterview ? results.interviews.length : 0) + results.links.length;

  return (
    <>
      <form onSubmit={submit} className="mb-10 flex gap-3">
        <div className="relative flex-1">
          <Search size={18} strokeWidth={1.6} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文章、动态、题目、网站……"
            className="w-full rounded-control border border-line bg-surface py-3 pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <button type="submit" className="rounded-control bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
          搜索
        </button>
      </form>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft">
          <Loader2 size={18} className="animate-spin" /> 检索中……
        </div>
      )}

      {!loading && searched && (
        <>
          <p className="mb-8 text-sm text-ink-soft">找到 {total} 条结果</p>
          {total === 0 ? (
            <p className="rounded-card border border-line bg-surface p-10 text-center text-sm text-ink-soft">没有找到相关内容，换个关键词试试。</p>
          ) : (
            <div className="space-y-10">
              <ResultGroup title="技术" count={results.posts.length}>
                {results.posts.map((p) => (
                  <ResultRow key={p.id} href={`/posts/${p.slug}`} title={p.title} meta={formatDate(p.publishedAt)} excerpt={p.excerpt} />
                ))}
              </ResultGroup>
              <ResultGroup title="生活" count={results.moments.length}>
                {results.moments.map((m) => (
                  <ResultRow key={m.id} href="/moments" title={m.content.slice(0, 40)} meta={formatDate(m.publishedAt)} excerpt={m.content} />
                ))}
              </ResultGroup>
              {showInterview && (
                <ResultGroup title="面试" count={results.interviews.length}>
                  {results.interviews.map((i) => (
                    <ResultRow key={i.id} href="/interviews" title={i.title} meta={i.company || ''} excerpt={i.content.replace(/<[^>]*>/g, '').slice(0, 100)} />
                  ))}
                </ResultGroup>
              )}
              <ResultGroup title="娱乐" count={results.links.length}>
                {results.links.map((l) => (
                  <ResultRow key={l.id} href={l.url} title={l.name} meta={l.category === 'friend' ? '友链' : '网站'} excerpt={l.description} />
                ))}
              </ResultGroup>
            </div>
          )}
        </>
      )}

      {!loading && !searched && (
        <p className="rounded-card border border-line bg-surface p-10 text-center text-sm text-ink-soft">输入关键词开始检索。</p>
      )}
    </>
  );
}

function ResultGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (!count) return null;
  return (
    <section>
      <h2 className="mb-4 font-serif text-lg font-semibold text-ink">{title} <span className="text-sm font-normal text-ink-soft">({count})</span></h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ResultRow({ href, title, meta, excerpt }: { href: string; title: string; meta: string; excerpt: string }) {
  const external = href.startsWith('http');
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium text-ink line-clamp-1">{title}</h3>
        {meta && <span className="shrink-0 text-xs text-ink-soft">{meta}</span>}
      </div>
      <p className="mt-1 text-sm text-ink-soft line-clamp-1">{excerpt}</p>
    </>
  );
  const cls = 'block rounded-card border border-line bg-surface p-4 transition-all hover:border-line-strong hover:shadow-card-hover';
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>{content}</a>
  ) : (
    <Link href={href} className={cls}>{content}</Link>
  );
}
