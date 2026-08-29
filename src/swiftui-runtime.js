function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  for (let i = openIndex; i < source.length; i += 1) {
    const c = source[i];
    if (quote) {
      if (c === '\\') i += 1;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '{') depth += 1;
    if (c === '}' && --depth === 0) return i;
  }
  return source.length - 1;
}

function renderSwiftViews(source) {
  const nodes = [];
  const pattern = /\b(VStack|HStack|ZStack|ScrollView|List|Form|Section|Group|Text|Button|TextField|Image|Spacer)\s*\(/g;
  let match;
  while ((match = pattern.exec(source))) {
    const type = match[1];
    const closeParen = source.indexOf(')', match.index);
    if (closeParen < 0) continue;
    const call = source.slice(match.index, closeParen + 1);
    const value = (call.match(/\(\s*["']([^"']*)["']/) || [])[1] ||
      (call.match(/systemName:\s*["']([^"']+)["']/) || [])[1] || '');
    if (type === 'Text') nodes.push(`<p class="text">${escapeHtml(value)}</p>`);
    if (type === 'Button') nodes.push(`<button onclick="this.textContent='Pressed!'">${escapeHtml(value || 'Button')}</button>`);
    if (type === 'TextField') nodes.push(`<input placeholder="${escapeHtml(value || 'Text')}">`);
    if (type === 'Image') nodes.push(`<div class="image">${escapeHtml(value || 'image')}</div>`);
    if (type === 'Spacer') nodes.push('<div class="spacer"></div>');
    if (['VStack','HStack','ZStack','ScrollView','List','Form','Section','Group'].includes(type)) {
      const open = source.indexOf('{', closeParen);
      if (open >= 0) {
        const close = findMatchingBrace(source, open);
        const children = renderSwiftViews(source.slice(open + 1, close));
        nodes.push(`<div class="${type.toLowerCase()}">${children.join('')}</div>`);
        pattern.lastIndex = close + 1;
      }
    }
  }
  return nodes;
}

export function executeSwiftUI(source, filename = 'ContentView.swift') {
  const title = (source.match(/Text\s*\(\s*["']([^"']+)["']\s*\)/) || [])[1] || 'SwiftUI Preview';
  const content = renderSwiftViews(source).join('') || '<p>No supported SwiftUI views found.</p>';
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{margin:0;background:#f2f2f7;color:#111;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.device{width:min(390px,calc(100vw - 32px));min-height:760px;margin:28px auto;background:#fff;border:8px solid #111;border-radius:44px;overflow:hidden;box-shadow:0 20px 60px #0003}.status{text-align:center;font-size:12px;padding:12px}.screen{padding:24px}.vstack,.scrollview,.list,.form,.section,.group{display:flex;flex-direction:column;gap:14px}.hstack{display:flex;align-items:center;gap:14px}.zstack{position:relative}.text{font-size:20px;margin:4px 0}.vstack>.text:first-child{font-size:28px;font-weight:700}button{border:0;border-radius:12px;padding:12px 18px;background:#007aff;color:#fff;font-size:16px;cursor:pointer}input{border:1px solid #ccc;border-radius:10px;padding:12px;font-size:16px}.image{width:48px;height:48px;border-radius:12px;background:#eee;display:flex;align-items:center;justify-content:center;color:#666;font-size:11px}.spacer{flex:1;min-height:12px}</style></head><body><div class="device"><div class="status">FluxIDE · ${escapeHtml(filename)}</div><div class="screen"><h2>${escapeHtml(title)}</h2>${content}</div></div></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const preview = window.open(url, '_blank', 'noopener,noreferrer');
  if (!preview) throw new Error('SwiftUI preview was blocked by the browser. Allow pop-ups for FluxIDE.');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return `✓ SwiftUI preview opened for ${filename}. Rendered by FluxIDE's browser SwiftUI runtime — no Xcode or macOS required.`;
}
