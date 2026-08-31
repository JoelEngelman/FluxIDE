/* FluxIDE GitHub/Xcode editor chrome. Dependency-free and resilient to React re-renders. */
(() => {
  'use strict';

  const BAR_ID = 'fluxide-github-editor-bar';
  const PANEL_ID = 'fluxide-symbol-panel';
  const STYLE_ID = 'fluxide-github-editor-style';

  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const getFiles = () => {
    try { return JSON.parse(localStorage.getItem('fluxide-files') || '{}'); }
    catch { return {}; }
  };

  const getActiveFile = () => {
    const tab = document.querySelector('main .tab-active');
    if (!tab) return 'Untitled';
    return (tab.textContent || '').replace(/[●×]/g, '').trim() || 'Untitled';
  };

  const getSavedText = () => {
    const files = getFiles();
    const name = getActiveFile();
    return typeof files[name] === 'string' ? files[name] : '';
  };

  const getLanguage = (name) => {
    const ext = name.toLowerCase() === 'dockerfile' ? 'dockerfile' : name.toLowerCase().split('.').pop();
    const map = {
      js:'JavaScript', jsx:'JavaScript', ts:'TypeScript', tsx:'TypeScript', flux:'Flux',
      html:'HTML', htm:'HTML', css:'CSS', scss:'SCSS', json:'JSON', py:'Python',
      java:'Java', c:'C', h:'C', cpp:'C++', cc:'C++', cxx:'C++', cs:'C#', go:'Go',
      rs:'Rust', php:'PHP', rb:'Ruby', swift:'Swift', kt:'Kotlin', dart:'Dart', sql:'SQL',
      sh:'Shell', bash:'Shell', md:'Markdown', yaml:'YAML', yml:'YAML', xml:'XML',
      lua:'Lua', pl:'Perl', r:'R', ps1:'PowerShell', graphql:'GraphQL',
      dockerfile:'Dockerfile', txt:'Plain Text'
    };
    return map[ext] || 'Plain Text';
  };

  const addStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${BAR_ID} {
        height: 38px !important;
        min-height: 38px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        gap: 3px !important;
        padding: 0 10px !important;
        overflow: hidden !important;
        position: relative !important;
        z-index: 5 !important;
        background: rgba(24,26,31,.97) !important;
        border-bottom: 1px solid rgba(255,255,255,.10) !important;
        color: rgba(255,255,255,.72) !important;
        font: 12px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif !important;
        user-select: none !important;
      }
      .light #${BAR_ID} {
        background: rgba(248,249,251,.97) !important;
        border-bottom-color: rgba(0,0,0,.09) !important;
        color: rgba(20,24,30,.70) !important;
      }
      #${BAR_ID} button {
        appearance: none !important;
        border: 0 !important;
        background: transparent !important;
        color: inherit !important;
        font: inherit !important;
        padding: 5px 9px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        flex: 0 0 auto !important;
      }
      #${BAR_ID} button:hover { background: rgba(255,255,255,.09) !important; color: #fff !important; }
      .light #${BAR_ID} button:hover { background: rgba(0,0,0,.06) !important; color: #111 !important; }
      #${BAR_ID} .mode.active { background: rgba(255,255,255,.12) !important; color: #fff !important; }
      .light #${BAR_ID} .mode.active { background: rgba(0,0,0,.08) !important; color: #111 !important; }
      #${BAR_ID} .divider { width:1px !important; height:17px !important; background:currentColor !important; opacity:.16 !important; margin:0 4px !important; }
      #${BAR_ID} .grow { flex:1 1 auto !important; }
      #${BAR_ID} .stat { white-space:nowrap !important; opacity:.72 !important; padding:0 5px !important; }
      #${BAR_ID} .file-name { max-width:180px !important; overflow:hidden !important; text-overflow:ellipsis !important; white-space:nowrap !important; opacity:.9 !important; }
      #${BAR_ID} .actions { display:flex !important; gap:1px !important; }

      #${PANEL_ID} { border-top:1px solid rgba(255,255,255,.08) !important; margin-top:8px !important; }
      .light #${PANEL_ID} { border-top-color:rgba(0,0,0,.08) !important; }
      #${PANEL_ID} .symbol-head { height:34px !important; display:flex !important; align-items:center !important; gap:7px !important; padding:0 9px !important; cursor:pointer !important; color:rgba(255,255,255,.72) !important; font:11px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif !important; letter-spacing:.045em !important; }
      .light #${PANEL_ID} .symbol-head { color:rgba(20,24,30,.68) !important; }
      #${PANEL_ID} .symbol-list { max-height:210px !important; overflow:auto !important; padding:0 5px 8px !important; }
      #${PANEL_ID} .symbol-item { width:100% !important; display:flex !important; align-items:center !important; gap:7px !important; box-sizing:border-box !important; padding:5px 7px !important; border:0 !important; background:transparent !important; color:inherit !important; border-radius:6px !important; cursor:pointer !important; text-align:left !important; font:12px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif !important; }
      #${PANEL_ID} .symbol-item:hover { background:rgba(255,255,255,.07) !important; }
      .light #${PANEL_ID} .symbol-item:hover { background:rgba(0,0,0,.06) !important; }
      #${PANEL_ID} .kind { width:16px !important; opacity:.55 !important; text-align:center !important; }
      #${PANEL_ID} .name { overflow:hidden !important; text-overflow:ellipsis !important; white-space:nowrap !important; }
      #${PANEL_ID} .line { margin-left:auto !important; opacity:.35 !important; font-size:10px !important; }

      #fluxide-blame-view { position:absolute !important; inset:0 !important; z-index:100 !important; overflow:auto !important; padding:12px 14px !important; box-sizing:border-box !important; background:#111318 !important; color:rgba(255,255,255,.76) !important; font:12px/21px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace !important; }
      .light #fluxide-blame-view { background:#fafafd !important; color:rgba(20,24,30,.74) !important; }
      .blame-row { display:grid !important; grid-template-columns:42px 135px minmax(0,1fr) !important; gap:10px !important; white-space:pre !important; }
      .blame-row .ln { text-align:right !important; opacity:.35 !important; }
      .blame-row .who { opacity:.42 !important; }

      @media(max-width:800px) {
        #${BAR_ID} .optional, #${BAR_ID} .file-name { display:none !important; }
        #${PANEL_ID} .symbol-list { max-height:150px !important; }
      }
    `;
    document.head.appendChild(style);
  };

  const jumpToLine = (line) => {
    const textarea = document.querySelector('main .monaco-editor textarea');
    if (!textarea) return;
    textarea.focus();
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key:'g', code:'KeyG', ctrlKey:true, bubbles:true }));
    setTimeout(() => {
      const input = document.querySelector('.quick-input-widget input');
      if (!input) return;
      input.focus();
      input.value = String(line);
      input.dispatchEvent(new Event('input', { bubbles:true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', code:'Enter', bubbles:true }));
    }, 100);
  };

  const renderSymbols = (panel) => {
    const list = panel.querySelector('.symbol-list');
    const found = [];
    getSavedText().split('\n').forEach((line, index) => {
      const t = line.trim();
      let m = t.match(/(?:function|fn|def|func|class|struct|interface|enum|protocol|actor)\s+([A-Za-z_$][\w$]*)/);
      let kind = m ? t.match(/(?:function|fn|def|func|class|struct|interface|enum|protocol|actor)/)?.[0] : '';
      if (!m) {
        m = t.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?:=|:)/);
        kind = m ? 'var' : kind;
      }
      if (m) found.push({ name:m[1], kind:kind || 'symbol', line:index + 1 });
    });
    list.innerHTML = found.length
      ? found.slice(0,150).map((s) => `<button type="button" class="symbol-item" data-line="${s.line}"><span class="kind">${esc(s.kind.charAt(0).toUpperCase())}</span><span class="name">${esc(s.name)}</span><span class="line">${s.line}</span></button>`).join('')
      : '<div style="padding:8px;opacity:.45;font-size:11px">No symbols in this file.</div>';
  };

  const install = () => {
    const toolbar = document.querySelector('main .toolbar');
    const editors = document.querySelector('main .editors');
    const aside = document.querySelector('aside');
    if (!toolbar || !editors || !aside) return false;

    addStyles();

    let bar = document.getElementById(BAR_ID);
    if (!bar || !bar.isConnected) {
      bar = document.createElement('div');
      bar.id = BAR_ID;
      bar.innerHTML = `
        <button type="button" class="mode active" data-mode="code">Code</button>
        <button type="button" class="mode" data-mode="blame">Blame</button>
        <span class="divider"></span>
        <span class="file-name" data-info="name">Untitled</span>
        <span class="stat" data-info="lines">1 Line</span>
        <span class="stat optional">·</span>
        <span class="stat" data-info="size">0 B</span>
        <span class="stat optional">·</span>
        <span class="stat" data-info="language">Plain Text</span>
        <span class="grow"></span>
        <div class="actions">
          <button type="button" data-action="copy">Copy</button>
          <button type="button" data-action="save">Save</button>
          <button type="button" data-action="format">Format</button>
        </div>`;
      toolbar.parentNode.insertBefore(bar, toolbar);

      bar.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.dataset.mode === 'code') {
          bar.querySelectorAll('.mode').forEach((b) => b.classList.toggle('active', b.dataset.mode === 'code'));
          document.getElementById('fluxide-blame-view')?.remove();
          return;
        }
        if (button.dataset.mode === 'blame') {
          bar.querySelectorAll('.mode').forEach((b) => b.classList.toggle('active', b.dataset.mode === 'blame'));
          document.getElementById('fluxide-blame-view')?.remove();
          editors.style.position = editors.style.position || 'relative';
          const view = document.createElement('div');
          view.id = 'fluxide-blame-view';
          const source = getSavedText();
          view.innerHTML = source.split('\n').map((line, i) => `<div class="blame-row"><span class="ln">${i + 1}</span><span class="who">Local workspace</span><span>${esc(line)}</span></div>`).join('') || '<div>No saved content.</div>';
          editors.appendChild(view);
          return;
        }
        if (button.dataset.action === 'copy') {
          try { await navigator.clipboard.writeText(getSavedText()); } catch {}
          return;
        }
        if (button.dataset.action === 'save') {
          const save = [...document.querySelectorAll('main .actions > button')].find((b) => (b.textContent || '').trim() === 'Save');
          if (save) save.click();
          return;
        }
        if (button.dataset.action === 'format') {
          const format = [...document.querySelectorAll('main .toolbar button')].find((b) => (b.textContent || '').trim() === 'Format');
          if (format) format.click();
        }
      });
    }

    let panel = document.getElementById(PANEL_ID);
    if (!panel || !panel.isConnected) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      panel.innerHTML = '<div class="symbol-head"><span class="chevron">⌄</span><strong>SYMBOL PANEL</strong></div><div class="symbol-list"></div>';
      const outline = aside.querySelector('.outline');
      if (outline) outline.after(panel); else aside.appendChild(panel);
      panel.querySelector('.symbol-head').addEventListener('click', () => {
        const list = panel.querySelector('.symbol-list');
        list.hidden = !list.hidden;
        panel.querySelector('.chevron').textContent = list.hidden ? '›' : '⌄';
      });
      panel.addEventListener('click', (event) => {
        const item = event.target.closest('.symbol-item');
        if (item) jumpToLine(Number(item.dataset.line));
      });
    }

    const name = getActiveFile();
    const source = getSavedText();
    const lines = source ? source.split('\n').length : 1;
    const bytes = new TextEncoder().encode(source).length;
    bar.querySelector('[data-info="name"]').textContent = name;
    bar.querySelector('[data-info="lines"]').textContent = `${lines} ${lines === 1 ? 'Line' : 'Lines'}`;
    bar.querySelector('[data-info="size"]').textContent = bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
    bar.querySelector('[data-info="language"]').textContent = getLanguage(name);
    renderSymbols(panel);
    return true;
  };

  const start = () => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (install() || attempts > 120) clearInterval(timer);
    }, 250);

    const observer = new MutationObserver(() => install());
    observer.observe(document.documentElement, { childList:true, subtree:true });
    setTimeout(() => observer.disconnect(), 60000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
