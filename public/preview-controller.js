(() => {
  'use strict';

  const devices = {
    iphone17: { label: 'iPhone 17', w: 393, h: 852, r: 56, kind: 'phone' },
    iphone17pro: { label: 'iPhone 17 Pro', w: 402, h: 874, r: 58, kind: 'phone' },
    iphone17promax: { label: 'iPhone 17 Pro Max', w: 440, h: 956, r: 60, kind: 'phone' },
    ipadmini: { label: 'iPad mini', w: 744, h: 1133, r: 30, kind: 'ipad' },
    ipadpro11: { label: 'iPad Pro 11-inch', w: 834, h: 1194, r: 32, kind: 'ipad' },
    ipadpro13: { label: 'iPad Pro 13-inch', w: 1032, h: 1376, r: 34, kind: 'ipad' },
    fullscreen: { label: 'Full Screen', w: 0, h: 0, r: 0, kind: 'full' }
  };
  const visual = new Set(['html', 'css', 'javascript', 'flux', 'swift']);
  let liveTimer = null;
  let lastSignature = '';
  let selectedDevice = localStorage.getItem('fluxide-preview-device') || 'iphone17pro';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function activeFile() {
    const tab = document.querySelector('.tab.tab-active');
    if (tab) {
      const clone = tab.cloneNode(true);
      clone.querySelectorAll('button,strong').forEach(n => n.remove());
      return clone.textContent.trim();
    }
    const file = document.querySelector('.file.active');
    return file ? file.textContent.replace(/●/g, '').trim() : 'main.html';
  }

  function language() {
    return (document.querySelector('.toolbar select')?.value || '').toLowerCase() || extensionLanguage(activeFile());
  }

  function extensionLanguage(name) {
    const ext = name.toLowerCase().split('.').pop();
    return ({ html: 'html', htm: 'html', css: 'css', js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', flux: 'flux', swift: 'swift' })[ext] || 'plaintext';
  }

  function monacoCode() {
    const models = window.monaco?.editor?.getModels?.() || [];
    const file = activeFile().toLowerCase();
    const match = models.find(model => String(model.uri?.path || '').toLowerCase().endsWith('/' + file) || String(model.uri?.path || '').toLowerCase().endsWith(file));
    return (match || models[models.length - 1])?.getValue?.() || '';
  }

  function storedFiles() {
    try { return JSON.parse(localStorage.getItem('fluxide-files') || '{}'); } catch { return {}; }
  }

  function source() {
    const code = monacoCode();
    if (code) return code;
    const files = storedFiles();
    return files[activeFile()] ?? '';
  }

  function collectHtmlFiles() {
    const files = storedFiles();
    return files;
  }

  function fluxToHtml(src) {
    const bg = (src.match(/^\s*ui\s+background\s+["']([^"']+)["']/m) || [])[1] || '#0a0d14';
    const title = (src.match(/^\s*ui\s+window\s+["']([^"']+)["']/m) || [])[1] || 'Flux App';
    const lines = src.split(/\r?\n/);
    const output = [];
    let cardDepth = 0;
    for (const line of lines) {
      const t = line.trim();
      let m;
      if ((m = t.match(/^ui\s+text\s+["'](.+?)["']$/))) output.push(`<div class="fx-text">${esc(m[1])}</div>`);
      else if ((m = t.match(/^ui\s+button\s+["'](.+?)["']/))) output.push(`<button class="fx-button" onclick="this.dataset.pressed='1';this.textContent='Pressed!'">${esc(m[1])}</button>`);
      else if ((m = t.match(/^ui\s+input\s+["'](.+?)["']/))) output.push(`<input class="fx-input" placeholder="${esc(m[1])}">`);
      else if ((m = t.match(/^ui\s+image\s+["'](.+?)["']/))) output.push(`<div class="fx-image">${esc(m[1])}</div>`);
      else if (/^ui\s+card\s*$/.test(t)) { output.push('<section class="fx-card">'); cardDepth++; }
      else if (/^done\s*$/.test(t) && cardDepth) { output.push('</section>'); cardDepth--; }
    }
    while (cardDepth--) output.push('</section>');
    return `<main class="fx-app" style="--fx-bg:${esc(bg)}"><header>${esc(title)}</header><div class="fx-content">${output.join('') || '<div class="fx-text">Flux UI Preview</div>'}</div></main>`;
  }

  function swiftToHtml(src) {
    const text = [...src.matchAll(/\bText\s*\(\s*["']([^"']+)["']/g)].map(m => m[1]);
    const labels = [...src.matchAll(/\bLabel\s*\(\s*["']([^"']+)["']/g)].map(m => m[1]);
    const buttons = [...src.matchAll(/\bButton\s*\(\s*["']([^"']+)["']/g)].map(m => m[1]);
    const fields = [...src.matchAll(/\bTextField\s*\(\s*["']([^"']+)["']/g)].map(m => m[1]);
    const images = [...src.matchAll(/\bImage\s*\(\s*(?:systemName:\s*)?["']([^"']+)["']/g)].map(m => m[1]);
    const title = (src.match(/\b(?:navigationTitle|Text)\s*\(\s*["']([^"']+)["']/) || [])[1] || 'SwiftUI Preview';
    let body = '';
    text.forEach(t => body += `<div class="swift-text">${esc(t)}</div>`);
    labels.forEach(t => body += `<div class="swift-label">${esc(t)}</div>`);
    buttons.forEach(t => body += `<button class="swift-button" onclick="this.textContent='Pressed!'">${esc(t)}</button>`);
    fields.forEach(t => body += `<input class="swift-input" placeholder="${esc(t)}">`);
    images.forEach(t => body += `<div class="swift-image">◈ ${esc(t.replace(/[-_]/g, ' '))}</div>`);
    const horizontal = /\bHStack\b/.test(src) && !/\bVStack\b/.test(src);
    return `<main class="swift-app ${horizontal ? 'horizontal' : ''}"><div class="swift-title">${esc(title)}</div>${body || '<div class="empty">No supported SwiftUI views found.</div>'}</main>`;
  }

  function renderDocument(code, lang) {
    if (lang === 'flux') return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles()}</style></head><body>${fluxToHtml(code)}</body></html>`;
    if (lang === 'swift') return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles()}</style></head><body>${swiftToHtml(code)}</body></html>`;
    if (lang === 'html') {
      let html = code;
      for (const [name, content] of Object.entries(collectHtmlFiles())) {
        if (/\.css$/i.test(name)) html = html.replace(new RegExp(`<link[^>]+href=["']${escapeRegExp(name)}["'][^>]*>`, 'gi'), `<style>${content}</style>`);
        if (/\.(js|jsx)$/i.test(name)) html = html.replace(new RegExp(`<script[^>]+src=["']${escapeRegExp(name)}["'][^>]*><\\/script>`, 'gi'), `<script>${content}<\\/script>`);
      }
      return html;
    }
    if (lang === 'javascript') return `<!doctype html><html><body><script>${code.replace(/<\/script>/gi, '<\\/script>')}</script></body></html>`;
    return `<!doctype html><html><body><pre>Preview is not available for ${esc(lang)}.</pre></body></html>`;
  }

  function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function styles() {
    return `*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif}body{min-height:100vh;background:#fff;color:#111}.fx-app{min-height:100vh;padding:28px;background:var(--fx-bg,#0a0d14);color:#fff}.fx-app header{font-size:28px;font-weight:750;margin-bottom:20px}.fx-content{display:flex;flex-direction:column;gap:12px;max-width:720px;margin:auto}.fx-card{display:flex;flex-direction:column;gap:12px;padding:20px;border-radius:20px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(20px)}.fx-text{font-size:19px;line-height:1.4}.fx-button,.swift-button{border:0;border-radius:14px;padding:13px 18px;background:#007aff;color:#fff;font-size:17px;font-weight:600;cursor:pointer}.fx-input,.swift-input{border:1px solid #c8c8cc;border-radius:12px;padding:13px 14px;font-size:17px}.fx-image,.swift-image{padding:14px;border-radius:14px;background:#fff1;color:inherit}.swift-app{min-height:100vh;padding:78px 24px 36px;background:#f2f2f7;display:flex;flex-direction:column;gap:14px}.swift-app.horizontal{flex-direction:row;align-items:center;overflow:auto}.swift-title{font-size:28px;font-weight:750;margin-bottom:4px}.swift-text{font-size:20px;line-height:1.4}.swift-label{font-size:18px;color:#444}.empty{text-align:center;color:#777;padding:40px 10px}`;
  }

  function injectStyles() {
    if (document.getElementById('fluxide-preview-authoritative-css')) return;
    const style = document.createElement('style');
    style.id = 'fluxide-preview-authoritative-css';
    style.textContent = `
      #flux-preview-choice{position:fixed;inset:0;z-index:20000;display:grid;place-items:center;background:rgba(0,0,0,.62);backdrop-filter:blur(12px);padding:20px}
      #flux-preview-choice .box{width:min(500px,100%);padding:26px;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:#17181c;color:#fff;box-shadow:0 30px 100px #000b}
      #flux-preview-choice h2{margin:0 0 7px;font-size:23px}#flux-preview-choice p{margin:0 0 20px;color:#a9abb3}
      #flux-preview-choice button{display:block;width:100%;padding:15px;margin:9px 0;border:1px solid #3a3c44;border-radius:14px;background:#24262b;color:#fff;text-align:left;font-weight:650;font-size:15px;cursor:pointer}
      #flux-preview-choice button:hover{background:#303239}#flux-preview-choice small{display:block;margin-top:4px;color:#999;font-weight:400}
      #fluxide-integrated-preview{position:fixed;inset:0;z-index:19000;background:#07080a;color:#fff;display:flex;flex-direction:column}
      #fluxide-integrated-preview .head{height:52px;flex:none;display:flex;align-items:center;gap:8px;padding:7px 12px;background:rgba(19,20,24,.94);border-bottom:1px solid #292b31;backdrop-filter:blur(18px)}
      #fluxide-integrated-preview .head strong{margin-right:8px}#fluxide-integrated-preview .head select,#fluxide-integrated-preview .head button{border:1px solid #383a43;background:#22242a;color:#fff;border-radius:9px;padding:7px 10px}
      #fluxide-integrated-preview .head .close{margin-left:auto}#fluxide-integrated-preview .body{flex:1;min-height:0;display:grid;grid-template-columns:48% 52%}
      #fluxide-integrated-preview .code{min-width:0;border-right:1px solid #292b31;background:#0d0e11;overflow:hidden;display:flex;flex-direction:column}
      #fluxide-integrated-preview .code-label{padding:9px 12px;color:#aeb0b8;font-size:12px;border-bottom:1px solid #292b31}
      #fluxide-integrated-preview .code pre{margin:0;padding:16px;overflow:auto;white-space:pre-wrap;font:13px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;color:#ddd}
      #fluxide-integrated-preview .stage{min-width:0;overflow:auto;display:flex;align-items:center;justify-content:center;padding:28px;background:radial-gradient(circle at center,#191b20,#07080a 68%)}
      #fluxide-integrated-preview .device{position:relative;overflow:hidden;flex:none;background:linear-gradient(145deg,#eef0f2,#5d6268 18%,#111317 20%,#08090b 80%,#53585e);box-shadow:0 30px 75px #000b,inset 0 0 0 1px #ffffff55;transition:width .2s,height .2s,border-radius .2s}
      #fluxide-integrated-preview .device.phone{border-radius:56px;padding:7px}.device.phone iframe{border-radius:49px}
      #fluxide-integrated-preview .device.ipad{border-radius:30px;padding:7px}.device.ipad iframe{border-radius:23px}
      #fluxide-integrated-preview .device.full{width:100%!important;height:100%!important;border-radius:0;padding:0;background:#050506;box-shadow:none}
      #fluxide-integrated-preview iframe{display:block;width:100%;height:100%;border:0;background:#fff}
      #fluxide-integrated-preview .island{position:absolute;z-index:3;top:11px;left:50%;transform:translateX(-50%);width:104px;height:30px;border-radius:18px;background:#050505;box-shadow:inset 0 1px 2px #fff1;pointer-events:none}
      #fluxide-integrated-preview .home{position:absolute;z-index:3;bottom:9px;left:50%;transform:translateX(-50%);width:134px;height:5px;border-radius:99px;background:#111;pointer-events:none}
      #fluxide-integrated-preview .full .island,#fluxide-integrated-preview .full .home{display:none}
      @media(max-width:900px){#fluxide-integrated-preview .body{grid-template-columns:1fr}#fluxide-integrated-preview .code{display:none}}
    `;
    document.head.appendChild(style);
  }

  function showChoice() {
    injectStyles();
    document.getElementById('flux-preview-choice')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'flux-preview-choice';
    overlay.innerHTML = `<div class="box"><h2>How do you want to preview this?</h2><p>Choose a one-off preview or a live preview that updates while you edit.</p><button data-action="view">View / Preview<small>Open the current result in a new tab.</small></button><button data-action="live">Live Preview<small>Open an interactive preview inside FluxIDE and keep it synced to the editor.</small></button><button data-action="cancel">Cancel</button></div>`;
    overlay.addEventListener('click', event => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      overlay.remove();
      if (action === 'view') openView();
      if (action === 'live') openLive();
    });
    document.body.appendChild(overlay);
  }

  function openView() {
    const lang = language();
    if (!visual.has(lang)) return;
    const popup = window.open('', '_blank');
    if (!popup) { alert('Allow pop-ups for FluxIDE to use View / Preview.'); return; }
    popup.document.open();
    popup.document.write(renderDocument(source(), lang));
    popup.document.close();
  }

  function openLive() {
    injectStyles();
    closeLive(false);
    const root = document.createElement('section');
    root.id = 'fluxide-integrated-preview';
    root.innerHTML = `<div class="head"><strong>Live Preview</strong><select id="flux-device">${Object.entries(devices).map(([key,d]) => `<option value="${key}">${d.label}</option>`).join('')}</select><button id="flux-refresh">↻ Refresh</button><button class="close" id="flux-close">× Close</button></div><div class="body"><div class="code"><div class="code-label">LIVE SOURCE</div><pre id="flux-live-source"></pre></div><div class="stage"><div class="device phone" id="flux-device-frame"><div class="island"></div><iframe id="flux-live-frame" sandbox="allow-scripts allow-forms allow-modals"></iframe><div class="home"></div></div></div></div>`;
    document.body.appendChild(root);
    const select = root.querySelector('#flux-device');
    select.value = devices[selectedDevice] ? selectedDevice : 'iphone17pro';
    select.addEventListener('change', () => { selectedDevice = select.value; localStorage.setItem('fluxide-preview-device', selectedDevice); resizeDevice(); });
    root.querySelector('#flux-refresh').addEventListener('click', updateLive);
    root.querySelector('#flux-close').addEventListener('click', () => closeLive(true));
    resizeDevice();
    updateLive();
    clearInterval(liveTimer);
    liveTimer = setInterval(() => {
      if (!document.getElementById('fluxide-integrated-preview')) return;
      const sig = activeFile() + '|' + language() + '|' + source();
      if (sig !== lastSignature) updateLive();
    }, 300);
  }

  function resizeDevice() {
    const root = document.getElementById('fluxide-integrated-preview');
    const frame = root?.querySelector('#flux-device-frame');
    if (!frame) return;
    const d = devices[selectedDevice];
    frame.className = `device ${d.kind}`;
    if (d.kind === 'full') { frame.style.width = '100%'; frame.style.height = '100%'; }
    else { frame.style.width = d.w + 'px'; frame.style.height = d.h + 'px'; frame.style.borderRadius = d.r + 'px'; }
  }

  function updateLive() {
    const root = document.getElementById('fluxide-integrated-preview');
    const frame = root?.querySelector('#flux-live-frame');
    if (!root || !frame) return;
    const code = source();
    const lang = language();
    root.querySelector('#flux-live-source').textContent = code;
    frame.srcdoc = renderDocument(code, lang);
    lastSignature = activeFile() + '|' + lang + '|' + code;
    resizeDevice();
  }

  function closeLive(removeRoot = true) {
    clearInterval(liveTimer); liveTimer = null;
    if (removeRoot) document.getElementById('fluxide-integrated-preview')?.remove();
  }

  function intercept(event) {
    const button = event.target.closest?.('button');
    if (!button || button.closest('#flux-preview-choice') || button.closest('#fluxide-integrated-preview')) return;
    const text = button.textContent.trim().toLowerCase();
    if (!text.includes('run') && !text.includes('live server')) return;
    const lang = language();
    if (!visual.has(lang)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showChoice();
  }

  function boot() {
    injectStyles();
    document.addEventListener('click', intercept, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
