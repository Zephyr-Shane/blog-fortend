import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { getSiteConfig } from '@/lib/queries';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteConfig();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader showInterview={site.interviewEnabled !== false} siteName={site.siteName} logo={site.logo} />
      <main className="flex-1">{children}</main>
      <SiteFooter siteName={site.siteName} />
    </div>
  );
}
