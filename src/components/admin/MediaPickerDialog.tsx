'use client';

import { useEffect, useState } from 'react';
import { Check, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { cn } from '@/lib/utils';
import { IS_REMOTE_API, listMedia, type UploadCategory } from '@/lib/client-api';

/** Mock 模式展示前端自带静态资源（属于前端代码库；真实模式全部来自数据库媒体库） */
const BUILTIN = [
  { id: 'builtin-1', url: '/images/post-fsm.svg', name: '技术文章封面 · 状态机' },
  { id: 'builtin-2', url: '/images/post-design-system.svg', name: '技术文章封面 · 设计系统' },
  { id: 'builtin-3', url: '/images/moment-rosemary.svg', name: '生活配图 · 迷迭香' },
  { id: 'builtin-4', url: '/images/moment-soup.svg', name: '生活配图 · 菌菇汤' },
  { id: 'builtin-5', url: '/images/avatar.svg', name: '作者头像' },
  { id: 'builtin-6', url: '/images/link-cloud.svg', name: '友链图标 · 云游僧' },
  { id: 'builtin-7', url: '/images/link-poolsuite.svg', name: '娱乐图标 · Poolsuite FM' },
  { id: 'builtin-8', url: '/images/placeholder.svg', name: '通用占位图' },
];

const FILTERS: { value: UploadCategory | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'cover', label: '封面' },
  { value: 'content', label: '正文' },
  { value: 'avatar', label: '头像' },
  { value: 'logo', label: '图标' },
  { value: 'gallery', label: '生活' },
  { value: 'other', label: '其他' },
];

type Item = { id: string; url: string; name: string };

/**
 * 媒体库选择器：从已上传资源中挑选，复用同一份二进制，避免重复上传。
 * 单图与多图共用；真实后端走 listMedia，mock 模式回退到前端内置图。
 */
export function MediaPickerDialog({
  open,
  onClose,
  onSelect,
  category = 'other',
  multiple = false,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  category?: UploadCategory;
  multiple?: boolean;
}) {
  const [filter, setFilter] = useState<UploadCategory | ''>(category);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setFilter(category);
    setSelected([]);
    setError('');
  }, [open, category]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setError('');
    if (!IS_REMOTE_API) {
      setItems(BUILTIN);
      setLoading(false);
      return () => { alive = false; };
    }
    listMedia(filter || undefined)
      .then((rows) => {
        if (alive) setItems(rows.map((r) => ({ id: r.id, url: r.url, name: `${r.category} · ${r.fileName}` })));
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : '加载媒体库失败');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open, filter]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function toggle(item: Item) {
    setSelected((prev) =>
      multiple
        ? prev.includes(item.url) ? prev.filter((u) => u !== item.url) : [...prev, item.url]
        : prev.includes(item.url) ? [] : [item.url],
    );
  }

  function confirm() {
    if (selected.length === 0) return;
    onSelect(selected);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="从媒体库选择图片"
        className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-ink">从媒体库选择</h2>
            <p className="mt-0.5 text-xs text-ink-soft">复用已上传资源，避免重复上传相同图片</p>
          </div>
          <button onClick={onClose} className="rounded-control p-1.5 text-ink-soft hover:bg-canvas" aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                filter === f.value
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-canvas text-ink-soft hover:border-primary hover:text-primary',
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-ink-soft">已选 {selected.length} 张</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> 加载中…
            </div>
          ) : error ? (
            <p className="py-20 text-center text-sm text-accent">{error}</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-sm text-ink-soft">
              <ImageIcon size={24} /> 媒体库中暂无图片，请先在媒体库上传
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const active = selected.includes(item.url);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item)}
                    className={cn(
                      'relative overflow-hidden rounded-control border-2 bg-canvas text-left transition-colors',
                      active ? 'border-primary' : 'border-line hover:border-primary-soft',
                    )}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-canvas">
                      <SmartImage src={item.url} alt={item.name} fill className="object-cover" sizes="180px" />
                    </div>
                    <div className="truncate px-2 py-1.5 text-[11px] text-ink-soft" title={item.name}>{item.name}</div>
                    {active && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button onClick={onClose} className="rounded-control border border-line px-4 py-1.5 text-xs text-ink-soft hover:border-primary hover:text-primary">
            取消
          </button>
          <button
            onClick={confirm}
            disabled={selected.length === 0}
            className="rounded-control bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            确定使用{selected.length > 1 ? `（${selected.length}）` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
