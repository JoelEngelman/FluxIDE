const JUDGE0_URL = import.meta.env.VITE_EXECUTION_API_URL || 'https://ce.judge0.com';

let languagesPromise;

function chooseLanguageId(languages, language) {
  const patterns = {
    javascript: /^JavaScript \(/i, typescript: /^TypeScript \(/i, python: /^Python \(3/i,
    java: /^Java \(/i, c: /^C \(/i, cpp: /^C\+\+ \(/i, csharp: /^C# \(/i,
    go: /^Go \(/i, rust: /^Rust \(/i, php: /^PHP \(/i, ruby: /^Ruby \(/i,
    swift: /^Swift \(/i, kotlin: /^Kotlin \(/i, dart: /^Dart \(/i, sql: /^SQL \(/i,
    shell: /^Bash \(/i, lua: /^Lua \(/i, perl: /^Perl \(/i, r: /^R \(/i,
    powershell: /^PowerShell \(/i
  };
  const pattern = patterns[language];
  if (!pattern) return null;
  const matches = languages.filter((item) => pattern.test(item.name));
  return matches.length ? matches.sort((a, b) => b.name.localeCompare(a.name))[0].id : null;
}

async function getLanguages() {
  if (!languagesPromise) {
    languagesPromise = fetch(`${JUDGE0_URL}/languages/`).then((response) => {
      if (!response.ok) throw new Error(`Execution service returned HTTP ${response.status}`);
      return response.json();
    });
  }
  return languagesPromise;
}

async function executeJudge0(language, source) {
  const languages = await getLanguages();
  const languageId = chooseLanguageId(languages, language);
  if (!languageId) throw new Error(`No browser execution runtime is currently available for ${language}.`);
  const response = await fetch(`${JUDGE0_URL}/submissions?wait=true&base64_encoded=false`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language_id: languageId, source_code: source, cpu_time_limit: 3, wall_time_limit: 8, memory_limit: 128000 })
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Execution service returned HTTP ${response.status}${body ? `: ${body}` : ''}`);
  }
  const result = await response.json();
  const output = [result.stdout, result.stderr, result.compile_output, result.message].filter(Boolean).join('');
  return `${output || '(no output)'}\n\n[${result.status?.description || 'Finished'}]${result.time ? ` ${result.time}s` : ''}`;
}

function fluxValue(value, variables) {
  const v = value.trim();
  if (/^"[\s\S]*"$/.test(v) || /^'[^']*'$/.test(v)) return v.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (variables.has(v)) return variables.get(v);
  if (/^[\d\s+\-*/().]+$/.test(v)) return Function(`"use strict"; return (${v})`)();
  return v;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function parseFluxUI(source) {
  const lines = source.replace(/\/\/.*$/gm, '').split('\n').map((line) => line.trim()).filter(Boolean);
  const root = { type: 'root', children: [], background: '#0a0d14', title: 'Flux Preview' };
  const stack = [root];
  let game = null;
  let currentGroup = null;

  for (const line of lines) {
    let match;
    if ((match = line.match(/^ui\s+window\s+["'](.+)["']$/i))) { root.title = match[1]; continue; }
    if ((match = line.match(/^ui\s+background\s+["'](.+)["']$/i))) { root.background = match[1]; continue; }
    if (/^ui\s+card$/i.test(line)) { const node = { type: 'card', children: [] }; stack[stack.length - 1].children.push(node); stack.push(node); continue; }
    if ((match = line.match(/^ui\s+text\s+["']([\s\S]*)["']$/i))) { stack[stack.length - 1].children.push({ type: 'text', value: match[1] }); continue; }
    if ((match = line.match(/^ui\s+button\s+["']([\s\S]*)["']$/i))) { const node = { type: 'button', value: match[1], colour: '#8b5cf6' }; stack[stack.length - 1].children.push(node); stack.push(node); continue; }
    if ((match = line.match(/^colour\s+["'](.+)["']$/i))) { const node = stack[stack.length - 1]; if (node.type === 'button') node.colour = match[1]; continue; }
    if (/^ui\s+done$/i.test(line) || /^done$/i.test(line)) { if (stack.length > 1) stack.pop(); currentGroup = null; continue; }
    if ((match = line.match(/^game\s+["'](.+)["']$/i))) { game = { name: match[1], groups: [] }; continue; }
    if ((match = line.match(/^group\s+["'](.+)["']$/i))) { currentGroup = { name: match[1], items: [] }; if (game) game.groups.push(currentGroup); continue; }
    if (/^[A-Za-z_][\w-]*$/i.test(line) && currentGroup) { currentGroup.items.push(line); continue; }
  }
  return { root, game };
}

function fluxUIHtml(parsed) {
  const render = (node) => {
    if (node.type === 'text') return `<p>${escapeHtml(node.value)}</p>`;
    if (node.type === 'button') return `<button style="background:${escapeHtml(node.colour)}" onclick="this.textContent='Started!'">${escapeHtml(node.value)}</button>`;
    if (node.type === 'card') return `<section class="card">${node.children.map(render).join('')}</section>`;
    return node.children.map(render).join('');
  };
  const game = parsed.game ? `<section class="game"><h2>${escapeHtml(parsed.game.name)}</h2>${parsed.game.groups.map((g) => `<div class="group"><h3>${escapeHtml(g.name)}</h3><div class="items">${g.items.map((x) => `<span>${escapeHtml(x)}</span>`).join('')}</div></div>`).join('')}</section>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(parsed.root.title)}</title><style>body{margin:0;min-height:100vh;background:${escapeHtml(parsed.root.background)};color:#f8f8f2;font:16px system-ui,-apple-system,sans-serif;padding:48px;box-sizing:border-box}main{max-width:900px;margin:auto}h1{font-size:32px}.card,.game{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:24px;margin:18px 0;backdrop-filter:blur(18px)}p{margin:10px 0}button{border:0;color:white;border-radius:12px;padding:11px 18px;margin-top:10px;cursor:pointer;font-weight:600}.group{padding:12px 0;border-top:1px solid rgba(255,255,255,.1)}.items{display:flex;flex-wrap:wrap;gap:8px}.items span{padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.1)}</style></head><body><main><h1>${escapeHtml(parsed.root.title)}</h1>${parsed.root.children.map(render).join('')}${game}</main></body></html>`;
}

function executeFlux(source) {
  const hasUI = /(^|\n)\s*ui\s+(window|background|card|text|button)\b/i.test(source) || /^\s*game\s+/im.test(source);
  if (hasUI) {
    const parsed = parseFluxUI(source);
    const blob = new Blob([fluxUIHtml(parsed)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return `Flux UI preview opened for ${parsed.root.title}.`;
  }

  const body = source.replace(/\/\/.*$/gm, '').replace(/\bfn\s+main\s*\(\s*\)\s*\{([\s\S]*)\}/m, '$1');
  const variables = new Map();
  const output = [];
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim().replace(/;$/, '');
    if (!line) continue;
    const declaration = line.match(/^(?:let|const|make|var)\s+([A-Za-z_][\w]*)\s*=\s*(.+)$/);
    if (declaration) { variables.set(declaration[1], fluxValue(declaration[2], variables)); continue; }
    const print = line.match(/^(?:print|say|write|log)\s*\((.*)\)$/);
    if (print) { output.push(String(fluxValue(print[1], variables))); continue; }
    const plainPrint = line.match(/^(?:print|say|write|log)\s+["']([\s\S]*)["']$/);
    if (plainPrint) { output.push(plainPrint[1]); continue; }
    throw new Error(`Flux interpreter: unsupported statement: ${line}`);
  }
  return output.join('\n') || 'Process finished with no console output.';
}

export async function executeCode(language, source, filename) {
  if (language === 'javascript') {
    const logs = [];
    const oldLog = console.log;
    try { console.log = (...values) => logs.push(values.map(String).join(' ')); new Function(source)(); return logs.join('\n') || 'Process finished with no console output.'; }
    catch (error) { throw new Error(`Runtime error: ${error.message}`); }
    finally { console.log = oldLog; }
  }
  if (language === 'flux') return executeFlux(source);
  if (language === 'html') {
    const blob = new Blob([source], { type: 'text/html' }); const url = URL.createObjectURL(blob); window.open(url, '_blank', 'noopener,noreferrer'); setTimeout(() => URL.revokeObjectURL(url), 60_000); return `Live preview opened for ${filename}.`;
  }
  if (language === 'css') {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>FluxIDE CSS Preview</title><style>${source}</style></head><body><div class="preview">FluxIDE CSS Preview</div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' }); const url = URL.createObjectURL(blob); window.open(url, '_blank', 'noopener,noreferrer'); setTimeout(() => URL.revokeObjectURL(url), 60_000); return 'CSS preview opened in a new tab.';
  }
  if (language === 'json') { JSON.parse(source); return '✓ Valid JSON. Nothing to execute.'; }
  if (['markdown', 'yaml', 'xml', 'dockerfile', 'graphql', 'plaintext'].includes(language)) return `${language} is an editable/preview-oriented file type, not an executable program.`;
  if (language === 'swift' && /(^|\n)\s*(import\s+(SwiftUI|UIKit|AppKit)|@main\b|struct\s+\w+\s*:\s*(View|App)|UIViewController\b)/m.test(source)) {
    throw new Error('🍎 SwiftUI / Apple SDK detected. FluxIDE can edit and syntax-highlight this Swift file, but the browser Swift runner does not include Apple\'s iOS/macOS SDKs. Standard Swift compilation works where supported; SwiftUI/UIKit/AppKit compilation requires macOS + Xcode. The previous "no such module SwiftUI" error came from the standalone Swift compiler lacking Apple\'s SDK.');
  }
  return executeJudge0(language, source);
}
