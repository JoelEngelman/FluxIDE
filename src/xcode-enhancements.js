/* FluxIDE GitHub-style code navigation and file information. */
(() => {
  'use strict';

  const ID = 'fluxide-github-editor-ui';

  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  const state = () => {
    try {
      return JSON.parse(localStorage.getItem('fluxide-files') || '{}');
    } catch {
      return {};
    }
  };

  const activeFile = () => {
    const tab = document.querySelector('.tab-active');
    if (!tab) return '';
    return tab.textContent.replace(/[●×]/g, '').trim();
  };

  const text = () => {
    const files = state();
    const name = activeFile();
    return typeof files[name] === 'string' ? files[name] : '';
  };

  const language = (name) => {
    const ext = name.toLowerCase().split('.').pop();
    const map = {
      js: 'JavaScript', jsx: 'JavaScript', ts: 'TypeScript', tsx: 'TypeScript',
      flux: 'Flux', html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS',
      json: 'JSON', py: 'Python', java: 'Java', c: 'C', h: 'C', cpp: 'C++',
      cc: 'C++', cxx: 'C++', cs: 'C#', go: 'Go', rs: 'Rust', php: 'PHP',
      rb: 'Ruby', swift: 'Swift', kt: 'Kotlin', dart: 'Dart', sql: 'SQL',
      sh: 'Shell', bash: 'Shell', md: 'Markdown', yaml: 'YAML', yml: 'YAML',
      xml: 'XML', lua: 'Lua', pl: 'Perl', r: 'R', ps1: 'PowerShell',
      graphql: 'GraphQL', dockerfile: 'Dockerfile', txt: 'Plain Text'
    };
    return map[ext] || 'Plain Text';
  };

  const install = () => {
    if (document.getElementById(ID)) return true;

    const toolbar = document.querySelector('main .toolbar');
    const editors = document.querySelector('main .editors');
    const aside = document.querySelector('aside');
    if (!toolbar || !editors || !aside) return false;

    const style = document.createElement('style');
    style.id = ID;
    style.textContent = `
      .fluxide-github-bar {
        height: 38px;
        min-height: 38px;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 10px;
        box-sizing: border-box;
        border-bottom: 1px solid rgba(255,255,255,.08);
        background: rgba(25,27,32,.94);
        color: rgba(255,255,255,.68);
        font: 12px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;
        user-select: none;
        overflow: hidden;
        backdrop-filter: blur(16px) saturate(140%);
        -webkit-backdrop-filter: blur(16px) saturate(140%);
      }
      .light .fluxide-github-bar {
        background: rgba(248,249,251,.94);
        color: rgba(20,24,30,.68);
        border-color: rgba(0,0,0,.08);
      }
      .fluxide-github-bar button {
        border: 0 !important;
        background: transparent !important;
        color: inherit !important;
        font: inherit;
        padding: 5px 9px;
        border-radius: 6px;
        cursor: pointer;
      }
      .fluxide-github-bar button:hover {
        background: rgba(255,255,255,.08) !important;
        color: #fff !important;
      }
      .light .fluxide-github-bar button:hover {
        background: rgba(0,0,0,.06) !important;
        color: #111 !important;
      }
      .fluxide-github-bar .mode.active {
        background: rgba(255,255,255,.11) !important;
        color: #fff !important;
      }
      .light .fluxide-github-bar .mode.active {
        background: rgba(0,0,0,.08) !important;
        color: #111 !important;
      }
      .fluxide-github-bar .divider {
        width: 1px;
        height: 17px;
        margin: 0 4px;
        background: currentColor;
        opacity: .15;
      }
      .fluxide-github-bar .grow { flex: 1; }
      .fluxide-github-bar .stat {
        white-space: nowrap;
        opacity: .72;
        padding: 0 5px;
      }
      .fluxide-github-bar .file-name {
        max-width: 190px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        opacity: .85;
      }
      .fluxide-github-bar .actions { display: flex; gap: 1px; }

      .fluxide-symbol-panel {
        border-top: 1px solid rgba(255,255,255,.08);
        margin-top: 8px;
      }
      .light .fluxide-symbol-panel { border-color: rgba(0,0,0,.08); }
      .fluxide-symbol-head {
        height: 34px;
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 0 9px;
        cursor: pointer;
        color: rgba(255,255,255,.72);
        font: 11px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;
        letter-spacing: .045em;
      }
      .light .fluxide-symbol-head { color: rgba(20,24,30,.68); }
      .fluxide-symbol-head .chevron { width: 12px; opacity: .55; }
      .fluxide-symbol-list {
        max-height: 220px;
        overflow: auto;
        padding: 0 5px 8px;
      }
      .fluxide-symbol {
        width: 100%;
        display: flex !important;
        align-items: center;
        gap: 7px;
        padding: 5px 7px !important;
        border: 0 !important;
        background: transparent !important;
        color: inherit !important;
        border-radius: 6px;
        cursor: pointer;
        text-align: left;
        font: 12px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;
      }
      .fluxide-symbol:hover {
        background: rgba(255,255,255,.07) !important;
      }
      .light .fluxide-symbol:hover {
        background: rgba(0,0,0,.06) !important;
      }
      .fluxide-symbol .kind {
        width: 16px;
        opacity: .5;
        text-align: center;
      }
      .fluxide-symbol .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fluxide-symbol .line {
        margin-left: auto;
        opacity: .35;
        font-size: 10px;
      }

      .fluxide-blame-view {
        position: absolute;
        inset: 0;
        z-index: 20;
        overflow: auto;
        padding: 12px 14px;
        box-sizing: border-box;
        background: rgba(12,14,18,.985);
        color: rgba(255,255,255,.74);
        font: 12px/21px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
      }
      .light .fluxide-blame-view {
        background: rgba(250,250,252,.985);
        color: rgba(20,24,30,.72);
      }
      .fluxide-blame-row {
        display: grid;
        grid-template-columns: 42px 125px minmax(0,1fr);
        gap: 10px;
        white-space: pre;
      }
      .fluxide-blame-row > span { overflow: hidden; text-overflow: ellipsis; }
      .fluxide-blame-row .ln { text-align: right; opacity: .35; }
      .fluxide-blame-row .who { opacity: .42; }

      @media (max-width: 800px) {
        .fluxide-github-bar .optional,
        .fluxide-github-bar .file-name { display: none; }
        .fluxide-symbol-list { max-height: 150px; }
      }
    `;
    document.head.appendChild(style);

    const bar = document.createElement('div');
    bar.className = 'fluxide-github-bar';
    bar.innerHTML = `
      <button class="mode active" data-mode="code">Code</button>
      <button class="mode" data-mode="blame">Blame</button>
      <span class="divider"></span>
      <span class="file-name" data-info="name">main.js</span>
      <span class="stat" data-info="lines">1 Line</span>
      <span class="stat optional">·</span>
      <span class="stat" data-info="size">0 B</span>
      <span class="stat optional">·</span>
      <span class="stat" data-info="language">JavaScript</span>
      <span class="grow"></span>
      <div class="actions">
        <button data-action="copy">Copy</button>
        <button data-action="save">Save</button>
        <button data-action="format">Format</button>
      </div>
    `;
    toolbar.parentNode.insertBefore(bar, toolbar);

    const symbolPanel = document.createElement('div');
    symbolPanel.className = 'fluxide-symbol-panel';
    symbolPanel.innerHTML = `
      <div class="fluxide-symbol-head">
        <span class="chevron">⌄</span>
        <strong>SYMBOL PANEL</strong>
      </div>
      <div class="fluxide-symbol-list"></div>
    `;

    const outline = aside.querySelector('.outline');
    if (outline) outline.after(symbolPanel);
    else aside.appendChild(symbolPanel);

    let blameView = null;

    const hideBlame = () => {
      if (blameView) {
        blameView.remove();
        blameView = null;
      }
    };

    const showBlame = () => {
      if (blameView) return;
      editors.style.position = editors.style.position || 'relative';
      blameView = document.createElement('div');
      blameView.className = 'fluxide-blame-view';
      const source = text();
      blameView.innerHTML = source.split('\n').map((line, index) => `
        <div class="fluxide-blame-row">
          <span class="ln">${index + 1}</span>
          <span class="who">Local workspace</span>
          <span>${esc(line)}</span>
        </div>
      `).join('') || '<div>No saved content.</div>';
      editors.appendChild(blameView);
    };

    const goToLine = (line) => {
      const editorInput = document.querySelector('.monaco-editor textarea');
      if (!editorInput) return;
      editorInput.focus();
      editorInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'g', code: 'KeyG', ctrlKey: true, bubbles: true
      }));
      setTimeout(() => {
        const input = document.querySelector('.quick-input-widget input');
        if (!input) return;
        input.focus();
        input.value = String(line);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', bubbles: true
        }));
      }, 80);
    };

    const renderSymbols = () => {
      const list = symbolPanel.querySelector('.fluxide-symbol-list');
      const found = [];

      text().split('\n').forEach((line, index) => {
        const trimmed = line.trim();
        let match = trimmed.match(/(?:function|fn|def|func|class|struct|interface|enum)\s+([A-Za-z_$][\w$]*)/);
        let kind = match ? trimmed.split(/\s+/)[0] : '';

        if (!match) {
          match = trimmed.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?:=|:)/);
          kind = match ? 'var' : kind;
        }

        if (!match) {
          match = trimmed.match(/(?:public|private|internal|static|async)?\s*(?:class|struct|interface|enum|protocol|actor)\s+([A-Za-z_$][\w$]*)/);
          kind = match ? 'type' : kind;
        }

        if (match) {
          found.push({ name: match[1], kind: kind || 'symbol', line: index + 1 });
        }
      });

      list.innerHTML = found.length
        ? found.slice(0, 150).map((item) => `
            <button class="fluxide-symbol" data-line="${item.line}">
              <span class="kind">${esc(item.kind.charAt(0).toUpperCase())}</span>
              <span class="name">${esc(item.name)}</span>
              <span class="line">${item.line}</span>
            </button>
          `).join('')
        : '<div style="padding:8px;opacity:.45;font-size:11px">No symbols in this file.</div>';
    };

    const refresh = () => {
      const name = activeFile() || 'Untitled';
      const source = text();
      const lines = source ? source.split('\n').length : 1;
      const bytes = new TextEncoder().encode(source).length;

      bar.querySelector('[data-info="name"]').textContent = name;
      bar.querySelector('[data-info="lines"]').textContent = `${lines} ${lines === 1 ? 'Line' : 'Lines'}`;
      bar.querySelector('[data-info="size"]').textContent = bytes < 1024
        ? `${bytes} B`
        : bytes < 1024 * 1024
          ? `${(bytes / 1024).toFixed(1)} KB`
          : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      bar.querySelector('[data-info="language"]').textContent = language(name);
      renderSymbols();
    };

    bar.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const mode = button.dataset.mode;
      if (mode === 'code') {
        bar.querySelectorAll('.mode').forEach((item) => item.classList.toggle('active', item.dataset.mode === 'code'));
        hideBlame();
        return;
      }

      if (mode === 'blame') {
        bar.querySelectorAll('.mode').forEach((item) => item.classList.toggle('active', item.dataset.mode === 'blame'));
        showBlame();
        return;
      }

      if (button.dataset.action === 'copy') {
        try { await navigator.clipboard.writeText(text()); } catch {}
        return;
      }

      if (button.dataset.action === 'save') {
        const saveButton = [...document.querySelectorAll('.actions button')]
          .find((item) => item.textContent.trim() === 'Save');
        if (saveButton && saveButton !== button) saveButton.click();
        return;
      }

      if (button.dataset.action === 'format') {
        const formatButton = [...document.querySelectorAll('main .toolbar button')]
          .find((item) => item.textContent.trim() === 'Format');
        if (formatButton) formatButton.click();
      }
    });

    symbolPanel.querySelector('.fluxide-symbol-head').addEventListener('click', () => {
      const list = symbolPanel.querySelector('.fluxide-symbol-list');
      list.hidden = !list.hidden;
      symbolPanel.querySelector('.chevron').textContent = list.hidden ? '›' : '⌄';
    });

    symbolPanel.addEventListener('click', (event) => {
      const item = event.target.closest('.fluxide-symbol');
      if (!item) return;
      goToLine(Number(item.dataset.line));
    });

    refresh();
    setInterval(refresh, 700);
    return true;
  };

  const start = () => {
    if (install()) return;
    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 30000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
