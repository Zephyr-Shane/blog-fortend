'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Loader2 } from 'lucide-react';
import type { Comment } from '@/types/api';
import { cn } from '@/lib/utils';
import { clientGet, clientPost, getLikeState } from '@/lib/client-api';
import { getVisitorId } from '@/lib/visitor';
import { CommentSection } from '@/components/PostInteractions';

/**
 * 卡片底部互动栏：内联点赞 + 点击评论就地展开评论区。
 * 卡片本身仍由服务端渲染，本组件是其中的客户端交互岛。
 */
export function EngagementBar({
  targetType,
  targetId,
  comments,
  likes,
  authorName,
  commentHref,
}: {
  targetType: 'post' | 'moment' | 'interview' | 'link';
  targetId: number;
  comments: number;
  likes: number;
  authorName?: string;
  /** 传入后评论入口改为跳转详情页，不再就地展开 */
  commentHref?: string;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [likeBusy, setLikeBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<Comment[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    getLikeState(getVisitorId(), targetType, targetId)
      .then((d) => { if (alive) { setLiked(d.liked); setLikeCount(d.likeCount); } })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [targetType, targetId]);

  async function toggleLike() {
    if (likeBusy) return;
    setLikeBusy(true);
    try {
      const d = await clientPost<{ liked: boolean; likeCount: number }>('/likes', {
        visitorId: getVisitorId(), targetType, targetId,
      });
      setLiked(d.liked);
      setLikeCount(d.likeCount);
    } catch { /* 保持原状 */ } finally { setLikeBusy(false); }
  }

  async function toggleComments() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (loaded) return;
    setLoading(true);
    try {
      const list = await clientGet<Comment[]>(`/comments?targetType=${targetType}&targetId=${targetId}`);
      setLoaded(list);
    } catch {
      setLoaded([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 text-xs text-ink-soft">
        {commentHref ? (
          <Link
            href={commentHref}
            className="flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <MessageCircle size={14} strokeWidth={1.6} />
            {comments}
            <span className="hidden sm:inline">评论</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={toggleComments}
            className="flex items-center gap-1.5 transition-colors hover:text-primary"
            aria-expanded={open}
          >
            <MessageCircle size={14} strokeWidth={1.6} />
            {loaded ? loaded.length : comments}
            <span className="hidden sm:inline">{open ? '收起' : '评论'}</span>
          </button>
        )}
        <button
          type="button"
          onClick={toggleLike}
          disabled={likeBusy}
          className={cn('flex items-center gap-1.5 transition-colors disabled:opacity-50', liked ? 'text-accent' : 'hover:text-accent')}
        >
          <Heart size={14} strokeWidth={1.6} fill={liked ? 'currentColor' : 'none'} />
          {likeCount}
          <span className="hidden sm:inline">{liked ? '已赞' : '点赞'}</span>
        </button>
      </div>

      {open && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-ink-soft">
              <Loader2 size={14} className="animate-spin" /> 加载评论…
            </div>
          ) : (
            <CommentSection
              targetType={targetType}
              targetId={targetId}
              initialComments={loaded ?? []}
              authorName={authorName}
              compact
            />
          )}
        </div>
      )}
    </div>
  );
}
