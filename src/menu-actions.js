/* FluxIDE command bridge. Keeps the macOS-style menu and controls functional without touching the React editor. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clean = (el) => (el?.textContent || '').replace(/[●×]/g, '').trim().toLowerCase();
  const click = (selector, label) => { const el = $$(selector).find((x) => clean(x).includes(label)); if (el) { el.click(); return true; } return false; };
  const activeName = () => clean($('.tab-active'));
  const show = (title, body) => {
    if ($('#fluxide-action-message')) return;
    const box = document.createElement('div'); box.id = 'fluxide-action-message';
    box.innerHTML = `<div><h2>${title}</h2><p>${body}</p><button>OK</button></div>`;
    document.body.appendChild(box); $('.action-ok', box)?.focus(); $('button', box).onclick = () => box.remove();
    box.onclick = (e) => { if (e.target === box) box.remove(); };
  };
  const controls = () => {
    if ($('#fluxide-controls-modal')) return;
    const box = document.createElement('div'); box.id = 'fluxide-controls-modal';
    box.innerHTML = `<div class="fc-card"><h2>FluxIDE Controls</h2><p>Editor controls and keyboard shortcuts.</p><section><b>Keyboard shortcuts</b><span>Ctrl / ⌘ + S — Save</span><span>Ctrl / ⌘ + K — Command Palette</span><span>Ctrl / ⌘ + P — Search files</span><span>Ctrl / ⌘ + R — Rename file</span><span>Ctrl / ⌘ + B — Toggle sidebar</span><span>Esc — Close dialogs</span></section><section><b>Editor</b><span>Code / Blame — file history view</span><span>Symbol Panel — jump to symbols</span><span>Split Editor — side-by-side editor</span><span>Live Server — HTML preview</span></section><button class="action-ok">Close</button></div>`;
    document.body.appendChild(box); $('.action-ok', box).focus(); $('.action-ok', box).onclick = () => box.remove(); box.onclick = (e) => { if (e.target === box) box.remove(); };
  };
  const jumpLine = (n) => { const row = $$('.view-lines .view-line')[n - 1]; if (row) { row.scrollIntoView({ block: 'center', behavior: 'smooth' }); row.dispatchEvent(new MouseEvent('click', { bubbles: true })); } else show('Go to Line', `Line ${n} is outside the visible editor range.`); };
  const actions = {
    'new file': () => click('.actions button,.side-bottom button','new file'),
    'new project': () => click('.actions button,.side-bottom button','new project'),
    'open…': () => click('.side-bottom button','import files'),
    'save': () => click('.actions button,.side-bottom button','save'),
    'export file': () => click('.side-bottom button','export file'),
    'format document': () => click('.toolbar button','format'),
    'problems': () => click('.bottom-tabs button','problems'),
    'terminal': () => click('.bottom-tabs button','terminal'),
    'source control': () => click('.bottom-tabs button,.side-bottom button','source control'),
    'toggle outline': () => click('.outline > div','outline'),
    'command palette': () => click('.actions button','commands'),
    'run': () => click('.actions button','run'),
    'live server': () => click('.actions button','live server'),
    'run without debugging': () => click('.actions button','run'),
    'split editor': () => click('.toolbar button','split'),
    'close tab': () => $('.tab-active button')?.click(),
    'settings': () => click('.side-bottom button','settings'),
    'settings…': () => click('.side-bottom button','settings'),
    'check for updates': () => click('.actions button','updates'),
    'check for updates…': () => click('.actions button','updates'),
    'keyboard shortcuts': controls,
    'fluxide help': controls,
    'about fluxide': controls,
    'go to file': () => { const input = $('.search input'); if (input) { input.focus(); input.select(); } else show('Go to File','The file search is not available yet.'); },
    'go to line': () => { const n = prompt('Go to line', '1'); if (n && /^\d+$/.test(n)) jumpLine(Number(n)); },
    'explorer': () => { const b = $('main button.icon'); if (b) b.click(); else show('Explorer','The Explorer is already visible.'); },
    'undo': () => { document.execCommand('undo'); },
    'redo': () => { document.execCommand('redo'); },
    'cut': () => document.execCommand('cut'),
    'copy': async () => { try { const files = JSON.parse(localStorage.getItem('fluxide-files') || '{}'); await navigator.clipboard.writeText(files[activeName()] || ''); } catch {} },
    'paste': async () => { try { document.execCommand('insertText', false, await navigator.clipboard.readText()); } catch {} },
    'stop': () => show('Run','There is no background process running in the web version.'),
    'new window': () => window.open(location.href, '_blank')
  };
  const install = () => {
    if (!$('#mac-menu') || !$('.monaco-editor')) return false;
    if (!$('#fluxide-menu-bridge-style')) {
      const s = document.createElement('style'); s.id = 'fluxide-menu-bridge-style';
      s.textContent = `#fluxide-xcode-controls{position:fixed;right:14px;bottom:46px;z-index:6000;border:1px solid rgba(255,255,255,.14);background:rgba(35,36,40,.84);color:#fff;border-radius:9px;padding:8px 12px;cursor:pointer;font:12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;backdrop-filter:blur(18px);box-shadow:0 8px 30px rgba(0,0,0,.28)}#fluxide-xcode-controls:hover{background:rgba(65,67,74,.94)}#fluxide-action-message,#fluxide-controls-modal{position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);backdrop-filter:blur(7px)}#fluxide-action-message>div,.fc-card{width:min(520px,calc(100vw - 32px));padding:22px;border:1px solid rgba(255,255,255,.14);border-radius:15px;background:rgba(31,32,36,.97);color:#eee;box-shadow:0 25px 80px rgba(0,0,0,.5);font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.fc-card h2,#fluxide-action-message h2{margin:0 0 5px}.fc-card p,#fluxide-action-message p{color:#aaa}.fc-card section{display:grid;gap:7px;padding:10px 0;border-top:1px solid rgba(255,255,255,.08)}.fc-card section b{font-size:11px;text-transform:uppercase;color:#888}.fc-card section span{padding:5px 7px;border-radius:6px}.fc-card section span:hover{background:rgba(255,255,255,.06)}.action-ok{border:0;border-radius:8px;padding:8px 14px;cursor:pointer;background:#eee;color:#222}.light #fluxide-action-message>div,.light .fc-card{background:#fafafa;color:#222}.light .action-ok{background:#222;color:#fff}`;
      document.head.appendChild(s);
    }
    $$('#mac-menu .menu-dropdown span').forEach((item) => {
      if (item.dataset.fluxideBridge) return;
      item.dataset.fluxideBridge = '1';
      item.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const fn = actions[clean(item)]; if (fn) fn(); else show(item.textContent.trim(), 'This command is not available in the web version yet.'); });
    });
    if (!$('#fluxide-xcode-controls')) { const b=document.createElement('button'); b.id='fluxide-xcode-controls'; b.type='button'; b.textContent='⌘ Controls & Shortcuts'; b.onclick=controls; document.body.appendChild(b); }
    return true;
  };
  const boot = () => { if (install()) return; const o=new MutationObserver(()=>{ if(install()) o.disconnect(); }); o.observe(document.documentElement,{childList:true,subtree:true}); setTimeout(()=>o.disconnect(),30000); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
