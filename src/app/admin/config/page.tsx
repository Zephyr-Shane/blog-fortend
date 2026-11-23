'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, PenLine, Eye, Info, ExternalLink, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminGet, adminPut, notifySiteConfigUpdated } from '@/lib/client-api';
import { useDirty, DirtySaveButton } from '@/components/admin/DirtySave';
import { ImagePicker } from '@/components/admin/ImagePicker';
import type { SiteAnnouncement, SiteConfig } from '@/types/api';

// 自定义配置：全站级别的命名配置项。
// 分区：站点信息（名称/logo/副标题/描述，由原「站点设置」与「站点品牌」合并）、
//       站点公告、文章署名、显示面试栏目。
// 后续新增配置项时，在此扩展字段与说明即可，无需改编辑器与前台。
// 注意：卡片样式已独立到 /admin/card-style，不再挤在此页。
export default function AdminConfigPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const { isDirty, markClean } = useDirty(config);

  useEffect(() => {
    adminGet<SiteConfig>('/site-config')
      .then((cfg) => {
        if (cfg) {
          setConfig(cfg);
          markClean(cfg);
        }
      })
      .catch(() => undefined);
  }, [markClean]);

  /** 公告字段编辑：首次编辑自动补齐默认结构，并刷新「最近更新」时间 */
  function patchAnnouncement(patch: Partial<SiteAnnouncement>) {
    if (!config) return;
    const base: SiteAnnouncement = config.announcement || {
      title: '站点公告', content: '', visible: true, updatedAt: '',
    };
    setConfig({
      ...config,
      announcement: { ...base, ...patch, updatedAt: new Date().toISOString() },
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setNotice('');
    try {
      await adminPut('/site-config', config);
      notifySiteConfigUpdated();
      markClean(config);
      setNotice('配置已保存，前台展示已同步更新');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin" /> 加载配置…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs tracking-wider text-ink-soft">Console / 自定义配置</div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">自定义配置</h1>
            <p className="mt-1 text-sm text-ink-soft">管理站点信息与全站共享的命名配置项</p>
          </div>
          <Link href="/" target="_blank" className="inline-flex items-center gap-2 rounded-control border border-line px-4 py-2 text-sm text-ink-soft hover:border-primary hover:text-primary">
            <ExternalLink size={15} /> 查看前台
          </Link>
        </div>
      </div>

      <form onSubmit={save} className="max-w-3xl space-y-5">
        <div className="flex items-start gap-3 rounded-card border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          <Info size={17} className="mt-0.5 shrink-0 text-primary" />
          <span>这里的配置是全站共享的。修改后，所有已发布、草稿及将来新建的内容都会使用最新值。</span>
        </div>

        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <Info size={18} className="text-primary" />
            <h2 className="font-serif text-lg font-semibold text-ink">站点信息</h2>
            <span className="rounded-control bg-primary-soft px-2 py-0.5 text-[11px] text-primary">导航栏 / 浏览器标签 / 首页简介</span>
          </div>
          <p className="mb-5 text-xs text-ink-soft">站点名称与 logo 用于导航栏、浏览器标签、页脚；副标题与站点描述用于首页介绍区与页面 SEO。保存后前台即时生效。</p>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">站点名称</label>
              <input
                value={config.siteName}
                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                className="w-full rounded-control border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="我的博客"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">站点 logo</label>
              <ImagePicker
                value={config.logo || ''}
                onChange={(v) => setConfig({ ...config, logo: v })}
                category="logo"
                label="选择 logo"
                placeholder="留空则使用默认图标"
              />
            </div>
            <div className="border-t border-line pt-5">
              <label className="mb-1.5 block text-sm font-medium text-ink">副标题</label>
              <input
                value={config.subtitle}
                onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                className="w-full rounded-control border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="静水流深，字落云烟"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">站点描述</label>
              <textarea
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                rows={4}
                className="w-full rounded-control border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="一句话介绍这个博客"
              />
              <p className="mt-1 text-xs text-ink-soft">用于页面 SEO 与首页介绍区</p>
            </div>
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <Megaphone size={18} className="text-primary" />
            <h2 className="font-serif text-lg font-semibold text-ink">站点公告</h2>
            <span className="rounded-control bg-primary-soft px-2 py-0.5 text-[11px] text-primary">首页右侧栏</span>
          </div>
          <p className="mb-5 text-xs text-ink-soft">展示在首页右侧栏「站点公告」卡片。留空内容或关闭开关后，前台自动隐藏该卡片。</p>
          <div className="mb-5 flex items-center justify-between rounded-control border border-line bg-canvas px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">显示公告</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                {config.announcement?.visible ? '当前：首页展示中' : '当前：已隐藏'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => patchAnnouncement({ visible: !(config.announcement?.visible ?? true) })}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                (config.announcement?.visible ?? true) ? 'bg-primary' : 'bg-line-strong',
              )}
              aria-label="切换站点公告显示"
            >
              <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', (config.announcement?.visible ?? true) ? 'left-[22px]' : 'left-0.5')} />
            </button>
          </div>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">公告标题</label>
              <input
                value={config.announcement?.title ?? ''}
                onChange={(e) => patchAnnouncement({ title: e.target.value })}
                className="w-full rounded-control border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="欢迎来做客"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">公告内容</label>
              <textarea
                value={config.announcement?.content ?? ''}
                onChange={(e) => patchAnnouncement({ content: e.target.value })}
                rows={3}
                className="w-full rounded-control border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="写一句想对访客说的话"
              />
              <p className="mt-1 text-xs text-ink-soft">纯文本展示，保存后自动更新「最近更新」日期</p>
            </div>
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <PenLine size={18} className="text-primary" />
            <h2 className="font-serif text-lg font-semibold text-ink">文章署名</h2>
            <span className="rounded-control bg-primary-soft px-2 py-0.5 text-[11px] text-primary">配置项 #1</span>
          </div>
          <p className="mb-5 text-xs text-ink-soft">所有文章的默认署名。支持多个名字，用「、」或逗号分隔，例如：Zephyr-Shane、阿棠。</p>
          <label className="mb-1.5 block text-sm font-medium text-ink">署名内容</label>
          <input
            value={config.articleSignature}
            onChange={(e) => setConfig({ ...config, articleSignature: e.target.value })}
            className="w-full rounded-control border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-primary"
            placeholder="Zephyr-Shane"
          />
          <p className="mt-2 text-xs text-ink-soft">编辑文章时会在「发布设置」中以只读形式看到这个值；单篇文章如需共创，可在文章里单独添加共创者。</p>
        </div>

        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <Eye size={18} className="text-primary" />
            <h2 className="font-serif text-lg font-semibold text-ink">显示面试栏目</h2>
            <span className="rounded-control bg-primary-soft px-2 py-0.5 text-[11px] text-primary">配置项 #2</span>
          </div>
          <p className="mb-5 text-xs text-ink-soft">控制前台是否展示面试栏目。关闭后，导航、首页筛选与混排、面试页面、搜索与标签聚合中的面试内容都会隐藏。</p>
          <div className="flex items-center justify-between rounded-control border border-line bg-canvas px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">面试栏目</p>
              <p className="mt-0.5 text-xs text-ink-soft">{config.interviewEnabled ? '当前：显示中' : '当前：已隐藏'}</p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, interviewEnabled: !config.interviewEnabled })}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                config.interviewEnabled ? 'bg-primary' : 'bg-line-strong',
              )}
              aria-label="切换面试栏目显示"
            >
              <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', config.interviewEnabled ? 'left-[22px]' : 'left-0.5')} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <DirtySaveButton isDirty={isDirty} saving={saving} onClick={save} label="保存配置" />
          {notice && <span className="text-sm text-primary">{notice}</span>}
        </div>
      </form>
    </div>
  );
}
