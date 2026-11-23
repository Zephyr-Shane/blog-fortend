import Link from 'next/link';
import { Rss, Code2 } from 'lucide-react';
import { DEFAULT_SITE_NAME } from '@/lib/site';

export function SiteFooter({ siteName = DEFAULT_SITE_NAME }: { siteName?: string }) {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="content-column mx-auto flex flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
        <div>
          <p className="font-serif text-base text-ink">{siteName}</p>
          <p className="mt-1 text-xs text-ink-soft">静水流深，字落云烟 · 在代码与烟火之间寻找平衡</p>
        </div>
        <div className="flex items-center gap-5 text-xs text-ink-soft">
          <Link href="/about" className="hover:text-primary">关于</Link>
          <Link href="/links" className="hover:text-primary">友链</Link>
          <a href="/rss.xml" className="flex items-center gap-1.5 hover:text-primary" aria-label="RSS 订阅">
            <Rss size={14} strokeWidth={1.6} /> RSS
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-primary">
            <Code2 size={15} strokeWidth={1.6} />
          </a>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-[11px] text-ink-soft">
        © {new Date().getFullYear()} {siteName} · 用 Next.js 与热爱构建
        <span className="mx-2 text-line-strong">·</span>
        <Link href="/admin" className="text-line-strong transition-colors hover:text-ink-soft" title="控制台">
          控制台
        </Link>
      </div>
    </footer>
  );
}
