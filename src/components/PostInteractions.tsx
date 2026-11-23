'use client';

import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Send, Loader2, CornerDownRight } from 'lucide-react';
import type { Comment } from '@/types/api';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { clientPost, getLikeState } from '@/lib/client-api';
import { getVisitorId } from '@/lib/visitor';

export function LikeButton({
  targetType,
  targetId,
  initialLikes,
}: {
  targetType: 'post' | 'moment' | 'interview' | 'link';
  targetId: number;
  initialLikes: number;
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialLikes);
  const [busy, setBusy] = useState(false);

  // 加载时回显当前访客是否已赞（以关联表为准的计数）
  useEffect(() => {
    let alive = true;
    getVisitorId();
    getLikeState(getVisitorId(), targetType, targetId)
      .then((data) => {
        if (alive) {
          setLiked(data.liked);
          setCount(data.likeCount);
        }
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [targetType, targetId]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const data = await clientPost<{ liked: boolean; likeCount: number }>('/likes', {
        visitorId: getVisitorId(), targetType, targetId,
      });
      setLiked(data.liked);
      setCount(data.likeCount);
    } catch {
      // 点赞失败保持原状
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={cn(
        'inline-flex items-center gap-2 rounded-control border px-4 py-2 text-sm transition-colors disabled:opacity-50',
        liked
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-line bg-surface text-ink-soft hover:border-accent hover:text-accent',
      )}
    >
      <Heart size={17} strokeWidth={1.6} fill={liked ? 'currentColor' : 'none'} />
      {liked ? '已赞' : '点赞'} · {count}
    </button>
  );
}

/** 单条评论（支持作者回复楼中楼） */
function CommentItem({
  c,
  replies,
  authorName,
}: {
  c: Comment;
  replies: Comment[];
  authorName?: string;
}) {
  const isAuthor = authorName && c.authorName === authorName;
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          {c.authorName}
          {isAuthor && <span className="rounded-control bg-primary-soft px-1.5 py-0.5 text-[10px] text-primary">作者</span>}
        </span>
        <time className="text-xs text-ink-soft">{formatDate(c.createdAt)}</time>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{c.content}</p>
      {replies.length > 0 && (
        <div className="mt-4 space-y-3 border-l-2 border-primary-soft pl-4">
          {replies.map((r) => (
            <div key={r.id}>
              <div className="flex items-center gap-2 text-xs">
                <CornerDownRight size={13} className="text-primary" />
                <span className="font-medium text-ink">{r.authorName}</span>
                <span className="rounded-control bg-primary-soft px-1.5 py-0.5 text-[10px] text-primary">作者回复</span>
                <time className="text-ink-soft">{formatDate(r.createdAt)}</time>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({
  targetType,
  targetId,
  initialComments,
  authorName,
  compact = false,
}: {
  targetType: 'post' | 'moment' | 'interview' | 'link';
  targetId: number;
  initialComments: Comment[];
  authorName?: string;
  compact?: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => { setComments(initialComments); }, [initialComments]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setNotice('请填写昵称和评论内容');
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      const created = await clientPost<Comment>('/comments', {
        targetType, targetId, parentId: null,
        visitorId: getVisitorId(), authorName: name, authorEmail: email, content,
      });
      // 即时显示：直接把返回的评论加入列表
      setComments((prev) => [...prev, created]);
      setContent('');
      setNotice('评论已发布');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '提交失败');
    } finally {
      setBusy(false);
    }
  }

  // 顶层评论 + 其作者回复（楼中楼）
  const roots = comments.filter((c) => !c.parentId);
  const repliesOf = (id: number) => comments.filter((c) => c.parentId === id);

  return (
    <section className={cn(compact ? 'mt-4' : 'mt-14')}>
      <h2 className={cn('flex items-center gap-2 font-serif font-semibold text-ink', compact ? 'mb-4 text-base' : 'mb-6 text-xl')}>
        <MessageCircle size={compact ? 16 : 19} strokeWidth={1.6} className="text-primary" /> 评论 · {comments.length}
      </h2>

      <div className="space-y-4">
        {roots.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-ink-soft">还没有评论，来聊聊吧。</p>
        ) : roots.map((c) => (
          <CommentItem key={c.id} c={c} replies={repliesOf(c.id)} authorName={authorName} />
        ))}
      </div>

      <form onSubmit={submit} className={cn('rounded-card border border-line bg-surface', compact ? 'mt-5 p-4' : 'mt-8 p-6')}>
        <h3 className="mb-4 font-medium text-ink">留下你的想法</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="昵称"
            className="rounded-control border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱（不公开）"
            type="email"
            className="rounded-control border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="说点什么……"
          rows={compact ? 3 : 4}
          className="mt-3 w-full resize-y rounded-control border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-ink-soft">{notice}</span>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-control bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} strokeWidth={1.6} />}
            发布评论
          </button>
        </div>
      </form>
    </section>
  );
}
