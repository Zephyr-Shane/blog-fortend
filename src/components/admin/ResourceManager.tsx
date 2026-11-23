'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Pencil,
  Trash2,
  Search,
  Plus,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Eye,
  FileEdit,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImagePicker, MultiImagePicker } from '@/components/admin/ImagePicker';
import { adminGet, adminPost, adminPut, adminDelete, type UploadCategory } from '@/lib/client-api';
import type { ResourceType, Status, Tag } from '@/types/api';

export type Row = { id: number; status?: Status; [key: string]: unknown };

export type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'checkbox' | 'tags' | 'image' | 'images';

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  help?: string;
  defaultValue?: unknown;
  wide?: boolean;
  /** tags 类型专用：只显示该分类的标签（一般配合通用标签一起展示） */
  tagCategory?: string;
  /** image/images 类型专用：上传形式，决定资源落库分类 */
  category?: UploadCategory;
}

export interface ColumnConfig {
  key: string;
  label: string;
  render?: (row: Row) => React.ReactNode;
}

interface ResourceManagerProps {
  resource: ResourceType;
  title: string;
  description: string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  searchKeys?: string[];
  pageSize?: number;
  /** 新建跳到独立编辑页（如文章），否则用弹窗表单 */
  createHref?: string;
  /** 编辑跳到独立编辑页（如文章），否则用弹窗表单 */
  editHref?: (row: Row) => string;
  /** 列表行的额外操作 */
  extraActions?: (row: Row) => React.ReactNode;
  /** 列表固定过滤条件，如娱乐/友链共用 link 资源时按 category 区分 */
  fixedFilter?: (row: Row) => boolean;
  /** 新建时补齐的默认值，满足 API 契约完整性 */
  defaults?: Record<string, unknown>;
  /** 列表加载完成后回调 */
  onLoaded?: (rows: Row[]) => void;
}

const inputCls =
  'w-full rounded-control border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-primary';

export function ResourceManager({
  resource,
  title,
  description,
  columns,
  fields,
  searchKeys = ['title', 'name', 'content'],
  pageSize = 10,
  createHref,
  editHref,
  extraActions,
  fixedFilter,
  defaults = {},
  onLoaded,
}: ResourceManagerProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [version, setVersion] = useState(0);
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await adminGet<Row[]>(`/${resource}`);
      setRows(rows ?? []);
      onLoadedRef.current?.(rows ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [resource, version]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    adminGet<Tag[]>('/tag')
      .then((list) => setTagOptions(list ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [keyword, statusFilter]);

  const hasStatus = rows.some((r) => r.status !== undefined);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (fixedFilter && !fixedFilter(row)) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!q) return true;
      return searchKeys.some((key) => {
        const v = row[key];
        return typeof v === 'string' && v.toLowerCase().includes(q);
      });
    });
  }, [rows, keyword, statusFilter, searchKeys, fixedFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  function openCreate() {
    const initial: Record<string, unknown> = { ...defaults };
    fields.forEach((f) => {
      if (initial[f.key] === undefined) {
        initial[f.key] = f.defaultValue ?? (f.type === 'checkbox' ? false : f.type === 'tags' || f.type === 'images' ? [] : '');
      }
    });
    setForm(initial);
    setFormError('');
    setEditing('new');
  }

  function openEdit(row: Row) {
    if (editHref) {
      window.location.href = editHref(row);
      return;
    }
    const initial: Record<string, unknown> = {};
    fields.forEach((f) => {
      const v = row[f.key];
      if (f.type === 'tags') initial[f.key] = (v as Tag[] | undefined)?.map((t) => t.id) ?? [];
      else if (f.type === 'images') initial[f.key] = Array.isArray(v) ? [...v] : [];
      else initial[f.key] = v ?? '';
    });
    setForm(initial);
    setFormError('');
    setEditing(row);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;

    for (const f of fields) {
      if (f.required && (form[f.key] === '' || form[f.key] === undefined || form[f.key] === null)) {
        setFormError(`请填写「${f.label}」`);
        return;
      }
    }

    const payload: Record<string, unknown> = { ...form };
    fields.forEach((f) => {
      if (f.type === 'number') payload[f.key] = Number(form[f.key]) || 0;
      if (f.type === 'tags') {
        payload[f.key] = (form[f.key] as number[]).map((id) => tagOptions.find((t) => t.id === id)).filter(Boolean);
      }
      if (f.type === 'images') {
        payload[f.key] = (form[f.key] as string[]).map((s) => String(s).trim()).filter(Boolean);
      }
    });

    setSaving(true);
    setFormError('');
    try {
      const isNew = editing === 'new';
      const url = isNew ? `/${resource}` : `/${resource}/${editing.id}`;
      if (isNew) await adminPost(url, payload);
      else await adminPut(url, payload);
      setEditing(null);
      setVersion((v) => v + 1);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`确定删除「${String(row.title ?? row.name ?? row.content ?? row.id).slice(0, 30)}」吗？此操作不可撤销。`)) return;
    try {
      await adminDelete(`/${resource}/${row.id}`);
      setVersion((v) => v + 1);
    } catch { /* 删除失败保持原状 */ }
  }

  async function toggleStatus(row: Row) {
    const next: Status = row.status === 'published' ? 'draft' : 'published';
    try {
      await adminPut(`/${resource}/${row.id}`, {
        status: next,
        publishedAt: next === 'published' ? new Date().toISOString() : null,
      });
      setVersion((v) => v + 1);
    } catch { /* 切换失败保持原状 */ }
  }

  function renderCell(row: Row, col: ColumnConfig) {
    if (col.render) return col.render(row);
    const v = row[col.key];
    if (v === null || v === undefined || v === '') return <span className="text-ink-soft">—</span>;
    if (typeof v === 'boolean') return v ? '是' : '否';
    if (Array.isArray(v)) {
      return v.map((x) => (typeof x === 'object' && x !== null ? (x as { name?: string }).name ?? '' : String(x))).join('、');
    }
    return String(v);
  }

  function renderField(f: FieldConfig) {
    const value = form[f.key];
    const setValue = (v: unknown) => setForm((prev) => ({ ...prev, [f.key]: v }));
    return (
      <div key={f.key} className={cn(f.wide && 'sm:col-span-2')}>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          {f.label}
          {f.required && <span className="ml-1 text-accent">*</span>}
        </label>
        {f.type === 'textarea' ? (
          <textarea
            value={String(value ?? '')}
            onChange={(e) => setValue(e.target.value)}
            placeholder={f.placeholder}
            rows={3}
            className={inputCls}
          />
        ) : f.type === 'select' ? (
          <select value={String(value ?? '')} onChange={(e) => setValue(e.target.value)} className={inputCls}>
            <option value="">请选择</option>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : f.type === 'checkbox' ? (
          <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={Boolean(value)} onChange={(e) => setValue(e.target.checked)} className="h-4 w-4 accent-[#2E6B5B]" />
            {f.placeholder || '启用'}
          </label>
        ) : f.type === 'tags' ? (
          <div className="flex flex-wrap gap-2 rounded-control border border-line bg-canvas p-3">
            {(() => {
              const visible = f.tagCategory
                ? tagOptions.filter((t) => t.category === f.tagCategory || t.category === 'general')
                : tagOptions;
              if (visible.length === 0) return <span className="text-xs text-ink-soft">暂无可用标签，请先到标签管理创建</span>;
              return visible.map((t) => {
                const checked = (value as number[]).includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setValue(checked ? (value as number[]).filter((id) => id !== t.id) : [...(value as number[]), t.id])}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors',
                      checked ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink-soft hover:border-primary',
                    )}
                  >
                    {t.name}
                  </button>
                );
              });
            })()}
          </div>
        ) : f.type === 'image' ? (
          <ImagePicker value={String(value ?? '')} onChange={setValue} placeholder={f.placeholder} category={f.category ?? 'other'} />
        ) : f.type === 'images' ? (
          <MultiImagePicker value={(value as string[]) ?? []} onChange={setValue} category={f.category ?? 'gallery'} />
        ) : (
          <input
            type={f.type === 'number' ? 'number' : 'text'}
            value={String(value ?? '')}
            onChange={(e) => setValue(e.target.value)}
            placeholder={f.placeholder}
            className={inputCls}
          />
        )}
        {f.help && <p className="mt-1 text-xs text-ink-soft">{f.help}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs tracking-wider text-ink-soft">Console / {title}</div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">{title}</h1>
            <p className="mt-1 text-sm text-ink-soft">{description}</p>
          </div>
          {createHref ? (
            <Link href={createHref} className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
              <Plus size={16} /> 新建
            </Link>
          ) : (
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
              <Plus size={16} /> 新建
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索…"
            className="w-full rounded-control border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>
        {hasStatus && (
          <div className="flex gap-1 rounded-control border border-line bg-surface p-1">
            {(['all', 'published', 'draft'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded px-3 py-1 text-xs transition-colors',
                  statusFilter === s ? 'bg-primary-soft font-medium text-primary' : 'text-ink-soft hover:text-ink',
                )}
              >
                {s === 'all' ? '全部' : s === 'published' ? '已发布' : '草稿'}
              </button>
            ))}
          </div>
        )}
        <span className="ml-auto text-xs text-ink-soft">共 {filtered.length} 条</span>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> 加载中…
          </div>
        ) : current.length === 0 ? (
          <div className="py-20 text-center text-sm text-ink-soft">暂无内容，点击右上角新建。</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs text-ink-soft">
              <tr>
                {columns.map((c) => <th key={c.key} className="px-5 py-3 font-medium">{c.label}</th>)}
                {hasStatus && <th className="px-5 py-3 font-medium">状态</th>}
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {current.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-canvas/60">
                  {columns.map((c) => (
                    <td key={c.key} className="max-w-xs px-5 py-3.5 align-middle text-ink">
                      <div className="line-clamp-2">{renderCell(row, c)}</div>
                    </td>
                  ))}
                  {hasStatus && (
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleStatus(row)}
                        title="点击切换发布状态"
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1 text-xs font-medium transition-all hover:-translate-y-px hover:shadow-sm',
                          row.status === 'published'
                            ? 'border-primary/30 bg-primary-soft text-primary hover:bg-primary hover:text-white'
                            : 'border-accent/30 bg-accent-soft text-accent hover:bg-accent hover:text-white',
                        )}
                      >
                        {row.status === 'published' ? <Eye size={13} /> : <FileEdit size={13} />}
                        {row.status === 'published' ? '已发布' : '草稿'}
                        <RefreshCw size={11} className="opacity-50" />
                      </button>
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      {extraActions?.(row)}
                      <button onClick={() => openEdit(row)} className="rounded p-1.5 text-ink-soft hover:bg-primary-soft hover:text-primary" title="编辑">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(row)} className="rounded p-1.5 text-ink-soft hover:bg-accent-soft hover:text-accent" title="删除">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-control border border-line bg-surface p-1.5 text-ink-soft disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-ink-soft">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-control border border-line bg-surface p-1.5 text-ink-soft disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-6" onClick={() => setEditing(null)}>
          <div className="my-auto w-full max-w-2xl rounded-card border border-line bg-surface shadow-float" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-serif text-lg font-semibold text-ink">{editing === 'new' ? '新建' : '编辑'}</h2>
              <button onClick={() => setEditing(null)} className="rounded p-1.5 text-ink-soft hover:bg-canvas">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save}>
              <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
                {fields.map(renderField)}
              </div>
              {formError && <p className="px-6 pb-3 text-sm text-accent">{formError}</p>}
              <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
                <button type="button" onClick={() => setEditing(null)} className="rounded-control border border-line px-4 py-2 text-sm text-ink-soft hover:text-ink">
                  取消
                </button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-control bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
