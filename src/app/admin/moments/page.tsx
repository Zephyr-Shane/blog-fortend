'use client';

import { ResourceManager, type Row } from '@/components/admin/ResourceManager';
import { MOOD_META, formatDate } from '@/lib/format';

export default function AdminMomentsPage() {
  return (
    <ResourceManager
      resource="moment"
      title="生活动态"
      description="记录日常碎片、心情与地点"
      columns={[
        {
          key: 'content',
          label: '内容',
          render: (row) => <span className="text-ink">{String(row.content ?? '').slice(0, 60)}…</span>,
        },
        {
          key: 'mood',
          label: '心情',
          render: (row) => MOOD_META[row.mood as keyof typeof MOOD_META]?.label ?? String(row.mood ?? '—'),
        },
        { key: 'location', label: '地点' },
        {
          key: 'publishedAt',
          label: '发布时间',
          render: (row) => (row.publishedAt ? formatDate(String(row.publishedAt)) : '—'),
        },
        { key: 'likeCount', label: '点赞' },
      ]}
      fields={[
        { key: 'content', label: '内容', type: 'textarea', required: true, wide: true, placeholder: '这一刻想记录什么？' },
        {
          key: 'mood',
          label: '心情',
          type: 'select',
          options: [
            { value: 'calm', label: '平静' },
            { value: 'happy', label: '开心' },
            { value: 'solitude', label: '独处' },
            { value: 'thought', label: '思考' },
            { value: 'melancholy', label: '低落' },
          ],
          defaultValue: 'calm',
        },
        { key: 'location', label: '地点', type: 'text', placeholder: '例如：西溪湿地旁的小书房' },
        { key: 'images', label: '图片', type: 'images', wide: true, category: 'gallery', help: '每行一个图片路径，留空则无配图' },
        { key: 'tags', label: '标签', type: 'tags', wide: true, tagCategory: 'life' },
        { key: 'allowComments', label: '允许评论', type: 'checkbox', placeholder: '允许评论', defaultValue: true },
      ]}
      searchKeys={['content', 'location']}
      defaults={{ mood: 'calm', allowComments: true }}
    />
  );
}
