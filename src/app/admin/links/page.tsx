'use client';

import { ResourceManager, type Row } from '@/components/admin/ResourceManager';

const isFriend = (row: Row) => row.category === 'friend';

export default function AdminLinksPage() {
  return (
    <ResourceManager
      resource="link"
      title="友链"
      description="同好博客与伙伴站点，按分组展示"
      fixedFilter={isFriend}
      columns={[
        { key: 'name', label: '名称', render: (row) => <span className="font-medium text-ink">{String(row.name ?? '')}</span> },
        { key: 'url', label: '网址' },
        { key: 'group', label: '分组' },
        { key: 'description', label: '描述' },
      ]}
      fields={[
        { key: 'name', label: '名称', type: 'text', required: true },
        { key: 'url', label: '网址', type: 'text', required: true, placeholder: 'https://' },
        { key: 'description', label: '描述', type: 'textarea', required: true, wide: true },
        { key: 'logo', label: '图标', type: 'image', wide: true, category: 'logo', placeholder: '/images/link-cloud.svg' },
        { key: 'group', label: '分组', type: 'text', placeholder: '例如：技术同好' },
        { key: 'tags', label: '标签', type: 'tags', wide: true },
        { key: 'allowComments', label: '允许评论', type: 'checkbox', placeholder: '允许评论', defaultValue: true },
      ]}
      searchKeys={['name', 'url', 'description', 'group']}
      defaults={{ category: 'friend', allowComments: true }}
    />
  );
}
