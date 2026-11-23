'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Ban,
  Trash2,
  Loader2,
  MessageSquare,
  Search,
  Reply,
  Send,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { adminGet, adminPost, adminPatch, adminDelete, clientPost } from '@/lib/client-api';
import type { Comment, CommentStatus, SiteConfig } from '@/types/api';

const statusMeta: Record<CommentStatus, { label: string; cls: string }> = {
  pending: { label: '待审核', cls: 'bg-accent-soft text-accent' },
  approved: { label: '已通过', cls: 'bg-primary-soft text-primary' },
  spam: { label: '垃圾', cls: 'bg-canvas text-ink-soft' },
  hidden: { label: '已隐藏', cls: 'bg-accent-soft text-accent' },
};

const targetLabel: Record<string, string> = { post: '文章', moment: '动态', interview: '面试', link: '站点' };

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | CommentStatus>('all');
  const [keyword, setKeyword] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const [authorName, setAuthorName] = useState('作者');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, cfg] = await Promise.all([
        adminGet<Comment[]>('/comment'),
        adminGet<SiteConfig>('/site-config'),
      ]);
      setComments(list ?? []);
      if (cfg?.authorName) setAuthorName(cfg.authorName);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [version]);

  useEffect(() => { load(); }, [load]);

  async function review(id: number, status: 'approved' | 'spam' | 'hidden') {
    setBusyId(id);
    try {
      await adminPatch(`/comments/${id}/review`, { status });
      setVersion((v) => v + 1);
    } catch { /* 审核失败保持原状 */ } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    if (!window.confirm('确定删除这条评论吗？其下的回复也会保留为独立记录。')) return;
    try {
      await adminDelete(`/comment/${id}`);
      setVersion((v) => v + 1);
    } catch { /* 删除失败保持原状 */ }
  }

  async function sendReply(target: Comment) {
    if (!replyText.trim()) return;
    setBusyId(target.id);
    try {
      // 作者回复：parentId 指向被回复评论，visitorId 留空标识为作者
      await clientPost('/comments', {
        targetType: target.targetType,
        targetId: target.targetId,
        parentId: target.id,
        visitorId: '',
        authorName,
        authorEmail: '',
        content: replyText.trim(),
      });
      setReplyText('');
      setReplyTo(null);
      setVersion((v) => v + 1);
    } catch { /* 回复失败保持原状 */ } finally {
      setBusyId(null);
    }
  }

  // 作者回复映射到对应顶层评论（楼中楼）
  const repliesOf = (id: number) => comments.filter((c) => c.parentId === id);
  const roots = comments.filter((c) => !c.parentId);

  const visibleRoots = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return roots.filter((c) => {
      if (filter !== 'all' && c.status !== filter) return false;
      if (!q) return true;
      return [c.authorName, c.content, c.authorEmail].some((v) => v.toLowerCase().includes(q));
    });
  }, [roots, filter, keyword]);

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs tracking-wider text-ink-soft">Console / 评论管理</div>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">评论管理</h1>
        <p className="mt-1 text-sm text-ink-soft">访客评论即时显示；可回复、标记垃圾或删除</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索作者或内容…"
            className="w-full rounded-control border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <div className="flex gap-1 rounded-control border border-line bg-surface p-1">
          {(['all', 'pending', 'approved', 'spam', 'hidden'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'rounded px-3 py-1 text-xs transition-colors',
                filter === s ? 'bg-primary-soft font-medium text-primary' : 'text-ink-soft hover:text-ink',
              )}
            >
              {s === 'all' ? '全部' : statusMeta[s].label}
            </button>
          ))}
        </div>
        <button
          onClick={async () => {
            try {
              const r = await adminPost<{ scanned: number; hidden: number }>('/comments/moderate', {});
              setNotice(`已校验 ${r.scanned} 条，隐藏 ${r.hidden} 条`);
              await load();
            } catch (e) { setNotice(e instanceof Error ? e.message : '校验失败'); }
          }}
          className="rounded-control border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-primary hover:text-primary"
        >
          立即校验违规评论
        </button>
        <span className="text-xs text-ink-soft">共 {comments.length} 条</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink-soft">
          <Loader2 size={16} className="animate-spin" /> 加载中…
        </div>
      ) : visibleRoots.length === 0 ? (
        <div className="rounded-card border border-line bg-surface py-20 text-center text-sm text-ink-soft">
          <MessageSquare size={24} className="mx-auto mb-3 text-line-strong" />
          没有符合条件的评论
        </div>
      ) : (
        <div className="space-y-3">
          {visibleRoots.map((c) => (
            <div key={c.id} className="rounded-card border border-line bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium text-ink">{c.authorName}</span>
                <span className="text-xs text-ink-soft">{c.authorEmail}</span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs', statusMeta[c.status].cls)}>
                  {statusMeta[c.status].label}
                </span>
                <span className="ml-auto text-xs text-ink-soft">
                  {targetLabel[c.targetType] ?? c.targetType} #{c.targetId} · {formatDate(c.createdAt)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{c.content}</p>

              {/* 作者回复（楼中楼） */}
              {repliesOf(c.id).length > 0 && (
                <div className="mt-4 space-y-2 border-l-2 border-primary-soft pl-4">
                  {repliesOf(c.id).map((r) => (
                    <div key={r.id} className="text-sm">
                      <span className="font-medium text-primary">{r.authorName}</span>
                      <span className="ml-2 rounded-control bg-primary-soft px-1.5 py-0.5 text-[10px] text-primary">作者回复</span>
                      <span className="ml-2 text-xs text-ink-soft">{formatDate(r.createdAt)}</span>
                      <p className="mt-1 whitespace-pre-line text-ink-soft">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {replyTo === c.id && (
                <div className="mt-4 rounded-control border border-line bg-canvas p-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`以「${authorName}」身份回复 ${c.authorName}…`}
                    rows={3}
                    autoFocus
                    className="w-full resize-y rounded-control border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => { setReplyTo(null); setReplyText(''); }}
                      className="inline-flex items-center gap-1 rounded-control border border-line px-3 py-1.5 text-xs text-ink-soft"
                    >
                      <X size={13} /> 取消
                    </button>
                    <button
                      onClick={() => void sendReply(c)}
                      disabled={busyId === c.id || !replyText.trim()}
                      className="inline-flex items-center gap-1 rounded-control bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-hover disabled:opacity-50"
                    >
                      <Send size={13} /> 发送回复
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => { setReplyTo(c.id); setReplyText(''); }}
                  className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-primary hover:text-primary"
                >
                  <Reply size={14} /> 回复
                </button>
                {(c.status === 'pending' || c.status === 'hidden') && (
                  <button
                    onClick={() => review(c.id, 'approved')}
                    disabled={busyId === c.id}
                    className="inline-flex items-center gap-1.5 rounded-control bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-hover disabled:opacity-50"
                  >
                    <Check size={14} /> 通过 / 恢复
                  </button>
                )}
                {c.status !== 'spam' && (
                  <button
                    onClick={() => review(c.id, 'spam')}
                    disabled={busyId === c.id}
                    className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-accent hover:text-accent disabled:opacity-50"
                  >
                    <Ban size={14} /> 标为垃圾
                  </button>
                )}
                <button
                  onClick={() => remove(c.id)}
                  className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-ink-soft hover:bg-accent-soft hover:text-accent"
                >
                  <Trash2 size={14} /> 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
