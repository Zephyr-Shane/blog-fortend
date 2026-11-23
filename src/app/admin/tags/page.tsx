'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { ResourceManager, type Row } from '@/components/admin/ResourceManager';

const categoryLabel: Record<string, string> = { tech: '技术', life: '生活', general: '通用' };

export default function AdminTagsPage() {
  return (
    <ResourceManager
      resource="tag"
      title="标签管理"
      description="全站共用的内容分类标签，按技术 / 生活 / 通用归类"
      columns={[
        { key: 'name', label: '标签名', render: (row) => <span className="font-medium text-ink">{String(row.name ?? '')}</span> },
        { key: 'slug', label: 'URL 标识' },
        { key: 'category', label: '分类', render: (row) => categoryLabel[String(row.category ?? 'general')] ?? '通用' },
      ]}
      fields={[
        { key: 'name', label: '标签名', type: 'text', required: true, placeholder: '例如：前端架构' },
        { key: 'slug', label: 'URL 标识', type: 'text', required: true, placeholder: '例如：frontend-architecture', help: '用于 /tags/[slug] 路径，建议使用英文小写与连字符' },
        {
          key: 'category',
          label: '标签分类',
          type: 'select',
          options: [
            { value: 'tech', label: '技术（文章）' },
            { value: 'life', label: '生活（动态）' },
            { value: 'general', label: '通用（全场景）' },
          ],
          defaultValue: 'general',
          help: '技术类显示在文章编辑器，生活类显示在动态编辑器，通用类在所有场景都可选',
        },
      ]}
      searchKeys={['name', 'slug']}
      extraActions={(row: Row) => (
        <Link
          href={`/tags/${String(row.slug ?? '')}`}
          target="_blank"
          className="rounded p-1.5 text-ink-soft hover:bg-primary-soft hover:text-primary"
          title="查看聚合页"
        >
          <ExternalLink size={15} />
        </Link>
      )}
    />
  );
}
