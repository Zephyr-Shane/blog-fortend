'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
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
  SlidersHorizontal,
  LayoutGrid,
  ArrowLeft,
  LogOut,
  Search,
  Feather,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_TOKEN_KEY, SITE_CONFIG_UPDATED_EVENT, adminGet } from '@/lib/client-api';
import { SmartImage } from '@/components/ui/SmartImage';
import { NotificationBell } from '@/components/admin/NotificationBell';
import type { SiteConfig } from '@/types/api';
import { DEFAULT_SITE_NAME } from '@/lib/site';

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const navGroups: { label: string; items: NavItem[] }[] = [
  { label: '概览', items: [{ href: '/admin', label: '仪表盘', icon: LayoutDashboard }] },
  {
    label: '内容管理',
    items: [
      { href: '/admin/posts', label: '文章', icon: FileText },
      { href: '/admin/moments', label: '生活动态', icon: Leaf },
      { href: '/admin/interviews', label: '面试档案', icon: Mic },
      { href: '/admin/entertainment', label: '娱乐发现', icon: Compass },
      { href: '/admin/links', label: '友链', icon: Link2 },
      { href: '/admin/about', label: '关于页', icon: UserRound },
    ],
  },
  {
    label: '系统管理',
    items: [
      { href: '/admin/tags', label: '标签管理', icon: Tags },
      { href: '/admin/media', label: '媒体库', icon: ImageIcon },
      { href: '/admin/comments', label: '评论管理', icon: MessageSquare },
      { href: '/admin/notifications', label: '通知记录', icon: Inbox },
      { href: '/admin/config', label: '自定义配置', icon: SlidersHorizontal },
      { href: '/admin/card-style', label: '首页卡片样式', icon: LayoutGrid },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [site, setSite] = useState<{ siteName: string; logo: string; authorName: string; avatar: string }>({
    siteName: DEFAULT_SITE_NAME,
    logo: '',
    authorName: '管理员',
    avatar: '',
  });

  const isLogin = pathname === '/admin/login';
  // 文章编辑页为沉浸式全屏编辑器：不展示后台侧边栏与顶栏，避免干扰写作
  const isEditor = pathname === '/admin/posts/new' || /^\/admin\/posts\/\d+$/.test(pathname);

  useEffect(() => {
    if (isLogin) return;
    if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
      router.replace('/admin/login');
    } else {
      setAuthed(true);
    }
  }, [isLogin, router]);

  /** 站点品牌（站点名/logo）与用户信息（昵称/头像）均取自站点配置；保存后通过事件即时刷新 */
  useEffect(() => {
    if (!authed) return;
    let alive = true;
    const loadSite = () => {
      adminGet<SiteConfig>('/site-config')
        .then((cfg) => {
          if (alive && cfg) {
            setSite({
              siteName: cfg.siteName || DEFAULT_SITE_NAME,
              logo: cfg.logo || '',
              authorName: cfg.authorName || cfg.siteName || '管理员',
              avatar: cfg.avatar || '',
            });
          }
        })
        .catch(() => undefined);
    };
    loadSite();
    window.addEventListener(SITE_CONFIG_UPDATED_EVENT, loadSite);
    return () => {
      alive = false;
      window.removeEventListener(SITE_CONFIG_UPDATED_EVENT, loadSite);
    };
  }, [authed]);

  function logout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    router.replace('/admin/login');
  }

  if (isLogin) return <>{children}</>;

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-ink-soft">
        正在进入控制台…
      </div>
    );
  }

  if (isEditor) {
    return <div className="h-dvh overflow-hidden bg-canvas">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* 侧边栏 */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
        <div className="border-b border-line px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-control bg-primary text-white transition-colors group-hover:bg-primary-hover">
              {site.logo ? (
                <SmartImage src={site.logo} alt={`${site.siteName} logo`} fill className="object-contain p-1" sizes="32px" />
              ) : (
                <Feather size={17} strokeWidth={1.6} />
              )}
            </span>
            <span>
              <span className="block font-serif text-lg font-semibold tracking-wide text-ink">{site.siteName}</span>
              <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Console</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <div className="mb-2 px-3 text-[11px] font-medium tracking-wider text-ink-soft">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-primary-soft font-medium text-primary'
                          : 'text-ink-soft hover:bg-canvas hover:text-ink',
                      )}
                    >
                      <Icon size={17} strokeWidth={1.7} />
                      {item.label}
                      {active && <ChevronRight size={14} className="ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-line px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-control px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
          >
            <ArrowLeft size={17} strokeWidth={1.7} /> 返回博客前台
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-canvas hover:text-ink"
          >
            <LogOut size={17} strokeWidth={1.7} /> 退出登录
          </button>
        </div>
      </aside>

      {/* 主区域 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface px-8">
          <label className="relative hidden max-w-xs flex-1 lg:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              placeholder="搜索内容…"
              className="w-full rounded-control border border-line bg-canvas py-2 pl-9 pr-12 text-sm outline-none focus:border-primary"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line px-1.5 py-0.5 text-[10px] text-ink-soft">
              ⌘K
            </span>
          </label>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/admin/posts/new"
              className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <Plus size={16} /> 新建文章
            </Link>
            <NotificationBell />
            <div className="flex items-center gap-2 border-l border-line pl-3">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-xs font-medium text-primary">
                {site.avatar ? (
                  <SmartImage src={site.avatar} alt="头像" fill className="object-cover" sizes="32px" />
                ) : (
                  site.authorName.slice(0, 1)
                )}
              </span>
              <span className="text-sm text-ink">{site.authorName}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
