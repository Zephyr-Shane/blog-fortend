import { getLinks, getCardSlots } from '@/lib/queries';
import { SiteCard } from '@/components/cards/ContentCards';

export const metadata = { title: '娱乐' };

export default async function EntertainmentPage() {
  const [{ list }, slots] = await Promise.all([
    getLinks({ category: 'entertainment' }),
    getCardSlots(),
  ]);

  return (
    <div className="content-column mx-auto px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Curated picks &amp; discoveries</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">娱乐</h1>
        <p className="mt-2 text-sm text-ink-soft">好用的网站与有趣的发现 · 已收录 {list.length} 个</p>
      </header>

      <section className="grid gap-5 md:grid-cols-2">
        {list.map((link) => <SiteCard key={link.id} link={link} config={slots.link} />)}
        {list.length === 0 && (
          <p className="col-span-full rounded-card border border-line bg-surface p-10 text-center text-sm text-ink-soft">还没有收录。</p>
        )}
      </section>
    </div>
  );
}
