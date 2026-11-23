import { SmartImage as Image } from '@/components/ui/SmartImage';
import { ArrowUpRight } from 'lucide-react';
import { getLinks } from '@/lib/queries';

export const metadata = { title: '友链' };

export default async function LinksPage() {
  const { list } = await getLinks({ category: 'friend' });
  const groups = list.reduce<Record<string, typeof list>>((acc, link) => {
    const key = link.group || '其他';
    (acc[key] ||= []).push(link);
    return acc;
  }, {});

  return (
    <div className="content-column mx-auto px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Blogroll &amp; companions</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">友链</h1>
        <p className="mt-2 text-sm text-ink-soft">值得常去串门的博客 · 已结识 {list.length} 位博友</p>
      </header>

      <div className="space-y-10">
        {Object.entries(groups).map(([name, items]) => (
          <section key={name}>
            <h2 className="mb-5 font-serif text-xl font-semibold text-ink">{name} <span className="text-sm font-normal text-ink-soft">· {items.length} 位</span></h2>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="group flex items-start gap-4 rounded-card border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-line bg-canvas">
                    {link.logo && <Image src={link.logo} alt={link.name} fill className="object-cover" sizes="48px" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-serif text-base font-semibold text-ink group-hover:text-primary">
                      {link.name}
                      <ArrowUpRight size={14} strokeWidth={1.6} className="text-ink-soft group-hover:text-primary" />
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{link.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
        {list.length === 0 && <p className="rounded-card border border-line bg-surface p-10 text-center text-sm text-ink-soft">还没有友链。</p>}
      </div>
    </div>
  );
}
