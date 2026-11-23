export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

/**
 * 从正文 HTML 中提取 h2/h3 生成目录，并给标题注入锚点 id。
 * 只用轻量正则处理，避免为博客引入 HTML 解析依赖；标题 id 用序号保证唯一。
 */
export function extractToc(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  let index = 0;

  const withAnchors = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_match, level, attrs, inner) => {
    index += 1;
    const id = `section-${index}`;
    const text = String(inner)
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();
    toc.push({ id, text: text || `章节 ${index}`, level: Number(level) as 2 | 3 });
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });

  return { html: withAnchors, toc };
}
