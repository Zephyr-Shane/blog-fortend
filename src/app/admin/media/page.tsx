'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Check, Image as ImageIcon, Info, Trash2, Upload, Loader2 } from 'lucide-react';
import { listMedia, deleteMedia, uploadFile, getMediaReferences, IS_REMOTE_API, type UploadedFile, type UploadCategory, type MediaReference } from '@/lib/client-api';
import { cn } from '@/lib/utils';

// Mock 阶段展示项目内置的本地 SVG 占位图（属于前端静态资源，不由后端存储）
const BUILTIN = [
  { path: '/images/post-fsm.svg', name: '技术文章封面 · 状态机' },
  { path: '/images/post-design-system.svg', name: '技术文章封面 · 设计系统' },
  { path: '/images/moment-rosemary.svg', name: '生活配图 · 迷迭香' },
  { path: '/images/moment-soup.svg', name: '生活配图 · 菌菇汤' },
  { path: '/images/avatar.svg', name: '作者头像' },
  { path: '/images/link-cloud.svg', name: '友链图标 · 云游僧' },
  { path: '/images/link-poolsuite.svg', name: '娱乐图标 · Poolsuite FM' },
  { path: '/images/placeholder.svg', name: '通用占位图' },
];

const CATEGORIES: { value: UploadCategory | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'cover', label: '文章封面' },
  { value: 'content', label: '正文配图' },
  { value: 'avatar', label: '头像' },
  { value: 'logo', label: '站点图标' },
  { value: 'gallery', label: '生活多图' },
  { value: 'other', label: '其他' },
];

export default function AdminMediaPage() {
  const [items, setItems] = useState<UploadedFile[]>([]);
  const [category, setCategory] = useState<UploadCategory | ''>('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');
  const [refsDialog, setRefsDialog] = useState<{ id: string; name: string; refs: MediaReference[] } | null>(null);
  const [checkingRefs, setCheckingRefs] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!IS_REMOTE_API) return;
    setLoading(true);
    setError('');
    try {
      setItems(await listMedia(category || undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { void load(); }, [load]);

  async function copy(path: string) {
    await navigator.clipboard.writeText(path);
    setCopied(path);
    setTimeout(() => setCopied(''), 1500);
  }

  async function onUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await uploadFile(file, (category || 'other') as UploadCategory);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  /** 删除前先按资源唯一 ID 查询引用，避免误删导致前台图片失效 */
  async function askRemove(item: { id: string; name: string }) {
    setError('');
    setCheckingRefs(true);
    try {
      const refs = await getMediaReferences(item.id);
      if (refs.length > 0) {
        setRefsDialog({ id: item.id, name: item.name, refs });
        return;
      }
      if (window.confirm(`确定删除「${item.name}」吗？`)) await remove(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : '引用检查失败');
    } finally {
      setCheckingRefs(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteMedia(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  }

  const display = IS_REMOTE_API
    ? items.map((m) => ({ path: m.url, name: `${m.category} · ${m.fileName}`, id: m.id }))
    : BUILTIN.map((m) => ({ path: m.path, name: m.name, id: '' }));

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs tracking-wider text-ink-soft">Console / 媒体库</div>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">媒体库</h1>
        <p className="mt-1 text-sm text-ink-soft">管理文章中可引用的图片资源</p>
      </div>

      {!IS_REMOTE_API ? (
        <div className="mb-6 flex items-start gap-3 rounded-card border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          <Info size={17} className="mt-0.5 shrink-0 text-primary" />
          <span>当前为 Mock 阶段，展示项目内置的本地 SVG 占位图；上传功能在连接后端后启用。</span>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              onClick={() => setCategory(c.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition-colors',
                category === c.value
                  ? 'border-primary bg-primary text-white'
                  : 'border-line bg-surface text-ink-soft hover:border-primary hover:text-primary',
              )}
            >
              {c.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { void onUpload(e.target.files?.[0]); }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-control bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              上传图片
            </button>
          </div>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-accent">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {display.map((m) => (
          <div key={m.path} className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <div className="flex aspect-video items-center justify-center border-b border-line bg-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.path} alt={m.name} className="h-full w-full object-contain" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{m.name}</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-ink-soft">{m.path}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => void copy(m.path)} className="rounded p-1.5 text-ink-soft hover:bg-primary-soft hover:text-primary" title="复制路径">
                    {copied === m.path ? <Check size={15} className="text-primary" /> : <Copy size={15} />}
                  </button>
                  {IS_REMOTE_API && (
                    <button onClick={() => void askRemove(m)} disabled={checkingRefs} className="rounded p-1.5 text-ink-soft hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="删除">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && display.length === 0 && IS_REMOTE_API && (
        <p className="mt-6 text-sm text-ink-soft">该分类下暂无资源，点击右上角上传。</p>
      )}

      <div className="mt-8 flex items-center gap-2 text-xs text-ink-soft">
        <ImageIcon size={14} /> 共 {display.length} 个资源
      </div>

      {refsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={() => setRefsDialog(null)}>
          <div
            className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-card"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-lg font-semibold text-ink">无法删除该图片</h2>
            <p className="mt-2 text-sm text-ink-soft">
              「{refsDialog.name}」仍被以下 {refsDialog.refs.length} 处内容引用。请先修改对应内容，再删除资源。
            </p>
            <ul className="mt-4 max-h-60 space-y-2 overflow-y-auto rounded-control border border-line bg-canvas p-3 text-sm">
              {refsDialog.refs.map((r, i) => (
                <li key={`${r.type}-${i}`} className="flex items-center justify-between gap-3">
                  <span className="truncate text-ink">{r.name}</span>
                  <span className="shrink-0 text-xs text-ink-soft">{r.type} · {r.field}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setRefsDialog(null)}
                className="rounded-control bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
