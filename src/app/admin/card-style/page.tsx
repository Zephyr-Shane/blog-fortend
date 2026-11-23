'use client';

import { useEffect, useState } from 'react';
import { Loader2, Info } from 'lucide-react';
import { adminGet, adminPut, notifySiteConfigUpdated } from '@/lib/client-api';
import { useDirty, DirtySaveButton } from '@/components/admin/DirtySave';
import { CardSlotsEditor } from '@/components/admin/CardSlotsEditor';
import { normalizeCardSlots, type CardSlotsConfig } from '@/lib/card-slots';
import type { SiteConfig } from '@/types/api';

// 首页卡片样式：独立于「自定义配置」，单独管理四类卡片的插槽布局。
export default function AdminCardStylePage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const { isDirty, markClean } = useDirty(config);

  useEffect(() => {
    adminGet<SiteConfig>('/site-config')
      .then((cfg) => {
        if (cfg) {
          const normalized = {
            ...cfg,
            cardSlots: normalizeCardSlots(cfg.cardSlots) as unknown as Record<string, unknown>,
          };
          setConfig(normalized);
          markClean(normalized);
        }
      })
      .catch(() => undefined);
  }, [markClean]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setNotice('');
    try {
      await adminPut('/site-config', config);
      notifySiteConfigUpdated();
      markClean(config);
      setNotice('卡片样式已保存，前台展示已同步更新');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center gap-2 py-32 text-sm text-ink-soft">
        <Loader2 size={16} className="animate-spin" /> 加载卡片样式…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs tracking-wider text-ink-soft">Console / 首页卡片样式</div>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">首页卡片样式</h1>
        <p className="mt-1 text-sm text-ink-soft">按内容类型自定义卡片各区块的显示、顺序与布局参数</p>
      </div>

      <form onSubmit={save} className="max-w-4xl space-y-5">
        <div className="flex items-start gap-3 rounded-card border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          <Info size={17} className="mt-0.5 shrink-0 text-primary" />
          <span>
            这里的设置作用于首页及各列表页的文章、生活、面试、娱乐/友链卡片。改动只影响卡片内部呈现，不改变页面栅格与整体布局。保存后前台即时生效。
          </span>
        </div>

        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <CardSlotsEditor
            value={normalizeCardSlots(config.cardSlots)}
            onChange={(next: CardSlotsConfig) =>
              setConfig({ ...config, cardSlots: next as unknown as Record<string, unknown> })
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <DirtySaveButton isDirty={isDirty} saving={saving} onClick={save} label="保存卡片样式" />
          {notice && <span className="text-sm text-primary">{notice}</span>}
        </div>
      </form>
    </div>
  );
}
