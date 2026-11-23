import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';

/**
 * 首页栏目区块用的行式内容卡片（参考 jiewen.run 的「最近写下」样式）：
 * 左侧日期（日大字 + 月.年）、中间分类/标题/摘要、右侧箭头 + 配图。
 * 无配图时用标题首字生成浅色字母块占位，保证每行视觉重量一致。
 */
export type FeedRowData = {
  href: string;
  title: string;
  excerpt: string;
  /** 分类标签，如「随笔」「动态」「面经」 */
  category: string;
  publishedAt: string;
  coverImage?: string | null;
  /** 无配图时占位块显示的字母，缺省取标题首字 */
  placeholder?: string;
};

function dateParts(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: '--', month: '', year: '' };
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    year: String(d.getFullYear()),
  };
}

export function FeedRow({ item }: { item: FeedRowData }) {
  const { day, month, year } = dateParts(item.publishedAt);
  const letter = (item.placeholder ?? item.title.trim().charAt(0) ?? '文').slice(0, 1).toUpperCase();

  return (
    <Link
      href={item.href}
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-card border border-line bg-surface px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-primary-soft hover:shadow-card-hover sm:gap-6 sm:px-5"
    >
      <div className="w-10 shrink-0 text-center sm:w-12">
        <span className="block font-serif text-2xl font-semibold leading-none text-accent sm:text-3xl">{day}</span>
        <span className="mt-1.5 block font-mono text-[10px] tracking-tight text-ink-soft/80">{month}.{day}</span>
      </div>

      <div className="min-w-0">
          <p className="mb-0.5 text-[11px] text-ink-soft/80">
            {item.category} <span className="mx-1 text-line-strong">·</span> {year}
          </p>
        <h3 className="truncate font-serif text-[15px] font-semibold text-ink transition-colors group-hover:text-primary sm:text-base">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-[12px] leading-relaxed text-ink-soft sm:text-[13px]">
          {item.excerpt || '点开看看这篇内容。'}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ArrowRight size={17} strokeWidth={1.5} className="text-ink-soft/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-control bg-primary-soft sm:block">
          {item.coverImage ? (
            <SmartImage src={item.coverImage} alt={item.title} fill className="object-cover" sizes="96px" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-serif text-2xl font-semibold text-primary/45">
              {letter}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
