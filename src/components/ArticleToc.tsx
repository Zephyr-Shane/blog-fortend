'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { TocItem } from '@/lib/toc';
import { cn } from '@/lib/utils';

/** 文章目录：编号列表 + 滚动高亮当前章节 + 点击平滑跳转 */
export function ArticleToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');

  useEffect(() => {
    if (items.length === 0) return;
    const onScroll = () => {
      const offset = 120;
      let current = items[0].id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= offset) current = item.id;
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="文章目录" className="rounded-card border border-line bg-surface p-5">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft/80">On this page</p>
      <ol className="space-y-2.5">
        {items.map((item, i) => (
          <li key={item.id} className={cn('flex gap-2', item.level === 3 && 'pl-3')}>
            <span className={cn(
              'shrink-0 font-mono text-[11px] leading-[1.5]',
              activeId === item.id ? 'text-accent' : 'text-ink-soft/50',
            )}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (!el) return;
                const top = el.getBoundingClientRect().top + window.scrollY - 96;
                window.scrollTo({ top, behavior: 'smooth' });
                window.history.replaceState(null, '', `#${item.id}`);
                setActiveId(item.id);
              }}
              className={cn(
                'text-[12px] leading-[1.5] transition-colors',
                activeId === item.id
                  ? 'font-medium text-accent'
                  : 'text-ink-soft hover:text-primary',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
      <Link
        href="/posts"
        className="mt-5 inline-flex items-center gap-1.5 border-t border-line pt-4 text-[12px] text-ink-soft transition-colors hover:text-primary"
      >
        <ArrowLeft size={13} strokeWidth={1.6} /> 返回文章列表
      </Link>
    </nav>
  );
}
