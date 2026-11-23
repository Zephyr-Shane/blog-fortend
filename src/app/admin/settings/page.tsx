import { redirect } from 'next/navigation';

// 「站点设置」已合并进「自定义配置」，保留旧地址兼容书签/历史链接。
export default function AdminSettingsPage() {
  redirect('/admin/config');
}
