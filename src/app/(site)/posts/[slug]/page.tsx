import Link from 'next/link';
import { SmartImage as Image } from '@/components/ui/SmartImage';
import { notFound } from 'next/navigation';
import { CalendarDays, Clock, MessageCircle, List } from 'lucide-react';
import { getPostBySlug, getComments, getSiteConfig } from '@/lib/queries';
import { formatDate } from '@/lib/format';
import { extractToc } from '@/lib/toc';
import { ArticleToc } from '@/components/ArticleToc';
import { LikeButton, CommentSection } from '@/components/PostInteractions';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return { title: post?.title || '文章' };
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post;
  try {
    post = await getPostBySlug(slug);
  } catch {
    notFound();
  }
  if (!post || post.status !== 'published') notFound();

  const [comments, site] = await Promise.all([
    getComments('post', post.id),
    getSiteConfig(),
  ]);

  const signature = site.articleSignature || site.authorName;
  const { html, toc } = extractToc(post.content);

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      <nav className="mb-8 flex items-center gap-2 text-xs text-ink-soft">
        <Link href="/" className="hover:text-primary">首页</Link>
        <span>/</span>
        <Link href="/posts" className="hover:text-primary">文章</Link>
        <span>/</span>
        <span>正文</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)_320px] xl:gap-10">
        {/* 左：文章目录（桌面 sticky；窄屏折叠在正文上方） */}
        <aside className="hidden lg:block lg:sticky lg:top-24">
          <ArticleToc items={toc} />
        </aside>

        {/* 中：正文主体 */}
        <main className="min-w-0">
          <details className="mb-6 rounded-card border border-line bg-surface p-4 lg:hidden">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
              <List size={16} strokeWidth={1.6} className="text-primary" /> 文章目录
            </summary>
            <div className="mt-4">
              <ArticleToc items={toc} />
            </div>
          </details>

          <article>
            <h1 className="font-serif text-3xl font-semibold leading-tight text-ink md:text-4xl">{post.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
              <span className="font-medium text-ink">✍️ {signature}</span>
              {(post.coAuthors ?? []).filter((a) => a.name.trim()).map((a, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-line-strong">·</span>
                  {a.blogUrl ? (
                    <a href={a.blogUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{a.name}</a>
                  ) : (
                    <span>{a.name}</span>
                  )}
                  <span className="text-[11px] text-line-strong">共创</span>
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-soft">
              <span className="flex items-center gap-1.5"><CalendarDays size={14} strokeWidth={1.6} />{formatDate(post.publishedAt)}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} strokeWidth={1.6} />预计阅读 8 分钟</span>
              <span className="flex items-center gap-1.5"><MessageCircle size={14} strokeWidth={1.6} />{post.commentCount}</span>
            </div>
            <div className="mt-6">
              <LikeButton targetType="post" targetId={post.id} initialLikes={post.likeCount} />
            </div>

            {post.coverImage && (
              <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-card border border-line bg-canvas">
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="720px" priority />
              </div>
            )}

            <div
              className="article-body mt-10"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
              {post.tags.map((t) => (
                <Link key={t.id} href={`/tags/${t.slug}`} className="rounded-control border border-line bg-canvas px-2.5 py-1 text-xs text-accent hover:border-accent hover:bg-accent-soft">#{t.name}</Link>
              ))}
            </div>
          </article>

          {/* 窄屏：评论在正文下方 */}
          <div className="lg:hidden">
            <CommentSection targetType="post" targetId={post.id} initialComments={comments} authorName={site.authorName} />
          </div>
        </main>

        {/* 右：评论区（桌面 sticky，内部可滚动） */}
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <CommentSection targetType="post" targetId={post.id} initialComments={comments} authorName={site.authorName} compact />
        </aside>
      </div>
    </div>
  );
}
