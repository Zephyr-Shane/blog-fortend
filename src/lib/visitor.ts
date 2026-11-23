// 匿名访客标识：首次访问生成 UUID 存 localStorage，后续请求携带。
// 这是匿名身份（非登录），换浏览器/清缓存即新身份，博客场景可接受。
const VISITOR_KEY = 'zephyr-visitor';

export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : 'v-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}
