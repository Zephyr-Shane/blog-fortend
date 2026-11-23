import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // F0 阶段关闭：Mock 数据大量使用 no-store fetch，开 cacheComponents 会强制 Suspense 包裹，徒增复杂度。
  // 等 F1 页面结构稳定后，按需再开启以换取更好的缓存与首屏。
  cacheComponents: false,
  output: "standalone",
};

export default nextConfig;
