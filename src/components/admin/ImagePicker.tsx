'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Images, Link2, Loader2, X } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { MediaPickerDialog } from '@/components/admin/MediaPickerDialog';
import { cn } from '@/lib/utils';
import { IS_REMOTE_API, uploadFile, type UploadCategory } from '@/lib/client-api';

/** 把本地文件转成可用 URL：真实后端上传落库，mock 模式退化为 dataURL */
async function fileToUrl(file: File, category: UploadCategory): Promise<string> {
  if (IS_REMOTE_API) {
    const uploaded = await uploadFile(file, category);
    return uploaded.url;
  }
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取失败'));
    reader.readAsDataURL(file);
  });
}

// 多图选择器：逐张上传/预览、可移除、可填在线链接。
// 真实后端按 category 落库；mock 模式用 dataURL 内嵌。
export function MultiImagePicker({
  value,
  onChange,
  category = 'gallery',
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  category?: UploadCategory;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const added = await Promise.all(images.map((f) => fileToUrl(f, category)));
      onChange([...value, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-20 w-28 overflow-hidden rounded-control border border-line bg-canvas">
            <SmartImage src={src} alt={`图片 ${i + 1}`} fill className="object-cover" sizes="112px" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 rounded-full bg-surface p-0.5 text-ink-soft shadow-sm hover:text-accent"
              aria-label="移除图片"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
          {busy ? '上传中…' : '添加本地图片'}
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <Images size={13} /> 从媒体库选择
        </button>
        <input
          value={value.join('\n')}
          onChange={(e) => onChange(e.target.value.split('\n').filter(Boolean))}
          placeholder="或每行填一个图片链接"
          className="flex-1 rounded-control border border-line bg-canvas px-3 py-1.5 text-xs outline-none focus:border-primary"
        />
      </div>
      {error && <p className="text-xs text-accent">{error}</p>}
      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        category={category}
        multiple
        onSelect={(urls) => onChange([...value, ...urls.filter((u) => !value.includes(u))])}
      />
    </div>
  );
}

// 统一图片选择器：填在线链接 或 选择本地图片（按 category 上传落库）。
export function ImagePicker({
  value,
  onChange,
  placeholder = 'https://... 或 /images/xxx.svg',
  label = '选择图片',
  category = 'other',
}: {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  label?: string;
  category?: UploadCategory;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  async function pickFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    setBusy(true);
    setError('');
    try {
      onChange(await fileToUrl(file, category));
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={value.startsWith('data:') ? '（本地图片）' : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-control border border-line bg-canvas py-2 pl-8 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pickFile(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {busy ? '上传中' : label}
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-2 text-xs text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <Images size={14} /> 媒体库
        </button>
      </div>
      {error && <p className="text-xs text-accent">{error}</p>}
      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        category={category}
        onSelect={(urls) => onChange(urls[0])}
      />
      {value && (
        <div className="relative h-28 overflow-hidden rounded-control border border-line bg-canvas">
          <SmartImage src={value} alt="预览" fill className="object-contain" sizes="240px" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-1.5 top-1.5 rounded-full bg-surface p-1 text-ink-soft shadow-sm hover:text-accent"
            title="移除图片"
          >
            <X size={13} />
          </button>
        </div>
      )}
      <p className={cn('text-[11px] text-ink-soft')}>
        {IS_REMOTE_API
          ? '本地图片上传后存入数据库；也可直接从媒体库复用已有图片，避免重复上传。'
          : 'Mock 模式：本地图片以 dataURL 内嵌保存；也可从内置图库选择。'}
      </p>
    </div>
  );
}
