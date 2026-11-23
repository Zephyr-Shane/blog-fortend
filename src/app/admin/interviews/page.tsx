'use client';

import { ResourceManager } from '@/components/admin/ResourceManager';

const KIND_LABEL: Record<string, string> = { experience: '面经', question: '题目', prep: '笔记' };
const RESULT_LABEL: Record<string, string> = { pass: '通过', fail: '未通过', ongoing: '进行中' };
const DIFFICULTY_LABEL: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };

export default function AdminInterviewsPage() {
  return (
    <ResourceManager
      resource="interview"
      title="面试档案"
      description="实战面经、高频题库与准备笔记"
      columns={[
        { key: 'title', label: '标题', render: (row) => <span className="font-medium text-ink">{String(row.title ?? '')}</span> },
        { key: 'kind', label: '类型', render: (row) => KIND_LABEL[String(row.kind ?? '')] ?? '—' },
        { key: 'company', label: '公司' },
        { key: 'difficulty', label: '难度', render: (row) => (row.difficulty ? DIFFICULTY_LABEL[String(row.difficulty)] ?? '—' : '—') },
        { key: 'result', label: '结果', render: (row) => (row.result ? RESULT_LABEL[String(row.result)] ?? '—' : '—') },
      ]}
      fields={[
        { key: 'title', label: '标题', type: 'text', required: true, wide: true },
        {
          key: 'kind',
          label: '类型',
          type: 'select',
          options: [
            { value: 'experience', label: '实战面经' },
            { value: 'question', label: '高频题目' },
            { value: 'prep', label: '准备笔记' },
          ],
          defaultValue: 'experience',
        },
        { key: 'company', label: '公司', type: 'text', placeholder: '例如：蚂蚁集团' },
        { key: 'position', label: '岗位', type: 'text', placeholder: '例如：高级前端架构师' },
        {
          key: 'result',
          label: '面试结果',
          type: 'select',
          options: [
            { value: 'pass', label: '通过' },
            { value: 'fail', label: '未通过' },
            { value: 'ongoing', label: '进行中' },
          ],
        },
        { key: 'knowledgePoint', label: '知识点', type: 'text', placeholder: '例如：React Hooks' },
        {
          key: 'difficulty',
          label: '难度',
          type: 'select',
          options: [
            { value: 'easy', label: '简单' },
            { value: 'medium', label: '中等' },
            { value: 'hard', label: '困难' },
          ],
        },
        { key: 'content', label: '正文', type: 'textarea', required: true, wide: true, help: '支持 HTML 标签，例如 <p>、<code>' },
        { key: 'tags', label: '标签', type: 'tags', wide: true, tagCategory: 'tech' },
        { key: 'allowComments', label: '允许评论', type: 'checkbox', placeholder: '允许评论', defaultValue: true },
      ]}
      searchKeys={['title', 'company', 'content']}
      defaults={{ kind: 'experience', allowComments: true }}
    />
  );
}
