(() => {
  'use strict';

  /*
   * FluxIDE preview controller.
   * Device dimensions below are physical aspect ratios, not arbitrary preview boxes.
   * The preview scales the complete device to the available stage so the top/bottom
   * can never be clipped.
   */
  const devices = {
    iphone17: {
      label: 'iPhone 17', kind: 'phone', width: 71.5, height: 149.6,
      radius: 16.8, bezel: 2.2, island: true, islandWidth: 31.5, islandHeight: 8.2,
      home: false
    },
    iphone17pro: {
      label: 'iPhone 17 Pro', kind: 'phone', width: 71.9, height: 150.0,
      radius: 17.0, bezel: 2.15, island: true, islandWidth: 31.5, islandHeight: 8.2,
      home: false
    },
    iphone17promax: {
      label: 'iPhone 17 Pro Max', kind: 'phone', width: 78.0, height: 163.4,
      radius: 18.2, bezel: 2.15, island: true, islandWidth: 31.5, islandHeight: 8.2,
      home: false
    },
    ipadmini: {
      label: 'iPad mini', kind: 'ipad', width: 134.8, height: 195.4,
      radius: 8.0, bezel: 5.8, camera: true
    },
    ipadpro11: {
      label: 'iPad Pro 11-inch', kind: 'ipad', width: 177.5, height: 249.7,
      radius: 6.4, bezel: 5.3, camera: true
    },
    ipadpro13: {
      label: 'iPad Pro 13-inch', kind: 'ipad', width: 215.5, height: 281.6,
      radius: 6.8, bezel: 5.3, camera: true
    },
    fullscreen: { label: 'Full Screen', kind: 'full' }
  };

  const visual = new Set(['html', 'css', 'javascript', 'flux', 'swift']);
  let liveTimer = null;
  let lastSignature = '';
  let selectedDevice = localStorage.getItem('fluxide-preview-device') || 'iphone17pro';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

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

  function extensionLanguage(name) {
    const ext = name.toLowerCase().split('.').pop();
    return ({ html: 'html', htm: 'html', css: 'css', js: 'javascript', jsx: 'javascript',
      ts: 'typescript', tsx: 'typescript', flux: 'flux', swift: 'swift' })[ext] || 'plaintext';
  }

  function language() {
    return (document.querySelector('.toolbar select')?.value || '').toLowerCase() || extensionLanguage(activeFile());
  }

  function monacoCode() {
    const models = window.monaco?.editor?.getModels?.() || [];
    const file = activeFile().toLowerCase();
    const match = models.find(model => {
      const path = String(model.uri?.path || '').toLowerCase();
      return path.endsWith('/' + file) || path.endsWith(file);
    });
    return (match || models[models.length - 1])?.getValue?.() || '';
  }

  function storedFiles() {
    try { return JSON.parse(localStorage.getItem('fluxide-files') || '{}'); } catch { return {}; }
  }

  function source() {
    const code = monacoCode();
    if (code) return code;
    return storedFiles()[activeFile()] ?? '';
  }

  function collectFiles() { return storedFiles(); }

  function fluxToHtml(src) {
    const bg = (src.match(/^\s*ui\s+background\s+["']([^"']+)["']/m) || [])[1] || '#0a0d14';
    const title = (src.match(/^\s*ui\s+window\s+["']([^"']+)["']/m) || [])[1] || 'Flux App';
    const output = [];
    let cardDepth = 0;
    for (const line of src.split(/\r?\n/)) {
      const t = line.trim(); let m;
      if ((m = t.match(/^ui\s+text\s+["'](.+?)["']$/))) output.push(`<div class="fx-text">${esc(m[1])}</div>`);
      else if ((m = t.match(/^ui\s+button\s+["'](.+?)["']/))) output.push(`<button class="fx-button" onclick="this.textContent='Pressed!'">${esc(m[1])}</button>`);
      else if ((m = t.match(/^ui\s+input\s+["'](.+?)["']/))) output.push(`<input class="fx-input" placeholder="${esc(m[1])}">`);
      else if ((m = t.match(/^ui\s+image\s+["'](.+?)["']/))) output.push(`<div class="fx-image">${esc(m[1])}</div>`);
      else if (/^ui\s+card\s*$/.test(t)) { output.push('<section class="fx-card">'); cardDepth++; }
      else if (/^done\s*$/.test(t) && cardDepth) { output.push('</section>'); cardDepth--; }
    }
    while (cardDepth-- > 0) output.push('</section>');
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
    return `<main class="swift-app"><div class="swift-title">${esc(title)}</div>${body || '<div class="empty">No supported SwiftUI views found.</div>'}</main>`;
  }

  function renderDocument(code, lang) {
    if (lang === 'flux') return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles()}</style></head><body>${fluxToHtml(code)}</body></html>`;
    if (lang === 'swift') return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles()}</style></head><body>${swiftToHtml(code)}</body></html>`;
    if (lang === 'html') {
      let html = code;
      for (const [name, content] of Object.entries(collectFiles())) {
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
    return `*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif}body{min-height:100vh;background:#fff;color:#111}.fx-app{min-height:100vh;padding:28px;background:var(--fx-bg,#0a0d14);color:#fff}.fx-app header{font-size:28px;font-weight:750;margin-bottom:20px}.fx-content{display:flex;flex-direction:column;gap:12px;max-width:720px;margin:auto}.fx-card{display:flex;flex-direction:column;gap:12px;padding:20px;border-radius:20px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(20px)}.fx-text{font-size:19px;line-height:1.4}.fx-button,.swift-button{border:0;border-radius:14px;padding:13px 18px;background:#007aff;color:#fff;font-size:17px;font-weight:600;cursor:pointer}.fx-input,.swift-input{border:1px solid #c8c8cc;border-radius:12px;padding:13px 14px;font-size:17px}.fx-image,.swift-image{padding:14px;border-radius:14px;background:#fff1}.swift-app{min-height:100vh;padding:70px 24px 34px;background:#f2f2f7;display:flex;flex-direction:column;gap:14px}.swift-title{font-size:28px;font-weight:750}.swift-text{font-size:20px;line-height:1.4}.swift-label{font-size:18px;color:#444}.empty{text-align:center;color:#777;padding:40px 10px}`;
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
      #fluxide-integrated-preview .stage{position:relative;min-width:0;min-height:0;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at center,#191b20,#07080a 68%)}
      #fluxide-integrated-preview .device{position:relative;flex:none;overflow:hidden;background:#08090b;box-shadow:0 28px 70px #000c,0 0 0 1px #ffffff18;transform-origin:center center}
      #fluxide-integrated-preview .device.phone{border-radius:calc(var(--device-radius) * 1px);padding:var(--device-bezel)}
      #fluxide-integrated-preview .device.ipad{border-radius:calc(var(--device-radius) * 1px);padding:var(--device-bezel);background:linear-gradient(145deg,#e8e9eb,#6e7277 17%,#111316 18%,#090a0c 82%,#5b6065)}
      #fluxide-integrated-preview .device.phone{background:linear-gradient(145deg,#9ca0a5,#30343a 16%,#090a0d 17%,#050608 83%,#73787d)}
      #fluxide-integrated-preview .screen{position:relative;width:100%;height:100%;overflow:hidden;background:#fff}
      #fluxide-integrated-preview .phone .screen{border-radius:calc((var(--device-radius) - var(--device-bezel)) * 1px)}
      #fluxide-integrated-preview .ipad .screen{border-radius:calc((var(--device-radius) - var(--device-bezel)) * 1px)}
      #fluxide-integrated-preview iframe{display:block;width:100%;height:100%;border:0;background:#fff}
      #fluxide-integrated-preview .island{position:absolute;z-index:4;top:calc(var(--device-bezel) + 2px);left:50%;transform:translateX(-50%);width:var(--island-width);height:var(--island-height);border-radius:999px;background:#050505;box-shadow:inset 0 1px 2px #fff1,0 1px 3px #000;pointer-events:none}
      #fluxide-integrated-preview .island:after{content:"";position:absolute;width:4px;height:4px;border-radius:50%;right:6px;top:50%;transform:translateY(-50%);background:#111;box-shadow:inset 0 0 0 1px #222}
      #fluxide-integrated-preview .camera{position:absolute;z-index:4;top:50%;left:3px;transform:translateY(-50%);width:2px;height:8%;min-height:28px;border-radius:999px;background:#111;box-shadow:inset 0 0 0 1px #333;pointer-events:none}
      #fluxide-integrated-preview .home{display:none}
      #fluxide-integrated-preview .full{width:100%!important;height:100%!important;border-radius:0!important;padding:0!important;background:#050506!important;box-shadow:none}
      #fluxide-integrated-preview .full .screen{border-radius:0}
      #fluxide-integrated-preview .full .island,#fluxide-integrated-preview .full .camera{display:none}
      @media(max-width:900px){#fluxide-integrated-preview .body{grid-template-columns:1fr}#fluxide-integrated-preview .code{display:none}#fluxide-integrated-preview .stage{padding:14px}}
      @media(max-height:650px){#fluxide-integrated-preview .head{height:46px}#fluxide-integrated-preview .stage{padding:10px}}
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
    popup.document.open(); popup.document.write(renderDocument(source(), lang)); popup.document.close();
  }

  function openLive() {
    injectStyles();
    closeLive(false);
    const root = document.createElement('section');
    root.id = 'fluxide-integrated-preview';
    root.innerHTML = `<div class="head"><strong>Live Preview</strong><select id="flux-device">${Object.entries(devices).map(([key,d]) => `<option value="${key}">${d.label}</option>`).join('')}</select><button id="flux-refresh">↻ Refresh</button><button class="close" id="flux-close">× Close</button></div><div class="body"><div class="code"><div class="code-label">LIVE SOURCE</div><pre id="flux-live-source"></pre></div><div class="stage"><div class="device phone" id="flux-device-frame"><div class="screen"><iframe id="flux-live-frame" sandbox="allow-scripts allow-forms allow-modals"></iframe></div><div class="island"></div><div class="camera"></div></div></div></div>`;
    document.body.appendChild(root);
    const select = root.querySelector('#flux-device');
    select.value = devices[selectedDevice] ? selectedDevice : 'iphone17pro';
    select.addEventListener('change', () => { selectedDevice = select.value; localStorage.setItem('fluxide-preview-device', selectedDevice); resizeDevice(); });
    root.querySelector('#flux-refresh').addEventListener('click', updateLive);
    root.querySelector('#flux-close').addEventListener('click', () => closeLive(true));
    resizeDevice(); updateLive();
    clearInterval(liveTimer);
    liveTimer = setInterval(() => {
      if (!document.getElementById('fluxide-integrated-preview')) return;
      const sig = activeFile() + '|' + language() + '|' + source();
      if (sig !== lastSignature) updateLive();
    }, 250);
  }

  function resizeDevice() {
    const root = document.getElementById('fluxide-integrated-preview');
    const stage = root?.querySelector('.stage');
    const frame = root?.querySelector('#flux-device-frame');
    if (!stage || !frame) return;
    const d = devices[selectedDevice] || devices.iphone17pro;
    frame.className = `device ${d.kind}`;
    if (d.kind === 'full') {
      frame.style.width = '100%'; frame.style.height = '100%'; frame.style.removeProperty('--device-radius');
      frame.style.removeProperty('--device-bezel'); frame.style.removeProperty('--island-width'); frame.style.removeProperty('--island-height');
      return;
    }

    // Scale the physical model to BOTH available dimensions. This is the key fix for
    // clipped tops/bottoms on smaller screens and for different laptop aspect ratios.
    const rect = stage.getBoundingClientRect();
    const availableW = Math.max(120, rect.width - 48);
    const availableH = Math.max(160, rect.height - 48);
    const aspect = d.width / d.height;
    const maxW = Math.min(availableW, availableH * aspect);
    const maxH = maxW / aspect;
    const pxPerMm = maxH / d.height;
    frame.style.width = `${maxW}px`;
    frame.style.height = `${maxH}px`;
    frame.style.setProperty('--device-radius', Math.max(10, d.radius * pxPerMm) + '');
    frame.style.setProperty('--device-bezel', Math.max(2, d.bezel * pxPerMm) + 'px');
    frame.style.setProperty('--island-width', Math.max(48, d.islandWidth * pxPerMm) + 'px');
    frame.style.setProperty('--island-height', Math.max(12, d.islandHeight * pxPerMm) + 'px');
    frame.querySelector('.island').style.display = d.island ? '' : 'none';
    frame.querySelector('.camera').style.display = d.camera ? '' : 'none';
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
    event.preventDefault(); event.stopImmediatePropagation(); showChoice();
  }

  function boot() {
    injectStyles();
    document.addEventListener('click', intercept, true);
    window.addEventListener('resize', resizeDevice);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
