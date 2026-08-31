/* FluxIDE macOS menu actions. Delegated, React-safe, and independent of Monaco boot timing. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const normalize = (value) => String(value || '')
    .replace(/[\u2026…]/g, '')
    .replace(/[●×]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const clickText = (selector, text) => {
    const wanted = normalize(text);
    const element = $$(selector).find((node) => normalize(node.textContent) === wanted);
    if (element) {
      element.click();
      return true;
    }
    return false;
  };

  const clickContains = (selector, text) => {
    const wanted = normalize(text);
    const element = $$(selector).find((node) => normalize(node.textContent).includes(wanted));
    if (element) {
      element.click();
      return true;
    }
    return false;
  };

  const activeFile = () => {
    const tab = $('.tab-active');
    return tab ? tab.textContent.replace(/[●×]/g, '').trim() : '';
  };

  function showMessage(title, message) {
    if ($('#fluxide-action-message')) return;

    const overlay = document.createElement('div');
    overlay.id = 'fluxide-action-message';
    overlay.innerHTML = `
      <div class="fluxide-action-card">
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(message)}</p>
        <button type="button" class="fluxide-action-ok">OK</button>
      </div>`;

    document.body.appendChild(overlay);
    $('.fluxide-action-ok', overlay)?.focus();
    $('.fluxide-action-ok', overlay).onclick = () => overlay.remove();
    overlay.onclick = (event) => {
      if (event.target === overlay) overlay.remove();
    };
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character]));
  }

  function controls() {
    if ($('#fluxide-controls-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'fluxide-controls-modal';
    overlay.innerHTML = `
      <div class="fluxide-controls-card">
        <div class="fluxide-controls-title">
          <div>
            <h2>FluxIDE Controls</h2>
            <p>Keyboard shortcuts and editor controls</p>
          </div>
          <button type="button" class="fluxide-controls-close" aria-label="Close">×</button>
        </div>

        <section>
          <h3>Keyboard Shortcuts</h3>
          <div><span>Save</span><kbd>Ctrl / ⌘ + S</kbd></div>
          <div><span>Command Palette</span><kbd>Ctrl / ⌘ + K</kbd></div>
          <div><span>Search Files</span><kbd>Ctrl / ⌘ + P</kbd></div>
          <div><span>Rename File</span><kbd>Ctrl / ⌘ + R</kbd></div>
          <div><span>Toggle Sidebar</span><kbd>Ctrl / ⌘ + B</kbd></div>
          <div><span>Close Dialog</span><kbd>Esc</kbd></div>
        </section>

        <section>
          <h3>FluxIDE</h3>
          <div><span>Code / Blame</span><span>File history view</span></div>
          <div><span>Symbol Panel</span><span>Jump to symbols</span></div>
          <div><span>Split Editor</span><span>Side-by-side editing</span></div>
          <div><span>Live Server</span><span>Live HTML preview</span></div>
        </section>

        <button type="button" class="fluxide-controls-done">Close</button>
      </div>`;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    $('.fluxide-controls-close', overlay).onclick = close;
    $('.fluxide-controls-done', overlay).onclick = close;
    overlay.onclick = (event) => {
      if (event.target === overlay) close();
    };
    $('.fluxide-controls-done', overlay)?.focus();
  }

  function openFileSearch() {
    const input = $('.search input');
    if (input) {
      input.focus();
      input.select();
      return;
    }
    showMessage('Go to File', 'The file search is not available yet.');
  }

  function goToLine() {
    const line = window.prompt('Go to line', '1');
    if (!line) return;

    const number = Number(line);
    if (!Number.isInteger(number) || number < 1) {
      showMessage('Go to Line', 'Please enter a valid line number.');
      return;
    }

    // Monaco exposes its command palette through Ctrl+G.
    const editor = $('.monaco-editor');
    if (!editor) {
      showMessage('Go to Line', 'The code editor is still loading.');
      return;
    }

    editor.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'g',
      code: 'KeyG',
      ctrlKey: true,
      bubbles: true
    }));

    setTimeout(() => {
      const input = $('.quick-input-widget input');
      if (!input) {
        showMessage('Go to Line', `Could not open the editor's line navigator.`);
        return;
      }
      input.focus();
      input.value = String(number);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true
      }));
    }, 100);
  }

  function runAction(name) {
    switch (normalize(name)) {
      case 'about fluxide':
        showMessage('About FluxIDE', 'FluxIDE Web — a web-first developer workspace.');
        return;

      case 'keyboard shortcuts':
      case 'fluxide help':
        controls();
        return;

      case 'new file':
        clickContains('.actions button,.side-bottom button', 'new file');
        return;

      case 'new project':
        clickContains('.actions button,.side-bottom button', 'new project');
        return;

      case 'open':
      case 'open…':
        clickContains('.side-bottom button', 'import files');
        return;

      case 'save':
        clickContains('.actions button', 'save');
        return;

      case 'export file':
        clickContains('.side-bottom button', 'export file');
        return;

      case 'undo':
        document.execCommand('undo');
        return;

      case 'redo':
        document.execCommand('redo');
        return;

      case 'cut':
        document.execCommand('cut');
        return;

      case 'copy':
        document.execCommand('copy');
        return;

      case 'paste':
        document.execCommand('paste');
        return;

      case 'format document':
        clickContains('.toolbar button', 'format');
        return;

      case 'explorer': {
        const sidebarButton = $('.workspace > main') ? $('.icon') : null;
        if (sidebarButton) sidebarButton.click();
        else showMessage('Explorer', 'Explorer controls are not available yet.');
        return;
      }

      case 'problems':
        clickContains('.bottom-tabs button', 'problems');
        return;

      case 'terminal':
        clickContains('.bottom-tabs button', 'terminal');
        return;

      case 'source control':
        clickContains('.bottom-tabs button,.side-bottom button', 'source control');
        return;

      case 'toggle outline':
        clickContains('.outline > div', 'outline');
        return;

      case 'go to file':
        openFileSearch();
        return;

      case 'go to line':
        goToLine();
        return;

      case 'command palette':
        clickContains('.actions button', 'commands');
        return;

      case 'run':
      case 'run without debugging':
        clickContains('.actions button', 'run');
        return;

      case 'live server':
        clickContains('.actions button', 'live server');
        return;

      case 'stop':
        showMessage('Stop', 'There is no background process running in the web version.');
        return;

      case 'new window':
        window.open(window.location.href, '_blank', 'noopener');
        return;

      case 'split editor':
        clickContains('.toolbar button', 'split');
        return;

      case 'close tab':
        $('.tab-active button')?.click();
        return;

      case 'settings':
      case 'settings…':
        clickContains('.side-bottom button', 'settings');
        return;

      case 'check for updates':
      case 'check for updates…':
        clickContains('.actions button', 'updates');
        return;

      default:
        showMessage(name, 'This FluxIDE command is not available in the web version yet.');
    }
  }

  function install() {
    const menu = $('#mac-menu');
    if (!menu || menu.dataset.fluxideActionsInstalled === '1') return;
    menu.dataset.fluxideActionsInstalled = '1';

    menu.addEventListener('click', (event) => {
      const item = event.target.closest('.menu-dropdown span');
      if (!item || !menu.contains(item)) return;

      event.preventDefault();
      event.stopPropagation();
      runAction(item.textContent);
    });

    if (!$('#fluxide-menu-action-style')) {
      const style = document.createElement('style');
      style.id = 'fluxide-menu-action-style';
      style.textContent = `
        #fluxide-action-message,#fluxide-controls-modal{position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.38);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
        .fluxide-action-card,.fluxide-controls-card{width:min(560px,calc(100vw - 32px));box-sizing:border-box;padding:22px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(31,32,36,.97);color:#eee;box-shadow:0 25px 80px rgba(0,0,0,.5);font:13px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif}
        .fluxide-action-card h2{margin:0 0 8px;font-size:20px}.fluxide-action-card p{margin:0 0 18px;color:#aaa;line-height:1.5}.fluxide-action-ok{border:0;border-radius:8px;padding:8px 15px;background:#eee;color:#222;cursor:pointer}
        .fluxide-controls-title{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.fluxide-controls-title h2{margin:0 0 4px;font-size:20px}.fluxide-controls-title p{margin:0 0 14px;color:#999}.fluxide-controls-close{border:0;background:transparent;color:#aaa;font-size:22px;cursor:pointer}.fluxide-controls-card section{border-top:1px solid rgba(255,255,255,.09);padding:13px 0}.fluxide-controls-card h3{margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#888}.fluxide-controls-card section div{display:flex;justify-content:space-between;gap:20px;padding:7px 8px;border-radius:7px}.fluxide-controls-card section div:hover{background:rgba(255,255,255,.06)}.fluxide-controls-card kbd,.fluxide-controls-card section div span:last-child{color:#999;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.fluxide-controls-done{margin-top:5px;border:0;border-radius:8px;padding:8px 15px;background:#eee;color:#222;cursor:pointer}
        .light .fluxide-action-card,.light .fluxide-controls-card{background:rgba(250,250,252,.98);color:#222;border-color:rgba(0,0,0,.1)}.light .fluxide-action-card p,.light .fluxide-controls-title p,.light .fluxide-controls-card kbd,.light .fluxide-controls-card section div span:last-child{color:#777}.light .fluxide-controls-card section div:hover{background:rgba(0,0,0,.05)}.light .fluxide-action-ok,.light .fluxide-controls-done{background:#222;color:#fff}
      `;
      document.head.appendChild(style);
    }
  }

  // Install immediately — the menu exists in index.html before React/Monaco loads.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
