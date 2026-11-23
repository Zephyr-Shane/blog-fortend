'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Save, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { useDirty, DirtySaveButton } from '@/components/admin/DirtySave';
import { adminGet, adminPut, notifySiteConfigUpdated } from '@/lib/client-api';
import type { SiteConfig, SocialLink } from '@/types/api';

const fieldCls =
  'w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary';

export default function AdminAboutPage() {
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

  function update<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateSocial(index: number, patch: Partial<SocialLink>) {
    if (!config) return;
    update('socialLinks', config.socialLinks.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setNotice('');
    try {
      await adminPut('/site-config', config);
      notifySiteConfigUpdated();
      setNotice('关于页已更新');
      markClean(config);
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
        <div className="text-xs tracking-wider text-ink-soft">Console / 关于页</div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">关于页</h1>
            <p className="mt-1 text-sm text-ink-soft">管理自我介绍、头像与社交链接</p>
          </div>
          <Link href="/about" target="_blank" className="inline-flex items-center gap-2 rounded-control border border-line px-4 py-2 text-sm text-ink-soft hover:border-primary hover:text-primary">
            <ExternalLink size={15} /> 查看前台
          </Link>
        </div>
      </div>

      <form onSubmit={save} className="max-w-3xl space-y-6">
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="mb-5 font-serif text-lg font-semibold text-ink">作者信息</h2>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">作者名称</label>
              <input value={config.authorName} onChange={(e) => update('authorName', e.target.value)} className={fieldCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">个人介绍</label>
              <textarea value={config.authorBio} onChange={(e) => update('authorBio', e.target.value)} rows={4} className={fieldCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">头像</label>
              <ImagePicker value={config.avatar} onChange={(v) => update('avatar', v)} category="avatar" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">站点描述</label>
              <textarea value={config.description} onChange={(e) => update('description', e.target.value)} rows={3} className={fieldCls} />
            </div>
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-ink">社交链接</h2>
            <button
              type="button"
              onClick={() => update('socialLinks', [...config.socialLinks, { label: '', url: '' }])}
              className="inline-flex items-center gap-1.5 rounded-control border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-primary hover:text-primary"
            >
              <Plus size={14} /> 添加
            </button>
          </div>
          <div className="space-y-3">
            {config.socialLinks.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={s.label}
                  onChange={(e) => updateSocial(i, { label: e.target.value })}
                  placeholder="名称"
                  className="w-40 rounded-control border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                  value={s.url}
                  onChange={(e) => updateSocial(i, { url: e.target.value })}
                  placeholder="链接地址"
                  className="flex-1 rounded-control border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => update('socialLinks', config.socialLinks.filter((_, idx) => idx !== i))}
                  className="rounded-control p-2 text-ink-soft hover:bg-accent-soft hover:text-accent"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {config.socialLinks.length === 0 && <p className="text-sm text-ink-soft">暂无社交链接</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <DirtySaveButton isDirty={isDirty} saving={saving} onClick={save} />
          {notice && <span className="text-sm text-primary">{notice}</span>}
        </div>
      </form>
    </div>
  );
}
