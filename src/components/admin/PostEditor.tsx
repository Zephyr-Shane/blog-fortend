'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
  ArrowLeft,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  Code2,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Minus,
  Loader2,
  Eye,
  Save,
  Sparkles,
  ImagePlus,
  FileCode2,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { markdownToHtml, looksLikeMarkdown } from '@/lib/markdown';
import { adminGet, adminPost, adminPut, clientGet } from '@/lib/client-api';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { useDirty } from '@/components/admin/DirtySave';
import type { Post, Status, Tag, CoAuthor } from '@/types/api';

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tagIds: number[];
  allowComments: boolean;
  status: Status;
  publishedAt: string | null;
};

const emptyForm: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  coverImage: '',
  category: 'tech',
  tagIds: [],
  allowComments: true,
  status: 'draft',
  publishedAt: null,
};

/** 图片扩展：增加 width 属性，让插入后的图片可调整显示尺寸 */
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      displayWidth: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.width || element.getAttribute('data-width') || null,
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.displayWidth
            ? { 'data-width': String(attributes.displayWidth), style: `width:${attributes.displayWidth};height:auto;max-width:100%;` }
            : { style: 'max-width:100%;height:auto;' },
      },
    };
  },
});

const fieldCls =
  'w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary';

function ToolButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'shrink-0 rounded p-1.5 transition-colors',
        active ? 'bg-primary-soft text-primary' : 'text-ink-soft hover:bg-canvas hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

/**
 * 编辑器工具栏：桌面端以竖排形式常驻在正文左侧，窄屏以横排形式固定在编辑区顶部。
 * 两种形态共用同一套按钮，避免出现两处维护。
 */
function EditorToolbar({
  editor,
  vertical,
  onImage,
  onMarkdown,
  className,
}: {
  editor: Editor | null;
  vertical?: boolean;
  onImage: () => void;
  onMarkdown: () => void;
  className?: string;
}) {
  const sep = vertical ? (
    <span className="my-1 h-px w-6 shrink-0 bg-line" />
  ) : (
    <span className="mx-1 h-5 w-px shrink-0 bg-line" />
  );

  return (
    <div
      className={cn(
        // display 交给调用方控制（桌面 hidden/sm:flex），避免与内部 flex 争抢同一属性
        'items-center gap-0.5',
        vertical ? 'flex-col py-3' : 'flex-row overflow-x-auto px-2 py-1.5',
        className,
      )}
    >
      <ToolButton title="二级标题" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })}>
        <Heading2 size={17} />
      </ToolButton>
      <ToolButton title="三级标题" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })}>
        <Heading3 size={17} />
      </ToolButton>
      {sep}
      <ToolButton title="粗体" onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>
        <Bold size={16} />
      </ToolButton>
      <ToolButton title="斜体" onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}>
        <Italic size={16} />
      </ToolButton>
      {sep}
      <ToolButton title="引用" onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')}>
        <Quote size={16} />
      </ToolButton>
      <ToolButton title="代码块" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')}>
        <Code2 size={16} />
      </ToolButton>
      <ToolButton title="无序列表" onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')}>
        <List size={16} />
      </ToolButton>
      <ToolButton title="有序列表" onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')}>
        <ListOrdered size={16} />
      </ToolButton>
      <ToolButton title="分割线" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
        <Minus size={16} />
      </ToolButton>
      {sep}
      <ToolButton title="插入配图" onClick={onImage}>
        <ImagePlus size={16} />
      </ToolButton>
      <ToolButton title="粘贴 Markdown 导入" onClick={onMarkdown}>
        <FileCode2 size={16} />
      </ToolButton>
      {sep}
      <ToolButton title="撤销" onClick={() => editor?.chain().focus().undo().run()}>
        <Undo2 size={16} />
      </ToolButton>
      <ToolButton title="重做" onClick={() => editor?.chain().focus().redo().run()}>
        <Redo2 size={16} />
      </ToolButton>
    </div>
  );
}

export function PostEditor({ postId }: { postId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [imageDialog, setImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [signature, setSignature] = useState('');
  const [coEnabled, setCoEnabled] = useState(false);
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);
  const [contentVersion, setContentVersion] = useState(0); // 触发脏状态重算
  const [imageSelected, setImageSelected] = useState(false);
  const [imageWidth, setImageWidth] = useState('60%');
  const [markdownDialog, setMarkdownDialog] = useState(false);
  const [markdownText, setMarkdownText] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false); // 窄屏设置抽屉
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, ResizableImage.configure({ inline: false, allowBase64: true })],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'article-body min-h-[420px] outline-none' },
      // 从本地 Markdown 编辑器复制过来时，自动识别常见语法并转成富文本
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData('text/plain') ?? '';
        if (!looksLikeMarkdown(text)) return false;
        event.preventDefault();
        editorRef.current?.chain().focus().insertContent(markdownToHtml(text)).run();
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      setWordCount(editor.getText().length);
      setContentVersion((v) => v + 1);
    },
  });

  // 选中图片时显示尺寸调整条
  useEffect(() => {
    editorRef.current = editor;
    if (!editor) return;
    const sync = () => setImageSelected(editor.isActive('image'));
    editor.on('selectionUpdate', sync);
    editor.on('transaction', sync);
    return () => {
      editor.off('selectionUpdate', sync);
      editor.off('transaction', sync);
    };
  }, [editor]);

  // 脏状态快照：包含所有可编辑字段
  const snapshot = useMemo(() => ({
    ...form,
    content: editor?.getHTML() ?? '',
    coEnabled,
    coAuthors,
    contentVersion, // 依赖此项触发重算
  }), [form, coEnabled, coAuthors, contentVersion, editor]);

  const { isDirty, markClean } = useDirty(snapshot);

  useEffect(() => {
    adminGet<Tag[]>('/tag')
      .then((list) => setTags(list ?? []))
      .catch(() => undefined);

    clientGet<{ articleSignature?: string }>('/site-config')
      .then((cfg) => setSignature(cfg?.articleSignature ?? ''))
      .catch(() => undefined);

    if (postId) {
      adminGet<Post>(`/post/${postId}`)
        .then((p) => {
          setForm({
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt,
            coverImage: p.coverImage ?? '',
            category: p.category,
            tagIds: p.tags?.map((t) => t.id) ?? [],
            allowComments: p.allowComments,
            status: p.status,
            publishedAt: p.publishedAt,
          });
          const authors = p.coAuthors ?? [];
          setCoAuthors(authors);
          setCoEnabled(authors.length > 0);
          editor?.commands.setContent(p.content ?? '');
          setWordCount(p.content?.replace(/<[^>]+>/g, '').length ?? 0);
          setLoading(false);
          // 延迟一帧让 snapshot 同步后再 markClean（editor.getHTML 需要同步完成）
          requestAnimationFrame(() => markClean());
        })
        .catch(() => {
          setError('加载失败');
          setLoading(false);
        });
    } else {
      // 新建文章：初始状态稳定后 markClean
      requestAnimationFrame(() => markClean());
    }
  }, [postId, editor]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function autoSlug() {
    const raw = form.title.trim();
    if (!raw) {
      setError('请先填写标题');
      return;
    }
    const ascii = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    update('slug', ascii || `post-${Date.now().toString(36)}`);
    setError('');
  }

  function openImageDialog() {
    setImageUrl('');
    setImageWidth('60%');
    setImageDialog(true);
  }

  function openMarkdownDialog() {
    setMarkdownText('');
    setMarkdownDialog(true);
  }

  async function save(target: Status) {
    if (!editor) return;
    if (!form.title.trim()) {
      setError('请填写标题');
      return;
    }
    if (!form.slug.trim()) {
      setError('请填写 URL 标识（可点自动生成）');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    const now = new Date().toISOString();
    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: editor.getHTML(),
      coverImage: form.coverImage.trim() || null,
      category: form.category,
      tags: form.tagIds.map((id) => tags.find((t) => t.id === id)).filter(Boolean),
      allowComments: form.allowComments,
      status: target,
      publishedAt: target === 'published' ? form.publishedAt ?? now : null,
      coAuthors: coEnabled ? coAuthors.filter((a) => a.name.trim()) : [],
    };

    try {
      const saved = postId
        ? await adminPut<Post>(`/post/${postId}`, payload)
        : await adminPost<Post>('/post', payload);
      update('status', target);
      update('publishedAt', payload.publishedAt);
      setNotice(target === 'published' ? '已发布，前台可见' : '草稿已保存');
      if (!postId) router.replace(`/admin/posts/${saved.id}`);
      // 保存成功后清除脏标记（延迟一帧让 state 更新同步）
      requestAnimationFrame(() => markClean());
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center gap-2 text-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin" /> 加载文章…
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      {/* 顶栏：只保留返回、文章状态与窄屏设置入口，发布操作固定在右侧栏 */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-5">
        <Link
          href="/admin/posts"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-control px-2 py-1.5 text-xs text-ink-soft transition-colors hover:bg-canvas hover:text-primary"
        >
          <ArrowLeft size={15} /> <span className="hidden sm:inline">文章列表</span>
        </Link>
        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <span className="max-w-[300px] truncate font-serif text-sm font-semibold text-ink">{form.title || '未命名文章'}</span>
          <span className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-[11px] text-ink-soft">
            {form.status === 'published' ? '已发布' : '草稿'}
          </span>
          <span className="shrink-0 text-[11px] text-ink-soft">正文 {wordCount} 字</span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <span className={cn('flex items-center gap-1.5 text-[11px]', isDirty ? 'text-accent' : 'text-ink-soft')}>
            <span className={cn('h-1.5 w-1.5 rounded-full', isDirty ? 'bg-accent' : 'bg-line-strong')} />
            <span className="hidden sm:inline">{isDirty ? '有未保存的修改' : '暂无修改'}</span>
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-primary hover:text-primary xl:hidden"
          >
            <SlidersHorizontal size={14} /> 设置
          </button>
        </div>
      </header>

      {error && (
        <div className="shrink-0 border-b border-line bg-accent-soft px-4 py-2 text-sm text-accent sm:px-6">{error}</div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* 桌面端：竖排工具栏整列常驻，不随正文滚动 */}
        <EditorToolbar
          editor={editor}
          vertical
          onImage={openImageDialog}
          onMarkdown={openMarkdownDialog}
          className="hidden w-12 shrink-0 overflow-y-auto border-r border-line bg-surface px-0.5 sm:flex"
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* 窄屏：横排工具栏固定在编辑区顶部 */}
          <div className="shrink-0 border-b border-line bg-surface sm:hidden">
            <EditorToolbar editor={editor} onImage={openImageDialog} onMarkdown={openMarkdownDialog} className="flex" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[840px] px-4 py-6 sm:px-8 sm:py-10">
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="文章标题"
                className="w-full border-0 bg-transparent font-serif text-2xl font-semibold text-ink outline-none placeholder:text-line-strong sm:text-3xl"
              />

              <div className="mt-5 overflow-hidden rounded-card border border-line bg-surface shadow-card">
                {imageSelected && (
                  <div className="flex flex-wrap items-center gap-2 border-b border-line bg-canvas px-4 py-2 text-xs text-ink-soft">
                    <span className="font-medium text-ink">图片宽度</span>
                    {[
                      { label: '自适应', value: '' },
                      { label: '33%', value: '33%' },
                      { label: '50%', value: '50%' },
                      { label: '60%', value: '60%' },
                      { label: '100%', value: '100%' },
                    ].map((w) => (
                      <button
                        key={w.label}
                        type="button"
                        onClick={() => editor?.chain().focus().updateAttributes('image', { displayWidth: w.value || null }).run()}
                        className="rounded border border-line bg-surface px-2 py-1 transition-colors hover:border-primary hover:text-primary"
                      >
                        {w.label}
                      </button>
                    ))}
                    <span className="ml-auto text-[11px]">点击正文中的图片即可调整</span>
                  </div>
                )}

                <div className="px-5 py-6 sm:px-8">
                  <EditorContent editor={editor} />
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] text-ink-soft">
                正文 {wordCount} 字 · 支持直接从本地 Markdown 编辑器粘贴
              </p>
            </div>
          </div>
        </main>

        {/* 窄屏抽屉遮罩 */}
        {settingsOpen && (
          <div className="fixed inset-0 z-40 bg-black/30 xl:hidden" onClick={() => setSettingsOpen(false)} />
        )}

        {/* 右侧设置栏：大屏常驻独立滚动，底部发布操作固定；窄屏为抽屉 */}
        <aside
          className={cn(
            'flex flex-col border-l border-line bg-canvas',
            'fixed inset-y-0 right-0 z-50 w-[min(92vw,360px)] shadow-float transition-transform duration-200',
            settingsOpen ? 'translate-x-0' : 'translate-x-full',
            'xl:static xl:z-auto xl:w-[320px] xl:shrink-0 xl:translate-x-0 xl:shadow-none xl:transition-none',
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4 xl:hidden">
            <span className="font-serif text-sm font-semibold text-ink">文章设置</span>
            <button
              type="button"
              onClick={() => setSettingsOpen(false)}
              className="rounded p-1 text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
              aria-label="关闭设置"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 xl:p-5">
            <div className="rounded-card border border-line bg-surface p-5 shadow-card">
              <h2 className="mb-4 font-medium text-ink">发布设置</h2>
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-medium text-ink">URL 标识</label>
                    <button onClick={autoSlug} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Sparkles size={12} /> 自动生成
                    </button>
                  </div>
                  <input value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder="fsm-architecture" className={fieldCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">摘要</label>
                  <textarea value={form.excerpt} onChange={(e) => update('excerpt', e.target.value)} rows={4} className={fieldCls} placeholder="一句话介绍这篇文章" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">封面图</label>
                  <ImagePicker value={form.coverImage} onChange={(v) => update('coverImage', v)} placeholder="/images/post-fsm.svg 或在线链接" category="cover" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">分类</label>
                  <select value={form.category} onChange={(e) => update('category', e.target.value)} className={fieldCls}>
                    <option value="tech">技术</option>
                    <option value="life">生活</option>
                    <option value="interview">面试</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-ink-soft">
                  <input type="checkbox" checked={form.allowComments} onChange={(e) => update('allowComments', e.target.checked)} className="h-4 w-4 accent-[#2E6B5B]" />
                  允许评论
                </label>

                <div className="border-t border-line pt-4">
                  <label className="mb-1.5 block text-sm font-medium text-ink">文章署名</label>
                  <input
                    value={signature || '（未配置）'}
                    readOnly
                    disabled
                    className="w-full cursor-not-allowed rounded-control border border-line bg-canvas px-3 py-2 text-sm text-ink-soft opacity-70"
                  />
                  <p className="mt-1 text-[11px] text-ink-soft">全站统一署名，在「自定义配置」中修改</p>
                </div>

                <label className="flex items-center justify-between text-sm text-ink">
                  <span>是否共创</span>
                  <button
                    type="button"
                    onClick={() => setCoEnabled((v) => !v)}
                    className={cn(
                      'relative h-5 w-9 rounded-full transition-colors',
                      coEnabled ? 'bg-primary' : 'bg-line-strong',
                    )}
                    aria-label="切换共创"
                  >
                    <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', coEnabled ? 'left-[18px]' : 'left-0.5')} />
                  </button>
                </label>

                {coEnabled && (
                  <div className="space-y-3 rounded-control border border-line bg-canvas p-3">
                    {coAuthors.map((a, i) => (
                      <div key={i} className="space-y-2 rounded-control border border-line bg-surface p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-ink-soft">共创者 {i + 1}</span>
                          <button type="button" onClick={() => setCoAuthors(coAuthors.filter((_, idx) => idx !== i))} className="text-xs text-ink-soft hover:text-accent">移除</button>
                        </div>
                        <input
                          value={a.name}
                          onChange={(e) => setCoAuthors(coAuthors.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                          placeholder="姓名"
                          className="w-full rounded-control border border-line bg-canvas px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                        <input
                          value={a.blogUrl}
                          onChange={(e) => setCoAuthors(coAuthors.map((x, idx) => idx === i ? { ...x, blogUrl: e.target.value } : x))}
                          placeholder="博客链接（可选）"
                          className="w-full rounded-control border border-line bg-canvas px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCoAuthors([...coAuthors, { name: '', blogUrl: '' }])}
                      className="w-full rounded-control border border-dashed border-line py-2 text-xs text-ink-soft hover:border-primary hover:text-primary"
                    >
                      + 添加共创者
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-card border border-line bg-surface p-5 shadow-card">
              <h2 className="mb-4 font-medium text-ink">标签</h2>
              <div className="flex flex-wrap gap-2">
                {tags.filter((t) => t.category === 'tech' || t.category === 'general').length === 0 && <p className="text-xs text-ink-soft">暂无可用标签</p>}
                {tags.filter((t) => t.category === 'tech' || t.category === 'general').map((t) => {
                  const checked = form.tagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => update('tagIds', checked ? form.tagIds.filter((id) => id !== t.id) : [...form.tagIds, t.id])}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition-colors',
                        checked ? 'border-primary bg-primary text-white' : 'border-line text-ink-soft hover:border-primary',
                      )}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 固定操作区：无论正文多长、设置区怎么滚动，保存与发布始终可见 */}
          <div className="shrink-0 border-t border-line bg-surface p-4">
            <div className="mb-2.5 flex items-center justify-between text-[11px]">
              <span className={cn('flex items-center gap-1.5', isDirty ? 'text-accent' : 'text-ink-soft')}>
                <span className={cn('h-1.5 w-1.5 rounded-full', isDirty ? 'bg-accent' : 'bg-line-strong')} />
                {isDirty ? '有未保存的修改' : '暂无修改'}
              </span>
              <span className="text-ink-soft">正文 {wordCount} 字</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => save('draft')}
                disabled={saving || (!isDirty && form.status === 'draft')}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-control px-3 py-2 text-sm transition-colors',
                  isDirty
                    ? 'border border-line bg-surface text-ink-soft hover:border-primary hover:text-primary'
                    : 'cursor-not-allowed border border-line bg-canvas text-ink-soft opacity-60',
                )}
              >
                <Save size={15} /> 存草稿
              </button>
              <button
                onClick={() => save('published')}
                disabled={saving}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium transition-colors',
                  isDirty
                    ? 'bg-primary text-white hover:bg-primary-hover'
                    : 'cursor-not-allowed bg-line-strong text-white opacity-70',
                )}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                发布
              </button>
            </div>
            {notice && <p className="mt-2 text-[11px] text-primary">{notice}</p>}
          </div>
        </aside>
      </div>

      {imageDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={() => setImageDialog(false)}>
          <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-float" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink">插入配图</h2>
              <button onClick={() => setImageDialog(false)} className="rounded p-1 text-ink-soft hover:bg-canvas">✕</button>
            </div>
            <ImagePicker value={imageUrl} onChange={setImageUrl} placeholder="https://... 或选择本地图片" category="content" />
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">显示宽度</label>
              <select value={imageWidth} onChange={(e) => setImageWidth(e.target.value)} className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="自适应">自适应（原始尺寸）</option>
                <option value="33%">33% 宽度</option>
                <option value="50%">50% 宽度</option>
                <option value="60%">60% 宽度（推荐）</option>
                <option value="100%">100% 宽度</option>
              </select>
              <p className="mt-1 text-[11px] text-ink-soft">插入后点选图片，还能在编辑区上方随时调整宽度。</p>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setImageDialog(false)} className="rounded-control border border-line px-4 py-2 text-sm text-ink-soft">取消</button>
              <button
                onClick={() => {
                  if (imageUrl && editor) {
                    editor.chain().focus()
                      .setImage({ src: imageUrl, alt: '正文配图' })
                      .updateAttributes('image', { displayWidth: imageWidth === '自适应' ? null : imageWidth })
                      .run();
                    setImageDialog(false);
                  }
                }}
                disabled={!imageUrl}
                className="rounded-control bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                插入
              </button>
            </div>
          </div>
        </div>
      )}
      {markdownDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={() => setMarkdownDialog(false)}>
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-card border border-line bg-surface p-6 shadow-float" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-ink">粘贴 Markdown 导入</h2>
              <button onClick={() => setMarkdownDialog(false)} className="rounded p-1 text-ink-soft hover:bg-canvas">✕</button>
            </div>
            <p className="mb-3 text-xs text-ink-soft">
              支持标题、粗斜体、引用、代码块、列表、表格、链接、图片等常用语法。也可以直接从本地 Markdown 编辑器复制，编辑器会自动识别。
            </p>
            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              rows={16}
              placeholder={'# 一级标题\n\n**粗体** 与 *斜体*，[链接](https://example.com)\n\n- 列表项\n- 列表项'}
              className="w-full flex-1 resize-none rounded-control border border-line bg-canvas px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-primary"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setMarkdownDialog(false)} className="rounded-control border border-line px-4 py-2 text-sm text-ink-soft">取消</button>
              <button
                onClick={() => {
                  if (markdownText.trim() && editor) {
                    editor.chain().focus().insertContent(markdownToHtml(markdownText)).run();
                    setMarkdownDialog(false);
                  }
                }}
                disabled={!markdownText.trim()}
                className="rounded-control bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                导入到正文
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
