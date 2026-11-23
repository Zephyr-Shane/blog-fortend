'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { ResourceManager, type Row } from '@/components/admin/ResourceManager';
import { formatDate } from '@/lib/format';

export default function AdminPostsPage() {
  return (
    <ResourceManager
      resource="post"
      title="文章"
      description="技术写作与长文，正文使用富文本编辑器"
      columns={[
        { key: 'title', label: '标题', render: (row) => <span className="font-medium text-ink">{String(row.title ?? '')}</span> },
        { key: 'category', label: '分类' },
        {
          key: 'publishedAt',
          label: '发布时间',
          render: (row) => (row.publishedAt ? formatDate(String(row.publishedAt)) : '—'),
        },
        { key: 'commentCount', label: '评论' },
        { key: 'likeCount', label: '点赞' },
      ]}
      fields={[{ key: 'title', label: '标题', type: 'text', required: true }]}
      searchKeys={['title', 'excerpt', 'slug']}
      createHref="/admin/posts/new"
      editHref={(row: Row) => `/admin/posts/${row.id}`}
      extraActions={(row: Row) => (
        <Link
          href={`/posts/${String(row.slug ?? '')}`}
          target="_blank"
          className="rounded p-1.5 text-ink-soft hover:bg-primary-soft hover:text-primary"
          title="查看前台"
        >
          <ExternalLink size={15} />
        </Link>
      )}
    />
  );
}
