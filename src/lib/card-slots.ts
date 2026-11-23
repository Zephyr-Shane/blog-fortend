// 卡片插槽（Card Slots）模型
// 首页及各列表页的卡片由「插槽」拼装：每个插槽是一段独立的视觉区块，
// 由站点配置决定是否显示、显示顺序与局部样式。外层栅格容器不受影响。

export type CardType = 'post' | 'moment' | 'interview' | 'link';

/** 卡片内部的标准插槽 */
export type SlotKey = 'badge' | 'cover' | 'title' | 'excerpt' | 'meta' | 'engagement';

/** 单个内容类型的插槽配置 */
export interface CardTypeConfig {
  /** 插槽显示顺序（数组顺序即渲染顺序） */
  order: SlotKey[];
  /** 各插槽是否显示 */
  visible: Record<SlotKey, boolean>;
  /** 封面位置：right=左文右图，top=上图下文（仅 post/interview/link 有意义） */
  coverPosition: 'right' | 'top';
  /** 生活卡配图上限 1-9（仅 moment 有意义） */
  maxImages: number;
  /** 摘要最大行数（1-6） */
  excerptLines: number;
}

/** 四类卡片的插槽配置 */
export type CardSlotsConfig = Record<CardType, CardTypeConfig>;

export const ALL_SLOTS: SlotKey[] = ['badge', 'cover', 'title', 'excerpt', 'meta', 'engagement'];

export const SLOT_LABELS: Record<SlotKey, string> = {
  badge: '类型标识',
  cover: '封面 / 配图',
  title: '标题',
  excerpt: '摘要 / 正文',
  meta: '元信息（标签 / 地点）',
  engagement: '互动栏（点赞 / 评论）',
};

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  post: '文章（技术 / 随笔）',
  moment: '生活动态',
  interview: '面试档案',
  link: '娱乐 / 友链',
};

/** 默认插槽配置：等于当前视觉 + 本轮第一阶段增强（文章右图、生活九宫格） */
export const DEFAULT_CARD_SLOTS: CardSlotsConfig = {
  post: {
    order: ['badge', 'title', 'excerpt', 'meta', 'cover', 'engagement'],
    visible: { badge: true, cover: true, title: true, excerpt: true, meta: true, engagement: true },
    coverPosition: 'right',
    maxImages: 9,
    excerptLines: 2,
  },
  moment: {
    order: ['badge', 'excerpt', 'cover', 'meta', 'engagement'],
    visible: { badge: true, cover: true, title: false, excerpt: true, meta: true, engagement: true },
    coverPosition: 'top',
    maxImages: 9,
    excerptLines: 4,
  },
  interview: {
    order: ['badge', 'title', 'excerpt', 'meta', 'cover', 'engagement'],
    visible: { badge: true, cover: false, title: true, excerpt: true, meta: true, engagement: true },
    coverPosition: 'top',
    maxImages: 9,
    excerptLines: 2,
  },
  link: {
    order: ['badge', 'cover', 'title', 'excerpt', 'meta', 'engagement'],
    visible: { badge: true, cover: true, title: true, excerpt: true, meta: false, engagement: true },
    coverPosition: 'top',
    maxImages: 9,
    excerptLines: 2,
  },
};

/** 把后端返回的（可能不完整/含旧字段的）配置规整为完整配置，缺项用默认值兜底 */
export function normalizeCardSlots(raw: unknown): CardSlotsConfig {
  const out: CardSlotsConfig = {
    post: { ...DEFAULT_CARD_SLOTS.post },
    moment: { ...DEFAULT_CARD_SLOTS.moment },
    interview: { ...DEFAULT_CARD_SLOTS.interview },
    link: { ...DEFAULT_CARD_SLOTS.link },
  };
  if (!raw || typeof raw !== 'object') return out;
  const src = raw as Record<string, unknown>;
  (Object.keys(out) as CardType[]).forEach((type) => {
    const part = src[type];
    if (!part || typeof part !== 'object') return;
    const p = part as Record<string, unknown>;
    const def = DEFAULT_CARD_SLOTS[type];
    if (Array.isArray(p.order)) {
      const valid = p.order.filter((k): k is SlotKey => ALL_SLOTS.includes(k as SlotKey));
      // 补齐缺失的插槽，保证每项都在 order 中（缺失的追加到末尾）
      const seen = new Set(valid);
      out[type].order = [...valid, ...ALL_SLOTS.filter((k) => !seen.has(k))];
    }
    if (p.visible && typeof p.visible === 'object') {
      const v = p.visible as Record<string, unknown>;
      ALL_SLOTS.forEach((k) => {
        if (typeof v[k] === 'boolean') out[type].visible[k] = v[k] as boolean;
      });
    }
    if (p.coverPosition === 'right' || p.coverPosition === 'top') out[type].coverPosition = p.coverPosition;
    if (typeof p.maxImages === 'number') out[type].maxImages = Math.min(9, Math.max(1, Math.round(p.maxImages)));
    if (typeof p.excerptLines === 'number') out[type].excerptLines = Math.min(6, Math.max(1, Math.round(p.excerptLines)));
  });
  return out;
}
