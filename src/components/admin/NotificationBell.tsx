'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Heart, MessageCircle, CheckCheck, Loader2 } from 'lucide-react';
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

export function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const refreshUnread = useCallback(() => {
    getUnreadCount()
      .then((d) => setUnread(d.unread ?? 0))
      .catch(() => undefined);
  }, []);

  const loadList = useCallback(() => {
    setLoading(true);
    getNotifications(1, 10, 'unread')
      .then((d) => setItems(d.list ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshUnread();
    // 一期：定时轮询未读数（30s），实时推送留待二期
    const timer = window.setInterval(refreshUnread, 30000);
    return () => window.clearInterval(timer);
  }, [refreshUnread]);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  }

  async function openNotification(n: Notification) {
    if (!n.read) {
      try {
        await markNotificationRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        refreshUnread();
      } catch { /* 忽略 */ }
    }
    setOpen(false);
    // 互动类通知统一跳到评论管理，作者可在此查看/回复/跳转内容
    router.push('/admin/comments');
  }

  async function markAll() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch { /* 忽略 */ } finally { setMarkingAll(false); }
  }

  const metaOf = (t: string) => typeMeta[t] ?? typeMeta.system;

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={toggleOpen}
        className="relative rounded-control p-2 text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
        aria-label="通知"
        aria-expanded={open}
      >
        <Bell size={18} strokeWidth={1.7} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium leading-none text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-card border border-line bg-surface shadow-card-hover">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-medium text-ink">通知</span>
            <button
              onClick={() => void markAll()}
              disabled={markingAll || unread === 0}
              className="inline-flex items-center gap-1 text-xs text-ink-soft transition-colors hover:text-primary disabled:opacity-40"
            >
              {markingAll ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
              全部已读
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-ink-soft">
                <Loader2 size={14} className="animate-spin" /> 加载中…
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-xs text-ink-soft">暂无通知</div>
            ) : (
              items.map((n) => {
                const meta = metaOf(n.type);
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => void openNotification(n)}
                    className={cn(
                      'flex w-full gap-3 border-b border-line/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-canvas',
                      !n.read && 'bg-primary-soft/30',
                    )}
                  >
                    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-control', meta.cls)}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-soft">{n.content}</span>
                      <span className="mt-1 block text-[11px] text-ink-soft">{formatDate(n.createdAt)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-2.5 text-center text-xs text-primary transition-colors hover:bg-canvas"
          >
            查看全部通知记录
          </Link>
        </div>
      )}
    </div>
  );
}
