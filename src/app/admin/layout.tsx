import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSiteConfig } from '@/lib/queries';
import { DEFAULT_SITE_NAME } from '@/lib/site';

// 后台标签标题同样跟随站点配置，不再写死站点名
export async function generateMetadata(): Promise<Metadata> {
  let siteName = DEFAULT_SITE_NAME;
  try {
    const site = await getSiteConfig();
    if (site?.siteName) siteName = site.siteName;
  } catch {
    // 后端不可达时使用默认站点名
  }
  return {
    title: { default: `控制台`, template: `%s · ${siteName}` },
  };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
