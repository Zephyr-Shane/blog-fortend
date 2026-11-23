'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Feather } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartImage } from '@/components/ui/SmartImage';
import { DEFAULT_SITE_NAME } from '@/lib/site';

const NAV = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/posts' },
  { label: '生活', href: '/moments' },
  { label: '面试', href: '/interviews' },
  { label: '娱乐', href: '/entertainment' },
  { label: '友链', href: '/links' },
  { label: '关于', href: '/about' },
];

export function SiteHeader({
  showInterview = true,
  siteName = DEFAULT_SITE_NAME,
  logo = '',
}: {
  showInterview?: boolean;
  siteName?: string;
  logo?: string;
}) {
  const pathname = usePathname();
  const nav = NAV.filter((item) => showInterview || item.href !== '/interviews');

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-sm">
      <div className="content-column mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-control bg-primary text-white transition-colors group-hover:bg-primary-hover">
            {logo ? (
              <SmartImage src={logo} alt={`${siteName} logo`} fill className="object-contain p-1" sizes="32px" />
            ) : (
              <Feather size={17} strokeWidth={1.6} />
            )}
          </span>
          <span className="font-serif text-lg font-semibold tracking-wide text-ink">{siteName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {nav.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative rounded-control px-3 py-2 text-sm transition-colors',
                  isActive ? 'text-primary font-medium' : 'text-ink-soft hover:text-primary',
                )}
              >
                {item.label}
                {isActive && <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/search"
          aria-label="搜索"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink-soft transition-colors hover:border-primary hover:text-primary',
            pathname === '/search' && 'border-primary text-primary',
          )}
        >
          <Search size={17} strokeWidth={1.6} />
        </Link>
      </div>
    </header>
  );
}
