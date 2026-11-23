import { CheckCircle2, XCircle, Loader2, BookOpen, ListChecks, FileText } from 'lucide-react';
import { getInterviews, getSiteConfig } from '@/lib/queries';
import { notFound } from 'next/navigation';
import { QuestionItem } from '@/components/cards/QuestionItem';
import { stripHtml, formatDate } from '@/lib/format';
import type { Interview } from '@/types/api';

export const metadata = { title: '面试档案' };

const RESULT_META: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  pass: { label: '通过 / Offer', cls: 'bg-primary-soft text-primary', icon: CheckCircle2 },
  fail: { label: '未通过', cls: 'bg-canvas text-ink-soft', icon: XCircle },
  ongoing: { label: '进行中', cls: 'bg-accent-soft text-accent', icon: Loader2 },
};

function ExperienceCard({ item }: { item: Interview }) {
  const meta = RESULT_META[item.result || 'ongoing'];
  const Icon = meta.icon;
  return (
    <article className="rounded-card border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-ink-soft">{item.company}</span>
        <span className={`inline-flex items-center gap-1 rounded-control px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}>
          <Icon size={12} strokeWidth={1.8} />{meta.label}
        </span>
      </div>
      <h3 className="mt-3 font-serif text-lg font-semibold text-ink">{item.position}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{stripHtml(item.content)}</p>
      <p className="mt-4 text-xs text-ink-soft">{formatDate(item.publishedAt)}</p>
    </article>
  );
}

export default async function InterviewsPage() {
  const site = await getSiteConfig();
  if (site.interviewEnabled === false) notFound();
  const { list } = await getInterviews();
  const experiences = list.filter((x) => x.kind === 'experience');
  const questions = list.filter((x) => x.kind === 'question');
  const preps = list.filter((x) => x.kind === 'prep');

  return (
    <div className="content-column mx-auto px-6 py-12">
      <header className="mb-12">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Engineering archive</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">面试档案</h1>
        <p className="mt-2 text-sm text-ink-soft">准备、题目与复盘 · 收录 {list.length} 条内容</p>
      </header>

      {/* 面经 */}
      <section className="mb-14">
        <h2 className="mb-5 flex items-center gap-2 font-serif text-xl font-semibold text-ink">
          <BookOpen size={19} strokeWidth={1.6} className="text-primary" /> 实战面经复盘
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          {experiences.map((x) => <ExperienceCard key={x.id} item={x} />)}
          {experiences.length === 0 && <p className="text-sm text-ink-soft">暂无面经。</p>}
        </div>
      </section>

      {/* 题库 */}
      <section className="mb-14">
        <h2 className="mb-5 flex items-center gap-2 font-serif text-xl font-semibold text-ink">
          <ListChecks size={19} strokeWidth={1.6} className="text-primary" /> 高频题库
        </h2>
        <div className="space-y-3">
          {questions.map((x) => <QuestionItem key={x.id} item={x} />)}
          {questions.length === 0 && <p className="text-sm text-ink-soft">暂无题目。</p>}
        </div>
      </section>

      {/* 准备 */}
      <section>
        <h2 className="mb-5 flex items-center gap-2 font-serif text-xl font-semibold text-ink">
          <FileText size={19} strokeWidth={1.6} className="text-primary" /> 准备笔记
        </h2>
        <div className="space-y-3">
          {preps.map((x) => (
            <article key={x.id} className="rounded-card border border-line bg-surface p-6">
              <h3 className="font-serif text-lg font-semibold text-ink">{x.title}</h3>
              <div className="article-body mt-3 text-sm" dangerouslySetInnerHTML={{ __html: x.content }} />
            </article>
          ))}
          {preps.length === 0 && <p className="text-sm text-ink-soft">暂无笔记。</p>}
        </div>
      </section>
    </div>
  );
}
