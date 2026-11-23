'use client';

import { ResourceManager, type Row } from '@/components/admin/ResourceManager';

const isEntertainment = (row: Row) => row.category === 'entertainment';

export default function AdminEntertainmentPage() {
  return (
    <ResourceManager
      resource="link"
      title="娱乐发现"
      description="收藏的网站、电台与数字好去处"
      fixedFilter={isEntertainment}
      columns={[
        { key: 'name', label: '名称', render: (row) => <span className="font-medium text-ink">{String(row.name ?? '')}</span> },
        { key: 'url', label: '链接' },
        { key: 'description', label: '描述' },
        { key: 'likeCount', label: '点赞' },
      ]}
      fields={[
        { key: 'name', label: '名称', type: 'text', required: true },
        { key: 'url', label: '网址', type: 'text', required: true, placeholder: 'https://' },
        { key: 'description', label: '描述', type: 'textarea', required: true, wide: true },
        { key: 'logo', label: '图标', type: 'image', wide: true, category: 'logo', placeholder: '/images/link-poolsuite.svg' },
        { key: 'group', label: '分组', type: 'text', placeholder: '可选' },
        { key: 'tags', label: '标签', type: 'tags', wide: true },
        { key: 'allowComments', label: '允许评论', type: 'checkbox', placeholder: '允许评论', defaultValue: true },
      ]}
      searchKeys={['name', 'url', 'description']}
      defaults={{ category: 'entertainment', allowComments: true }}
    />
  );
}
