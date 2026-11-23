import Link from 'next/link';
import type { Tag } from '@/types/api';

export function TagPill({ tag, clickable = true }: { tag: Tag; clickable?: boolean }) {
  const cls = 'inline-flex items-center rounded-control border border-line bg-canvas px-2 py-0.5 text-[11px] font-medium text-accent transition-colors hover:border-accent hover:bg-accent-soft';
  if (!clickable) return <span className={cls}>#{tag.name}</span>;
  return <Link href={`/tags/${tag.slug}`} className={cls}>#{tag.name}</Link>;
}

export function TagList({ tags }: { tags: Tag[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => <TagPill key={t.id} tag={t} />)}
    </div>
  );
}
