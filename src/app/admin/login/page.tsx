'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Feather, Loader2 } from 'lucide-react';
import { ADMIN_TOKEN_KEY, adminPost, clientGet } from '@/lib/client-api';
import { SmartImage } from '@/components/ui/SmartImage';
import { DEFAULT_SITE_NAME } from '@/lib/site';
import type { SiteConfig } from '@/types/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [logo, setLogo] = useState('');
  const [email, setEmail] = useState('admin@zephyr.dev');
  const [password, setPassword] = useState('admin123');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // 登录页品牌区同样读取站点配置，与前台/后台布局一致
  useEffect(() => {
    clientGet<SiteConfig>('/site-config')
      .then((cfg) => {
        if (cfg?.siteName) setSiteName(cfg.siteName);
        if (cfg?.logo) setLogo(cfg.logo);
      })
      .catch(() => undefined);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await adminPost<{ token: string }>('/auth/login', { email, password });
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      router.replace('/admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-16 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2 text-primary">
            <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-control bg-primary-soft">
              {logo ? (
                <SmartImage src={logo} alt={`${siteName} logo`} fill className="object-contain p-1" sizes="32px" />
              ) : (
                <Feather size={18} strokeWidth={1.6} />
              )}
            </span>
            <span className="font-serif text-lg font-semibold text-ink">{siteName}</span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-ink">欢迎回来</h1>
          <p className="mt-2 text-sm text-ink-soft">登录后进入内容控制台</p>

          <form onSubmit={submit} className="mt-9 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="admin@zephyr.dev"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-accent">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-control bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              登录
            </button>
          </form>

          <div className="mt-6 rounded-card border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-ink-soft">
            Mock 账号：<span className="font-medium text-ink">admin@zephyr.dev</span> /{' '}
            <span className="font-medium text-ink">admin123</span>
          </div>

          <Link
            href="/"
            className="mt-10 inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-primary"
          >
            <ArrowLeft size={15} /> 返回博客前台
          </Link>
        </div>
      </div>

      <div className="hidden flex-col justify-between bg-primary p-16 text-white lg:flex lg:w-1/2">
        <div className="font-serif text-2xl tracking-wide">静水流深，字落云烟</div>
        <div>
          <p className="font-serif text-3xl leading-relaxed">
            在代码逻辑与烟火日常之间
            <br />
            寻找平衡
          </p>
          <p className="mt-6 text-sm text-white/60">—— {siteName} · 内容控制台</p>
        </div>
        <div className="text-xs text-white/40">Console v2.4 · Mock Mode</div>
      </div>
    </div>
  );
}
