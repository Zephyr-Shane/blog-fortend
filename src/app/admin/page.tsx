'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Leaf,
  Mic,
  Compass,
  Link2,
  UserRound,
  Tags,
  Image as ImageIcon,
  MessageSquare,
  Inbox,
  PenLine,
  ArrowUpRight,
  CheckCircle2,
  Edit3,
  MessageCircle,
  Layers,
  LayoutGrid,
} from 'lucide-react';
import type { AdminStats } from '@/types/api';
import { adminGet } from '@/lib/client-api';

const shortcuts = [
  { href: '/admin/posts', label: '文章', desc: '技术写作与长文', icon: FileText, color: 'text-primary' },
  { href: '/admin/moments', label: '生活动态', desc: '日常碎片与心情', icon: Leaf, color: 'text-accent' },
  { href: '/admin/interviews', label: '面试档案', desc: '面经与题库', icon: Mic, color: 'text-primary' },
  { href: '/admin/entertainment', label: '娱乐发现', desc: '收藏的好去处', icon: Compass, color: 'text-accent' },
  { href: '/admin/links', label: '友链', desc: '同好与伙伴', icon: Link2, color: 'text-primary' },
  { href: '/admin/about', label: '关于页', desc: '自我介绍与社交', icon: UserRound, color: 'text-accent' },
  { href: '/admin/tags', label: '标签', desc: '内容分类体系', icon: Tags, color: 'text-primary' },
  { href: '/admin/media', label: '媒体库', desc: '图片资源管理', icon: ImageIcon, color: 'text-accent' },
  { href: '/admin/comments', label: '评论管理', desc: '审核与互动', icon: MessageSquare, color: 'text-primary' },
  { href: '/admin/notifications', label: '通知记录', desc: '全部互动通知', icon: Inbox, color: 'text-accent' },
  { href: '/admin/config', label: '自定义配置', desc: '站点信息与全局配置', icon: PenLine, color: 'text-primary' },
  { href: '/admin/card-style', label: '首页卡片样式', desc: '卡片插槽自定义', icon: LayoutGrid, color: 'text-accent' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    adminGet<AdminStats>('/stats')
      .then((data) => setStats(data))
      .catch(() => undefined);
  }, []);

  const cards = [
    { label: '总内容数', value: stats?.totalContents ?? '—', icon: Layers, tone: 'text-primary' },
    { label: '已公开发布', value: stats?.published ?? '—', icon: CheckCircle2, tone: 'text-primary' },
    { label: '草稿箱', value: stats?.drafts ?? '—', icon: Edit3, tone: 'text-accent' },
    { label: '待审互动', value: stats?.pendingComments ?? '—', icon: MessageCircle, tone: 'text-accent' },
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs tracking-wider text-ink-soft">Console / 概览</div>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">仪表盘</h1>
        <p className="mt-1 text-sm text-ink-soft">博客运营状况一览</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-card border border-line bg-surface p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">{card.label}</span>
                <Icon size={18} strokeWidth={1.7} className={card.tone} />
              </div>
              <div className="mt-3 font-serif text-3xl font-semibold text-ink">{card.value}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-serif text-lg font-semibold text-ink">模块入口</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-card border border-line bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-canvas ${item.color}`}>
                  <Icon size={19} strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink">{item.label}</span>
                  <span className="block text-xs text-ink-soft">{item.desc}</span>
                </span>
                <ArrowUpRight size={16} className="text-ink-soft transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
