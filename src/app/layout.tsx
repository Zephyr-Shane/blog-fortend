import type { Metadata } from "next";
import "./globals.css";
import { getSiteConfig } from "@/lib/queries";
import { DEFAULT_SITE_NAME } from "@/lib/site";

// 站点名与 logo 来自后台配置；根 metadata 动态读取，页面只写自己的 title。
export async function generateMetadata(): Promise<Metadata> {
  let siteName = DEFAULT_SITE_NAME;
  let logo = "";
  try {
    const site = await getSiteConfig();
    if (site) {
      if (site.siteName) siteName = site.siteName;
      if (site.logo) logo = site.logo;
    }
  } catch {
    // 后端不可达时回退到默认名称与静态 favicon
  }
  return {
    title: {
      default: siteName,
      template: `%s · ${siteName}`,
    },
    description: "在代码逻辑与烟火日常之间寻找平衡。记录生活、分享技术、复盘面试。",
    keywords: ["博客", "前端", "技术", "生活", "面试"],
    // logo 为空时回退到 public/favicon.ico；配置 logo 后浏览器标签图标同步更新
    icons: { icon: logo || "/favicon.ico" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
