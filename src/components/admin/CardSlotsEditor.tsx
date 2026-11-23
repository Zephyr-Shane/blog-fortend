'use client';

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ALL_SLOTS,
  CARD_TYPE_LABELS,
  DEFAULT_CARD_SLOTS,
  SLOT_LABELS,
  type CardSlotsConfig,
  type CardType,
  type SlotKey,
} from '@/lib/card-slots';

const TYPES: CardType[] = ['post', 'moment', 'interview', 'link'];

export function CardSlotsEditor({
  value,
  onChange,
}: {
  value: CardSlotsConfig;
  onChange: (next: CardSlotsConfig) => void;
}) {
  function updateType(type: CardType, patch: Partial<CardSlotsConfig[CardType]>) {
    onChange({ ...value, [type]: { ...value[type], ...patch } });
  }

  function toggleSlot(type: CardType, slot: SlotKey) {
    updateType(type, {
      visible: { ...value[type].visible, [slot]: !value[type].visible[slot] },
    });
  }

  function moveSlot(type: CardType, slot: SlotKey, dir: -1 | 1) {
    const order = [...value[type].order];
    const i = order.indexOf(slot);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    updateType(type, { order });
  }

  function resetType(type: CardType) {
    updateType(type, DEFAULT_CARD_SLOTS[type]);
  }

  function resetAll() {
    onChange({
      post: { ...DEFAULT_CARD_SLOTS.post },
      moment: { ...DEFAULT_CARD_SLOTS.moment },
      interview: { ...DEFAULT_CARD_SLOTS.interview },
      link: { ...DEFAULT_CARD_SLOTS.link },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-soft">
          按内容类型调整卡片各区块的显示与顺序。改动只影响卡片内部，不改变页面栅格与整体布局。
        </p>
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex shrink-0 items-center gap-1 text-xs text-ink-soft hover:text-primary"
        >
          <RotateCcw size={13} /> 全部重置
        </button>
      </div>

      {TYPES.map((type) => {
        const cfg = value[type];
        const coverEnabled = type === 'post' || type === 'interview' || type === 'link';
        const momentOnly = type === 'moment';
        return (
          <div key={type} className="rounded-control border border-line bg-canvas p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid size={16} className="text-primary" />
                <h3 className="font-serif text-base font-semibold text-ink">{CARD_TYPE_LABELS[type]}</h3>
              </div>
              <button
                type="button"
                onClick={() => resetType(type)}
                className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-primary"
              >
                <RotateCcw size={12} /> 重置
              </button>
            </div>

            {/* 插槽显隐 + 排序 */}
            <div className="space-y-1.5">
              <div className="mb-1 grid grid-cols-[1fr_auto] items-center px-1 text-[11px] font-medium text-ink-soft">
                <span>插槽（自上而下为显示顺序）</span>
                <span>显示 / 顺序</span>
              </div>
              {cfg.order.map((slot, idx) => {
                const visible = cfg.visible[slot];
                return (
                  <div
                    key={slot}
                    className={cn(
                      'flex items-center justify-between rounded-control border px-3 py-2 transition-colors',
                      visible ? 'border-line bg-surface' : 'border-line/60 bg-surface/40 opacity-60',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-ink-soft" />
                      <span className={cn('text-sm', visible ? 'text-ink' : 'text-ink-soft line-through')}>
                        {SLOT_LABELS[slot]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleSlot(type, slot)}
                        className={cn(
                          'rounded-control p-1.5 transition-colors',
                          visible ? 'text-primary hover:bg-primary-soft' : 'text-ink-soft hover:bg-surface-container',
                        )}
                        title={visible ? '隐藏该区块' : '显示该区块'}
                      >
                        {visible ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlot(type, slot, -1)}
                        disabled={idx === 0}
                        className="rounded-control p-1.5 text-ink-soft hover:bg-surface-container disabled:opacity-30"
                        title="上移"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlot(type, slot, 1)}
                        disabled={idx === cfg.order.length - 1}
                        className="rounded-control p-1.5 text-ink-soft hover:bg-surface-container disabled:opacity-30"
                        title="下移"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 布局参数 */}
            <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              {coverEnabled && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink">封面位置</label>
                  <div className="flex rounded-control border border-line bg-surface p-0.5">
                    {(['right', 'top'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => updateType(type, { coverPosition: pos })}
                        className={cn(
                          'flex-1 rounded-[4px] px-2 py-1.5 text-xs transition-colors',
                          cfg.coverPosition === pos ? 'bg-primary text-white' : 'text-ink-soft hover:text-ink',
                        )}
                      >
                        {pos === 'right' ? '右侧配图' : '顶部通栏'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {momentOnly && (
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink">
                    <span>配图上限（九宫格）</span>
                    <span className="text-primary">{cfg.maxImages} 张</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={9}
                    value={cfg.maxImages}
                    onChange={(e) => updateType(type, { maxImages: Number(e.target.value) })}
                    className="w-full accent-[var(--primary)]"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink">
                  <span>摘要显示行数</span>
                  <span className="text-primary">{cfg.excerptLines} 行</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={6}
                  value={cfg.excerptLines}
                  onChange={(e) => updateType(type, { excerptLines: Number(e.target.value) })}
                  className="w-full accent-[var(--primary)]"
                />
              </div>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-ink-soft">提示：ALL_SLOTS 共 {ALL_SLOTS.length} 个插槽，未加入顺序的插槽会自动追加到末尾并保持隐藏。</p>
    </div>
  );
}
