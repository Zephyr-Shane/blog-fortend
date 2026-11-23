/**
 * 轻量 Markdown → HTML 转换（供编辑器粘贴/导入使用）。
 * 只支持博客写作常用语法；所有文本先转义，避免粘贴内容注入脚本。
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 仅允许安全协议，防止 javascript: 链接 */
const safeUrl = (raw: string) => {
  const url = raw.trim();
  return /^(https?:\/\/|\/|#|mailto:|data:image\/)/i.test(url) ? escapeHtml(url) : '#';
};

function inline(text: string): string {
  // 先转义，再用占位符保护行内代码，避免代码里的 * _ 被当成强调
  const codes: string[] = [];
  let out = escapeHtml(text).replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(`<code>${code}</code>`);
    return `\u0000CODE${codes.length - 1}\u0000`;
  });

  // 图片必须先于链接处理，否则 ![alt](url) 会被链接规则吃掉
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_m, alt: string, url: string, title?: string) =>
      `<img src="${safeUrl(url)}" alt="${alt}"${title ? ` title="${title}"` : ''} />`);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, label: string, url: string) =>
      `<a href="${safeUrl(url)}" target="_blank" rel="noreferrer">${label}</a>`);

  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>');

  return out.replace(/\u0000CODE(\d+)\u0000/g, (_m, i: string) => codes[Number(i)] ?? '');
}

/** 判断一段纯文本是否像 Markdown，避免劫持普通粘贴 */
export const looksLikeMarkdown = (text: string): boolean =>
  /(^|\n)\s{0,3}(#{1,6}\s|>\s|[-*+]\s|\d+[.)]\s|```|---\s*$|\|.*\|)/.test(text) ||
  /\*\*[^*\n]+\*\*|\[[^\]]+\]\([^)\s]+\)/.test(text);

export function markdownToHtml(source: string): string {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;

  const isBlockStart = (line: string) =>
    /^\s{0,3}(#{1,6}\s|>\s|[-*+]\s|\d+[.)]\s|```|---\s*$)/.test(line) || line.trim() === '';

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') { i++; continue; }

    // 围栏代码块
    const fence = line.match(/^\s*```\s*([\w+-]*)/);
    if (fence) {
      const lang = fence[1] || '';
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) buf.push(lines[i++]);
      if (i < lines.length) i++;
      html.push(`<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ''}>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    // 标题
    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(6, heading[1].length);
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // 分割线
    if (/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { html.push('<hr />'); i++; continue; }

    // 引用（可含多行）
    if (/^\s{0,3}>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s{0,3}>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s{0,3}>\s?/, ''));
        i++;
      }
      html.push(`<blockquote>${markdownToHtml(buf.join('\n'))}</blockquote>`);
      continue;
    }

    // 表格：表头行 + 分隔行
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
      const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') body.push(cells(lines[i++]));
      html.push(
        `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>` +
        `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
      );
      continue;
    }

    // 列表
    const ul = line.match(/^\s{0,3}([-*+])\s+(.+)$/);
    const ol = line.match(/^\s{0,3}\d+[.)]\s+(.+)$/);
    if (ul || ol) {
      const ordered = Boolean(ol);
      const items: string[] = [];
      while (i < lines.length) {
        const m = ordered
          ? lines[i].match(/^\s{0,3}\d+[.)]\s+(.+)$/)
          : lines[i].match(/^\s{0,3}[-*+]\s+(.+)$/);
        if (!m) break;
        items.push(`<li>${inline(m[1])}</li>`);
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      html.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }

    // 普通段落：连续到下一个块级语法或空行
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    if (buf.length) {
      const text = buf
        .map((l, idx) => {
          if (idx === 0) return inline(l);
          return (/ {2,}$/.test(buf[idx - 1]) ? '<br />' : ' ') + inline(l);
        })
        .join('');
      html.push(`<p>${text}</p>`);
    }
  }

  return html.join('\n');
}
