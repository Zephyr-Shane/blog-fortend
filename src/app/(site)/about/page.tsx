import { SmartImage as Image } from '@/components/ui/SmartImage';
import Link from 'next/link';
import { Mail, Code2, Rss } from 'lucide-react';
import { getSiteConfig, getPosts } from '@/lib/queries';

export const metadata = { title: '关于' };

export default async function AboutPage() {
  const [site, { list }] = await Promise.all([
    getSiteConfig(),
    getPosts({ pageSize: 100 }),
  ]);
  const wordCount = list.reduce((n, p) => n + p.content.replace(/<[^>]*>/g, '').length, 0);

  return (
    <div className="prose-column mx-auto px-6 py-12">
      <section className="flex flex-col items-center text-center">
        <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-primary-soft bg-canvas">
          <Image src={site.avatar} alt={site.authorName} fill className="object-cover" sizes="112px" priority />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-semibold text-ink">{site.authorName}</h1>
        <p className="mt-2 text-sm text-ink-soft">{site.description}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs text-ink-soft">
          <span>已写 {list.length} 篇</span>
          <span>·</span>
          <span>累计 {wordCount.toLocaleString()} 字</span>
        </div>
      </section>

      <div className="my-10 border-t border-line" />

      <section>
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">我是谁</h2>
        <p className="leading-8 text-ink">{site.authorBio}</p>
        <p className="mt-4 leading-8 text-ink-soft">
          白天沉浸在终端与代码之间，着迷于状态驱动的整洁设计与组件化背后的数学美感。夜晚与周末，手冲一杯咖啡、写写文字、漫步西湖——创立《{site.siteName}》，就是为了安放这些思考与日常。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">技术栈</h2>
        <div className="flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Next.js', 'Go', 'Redis', 'Spring Boot', '设计系统'].map((s) => (
            <span key={s} className="rounded-control border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft">{s}</span>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">联系我</h2>
        <div className="flex flex-wrap gap-4">
          {site.socialLinks.map((s) => {
            const Icon = s.label.includes('GitHub') ? Code2 : s.label.includes('RSS') ? Rss : Mail;
            return (
              <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-control border border-line bg-surface px-4 py-2 text-sm text-ink-soft transition-colors hover:border-primary hover:text-primary">
                <Icon size={15} strokeWidth={1.6} />{s.label}
              </a>
            );
          })}
        </div>
      </section>

      <div className="mt-12 text-center">
        <Link href="/" className="text-sm text-primary hover:underline">← 返回首页</Link>
      </div>
    </div>
  );
}
