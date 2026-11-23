// 心情标记（生活栏目）
export const MOOD_META: Record<string, { label: string; className: string }> = {
  calm: { label: '平静', className: 'bg-primary-soft text-primary' },
  happy: { label: '开心', className: 'bg-accent-soft text-accent' },
  solitude: { label: '独处', className: 'bg-surface-container text-ink-soft' },
  thought: { label: '随感', className: 'bg-surface-container text-ink-soft' },
  melancholy: { label: '碎念', className: 'bg-surface-container text-ink-soft' },
};

// 内容类型标识（首页混排）
export const TYPE_META: Record<string, { label: string; className: string }> = {
  post: { label: '文章', className: 'bg-primary-soft text-primary' },
  moment: { label: '生活', className: 'bg-accent-soft text-accent' },
  interview: { label: '面试', className: 'bg-primary-soft text-primary' },
  entertainment: { label: '娱乐', className: 'bg-accent-soft text-accent' },
  friend: { label: '友链', className: 'bg-canvas text-ink-soft' },
};

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return formatDate(iso);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
