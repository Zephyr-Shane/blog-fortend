'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Heart, MessageCircle, CheckCheck, Loader2, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import type { Notification } from '@/types/api';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/client-api';

const typeMeta: Record<string, { label: string; icon: typeof Bell; cls: string }> = {
  comment: { label: '评论', icon: MessageCircle, cls: 'bg-primary-soft text-primary' },
  like: { label: '点赞', icon: Heart, cls: 'bg-accent-soft text-accent' },
  system: { label: '系统', icon: Bell, cls: 'bg-canvas text-ink-soft' },
};

type StatusFilter = 'all' | 'unread' | 'read';
const PAGE_SIZE = 20;

export default function AdminNotificationsPage() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getNotifications(page, PAGE_SIZE, status)
      .then((d) => {
        setItems(d.list ?? []);
        setTotal(d.total ?? 0);
        setUnread(d.unread ?? 0);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getUnreadCount().then((d) => setUnread(d.unread ?? 0)).catch(() => undefined);
  }, [load]);

  async function markRead(id: string) {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
      setUnread((n) => Math.max(0, n - 1));
      setNotice('已标记为已读');
    } catch { setNotice('标记失败'); }
  }

  async function markAll() {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
      setNotice('已全部标记为已读');
    } catch { setNotice('操作失败'); }
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const metaOf = (t: string) => typeMeta[t] ?? typeMeta.system;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs tracking-wider text-ink-soft">Console / 通知记录</div>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">通知记录</h1>
          <p className="mt-1 text-sm text-ink-soft">
            保存全部互动通知（含已读），共 {total} 条{unread > 0 ? ` · 未读 ${unread}` : ''}
          </p>
        </div>
        <button
          onClick={() => void markAll()}
          disabled={unread === 0}
          className="inline-flex items-center gap-2 rounded-control border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck size={15} /> 全部标为已读
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {([['all', '全部'], ['unread', '未读'], ['read', '已读']] as [StatusFilter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setStatus(key); setPage(1); }}
            className={cn(
              'rounded-control border px-3.5 py-1.5 text-sm transition-colors',
              status === key
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-surface text-ink-soft hover:border-primary hover:text-primary',
            )}
          >
            {label}
          </button>
        ))}
        {notice && <span className="ml-2 text-xs text-primary">{notice}</span>}
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> 加载通知…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-sm text-ink-soft">
            <Inbox size={28} strokeWidth={1.4} />
            暂无{status === 'unread' ? '未读' : status === 'read' ? '已读' : ''}通知
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((n) => {
              const meta = metaOf(n.type);
              const Icon = meta.icon;
              return (
                <li key={n.id} className={cn('flex flex-wrap items-start gap-3 px-5 py-4', !n.read && 'bg-primary-soft/20')}>
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-control', meta.cls)}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-ink">{n.title}</span>
                      <span className="rounded-control bg-canvas px-1.5 py-0.5 text-[11px] text-ink-soft">{meta.label}</span>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-accent" title="未读" />}
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{n.content}</p>
                    <p className="mt-1 text-[11px] text-ink-soft">
                      {formatDate(n.createdAt)}
                      {n.targetType && n.targetId ? ` · 目标 ${n.targetType} #${n.targetId}` : ''}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => void markRead(n.id)}
                      className="rounded-control border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-primary hover:text-primary"
                    >
                      标为已读
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-ink-soft">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-control border border-line px-3 py-1.5 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> 上一页
          </button>
          <span>第 {page} / {pages} 页</span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="inline-flex items-center gap-1 rounded-control border border-line px-3 py-1.5 disabled:opacity-40"
          >
            下一页 <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
