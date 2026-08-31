/* FluxIDE Xcode-style enhancements. Safe, dependency-free, and waits for React/Monaco. */
(() => {
  'use strict';
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getState = () => { try { return JSON.parse(localStorage.getItem('fluxide-files') || '{}'); } catch { return {}; } };
  const getActiveFile = () => { const tab=document.querySelector('.tab-active'); return tab ? tab.textContent.replace(/●|×/g,'').trim() : ''; };
  const getText = () => { const state=getState(), name=getActiveFile(); return typeof state[name]==='string' ? state[name] : ''; };

  const install = () => {
    if (document.getElementById('fluxide-xcode-enhancements')) return true;
    const toolbar=document.querySelector('main .toolbar'), editors=document.querySelector('main .editors'), aside=document.querySelector('aside');
    if (!toolbar || !editors || !aside) return false;

    const style=document.createElement('style');
    style.id='fluxide-xcode-enhancements';
    style.textContent=`
      .fluxide-code-meta{height:36px;min-height:36px;display:flex;align-items:center;gap:4px;padding:0 10px;box-sizing:border-box;background:rgba(25,27,32,.92);border-bottom:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.68);font:12px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;backdrop-filter:blur(18px) saturate(145%);-webkit-backdrop-filter:blur(18px) saturate(145%);user-select:none;overflow:hidden}
      .light .fluxide-code-meta{background:rgba(248,249,251,.92);color:rgba(20,24,30,.65);border-color:rgba(0,0,0,.08)}
      .fluxide-code-meta .meta-segment{height:26px;display:flex;align-items:center;padding:0 8px;border-radius:7px}.fluxide-code-meta .meta-segment.active{background:rgba(255,255,255,.10);color:#fff}.light .fluxide-code-meta .meta-segment.active{background:rgba(0,0,0,.07);color:#111}
      .fluxide-code-meta button{border:0!important;background:transparent!important;color:inherit!important;font:inherit;padding:5px 8px;border-radius:6px;cursor:pointer}.fluxide-code-meta button:hover{background:rgba(255,255,255,.08)!important}.light .fluxide-code-meta button:hover{background:rgba(0,0,0,.06)!important}
      .fluxide-code-meta .meta-divider{width:1px;height:16px;background:currentColor;opacity:.16;margin:0 3px}.fluxide-code-meta .meta-grow{flex:1}.fluxide-code-meta .meta-stat{white-space:nowrap;opacity:.72}.fluxide-code-meta .meta-actions{display:flex;gap:1px}
      .fluxide-symbol-panel{border-top:1px solid rgba(255,255,255,.08);margin-top:7px}.fluxide-symbol-head{height:32px;display:flex;align-items:center;gap:7px;padding:0 9px;color:rgba(255,255,255,.72);font:11px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;letter-spacing:.04em;cursor:pointer}.light .fluxide-symbol-head{color:rgba(20,24,30,.65)}
      .fluxide-symbol-list{padding:0 6px 8px;max-height:180px;overflow:auto}.fluxide-symbol{display:flex!important;width:100%;align-items:center;gap:7px;text-align:left;padding:5px 7px!important;border:0!important;background:transparent!important;color:inherit!important;border-radius:6px;cursor:pointer;font:12px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif}.fluxide-symbol:hover{background:rgba(255,255,255,.07)!important}.light .fluxide-symbol:hover{background:rgba(0,0,0,.06)!important}.fluxide-symbol .kind{width:15px;opacity:.5}.fluxide-symbol .line{margin-left:auto;opacity:.35;font-size:10px}
      .fluxide-blame{position:absolute;inset:0;z-index:30;overflow:auto;margin:0;padding:12px 14px;box-sizing:border-box;background:rgba(12,14,18,.98);color:rgba(255,255,255,.74);font:12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.light .fluxide-blame{background:rgba(250,250,252,.98);color:rgba(20,24,30,.72)}.fluxide-blame-row{display:grid;grid-template-columns:44px 135px 1fr;gap:10px;line-height:21px;white-space:pre;overflow:hidden}.fluxide-blame-row span{overflow:hidden;text-overflow:ellipsis}.fluxide-blame-row .ln{text-align:right;opacity:.35}.fluxide-blame-row .who{opacity:.48}
      @media(max-width:800px){.fluxide-code-meta .optional{display:none}.fluxide-symbol-list{max-height:130px}}
    `;
    document.head.appendChild(style);

    const meta=document.createElement('div');
    meta.className='fluxide-code-meta';
    meta.innerHTML=`<div class="meta-segment active" data-mode="code"><button type="button">Code</button></div><div class="meta-segment" data-mode="blame"><button type="button">Blame</button></div><div class="meta-divider"></div><span class="meta-stat optional" data-stat="lines">1 Line</span><span class="meta-stat optional">·</span><span class="meta-stat" data-stat="size">0 B</span><div class="meta-grow"></div><span class="meta-stat optional" data-stat="language">FILE</span><div class="meta-actions"><button type="button" data-action="copy">Copy</button><button type="button" data-action="save">Save</button></div>`;
    toolbar.parentNode.insertBefore(meta,toolbar);

    let blame=null;
    const hideBlame=()=>{if(blame){blame.remove();blame=null;}};
    const showBlame=()=>{if(blame)return;const host=document.querySelector('main .editors');if(!host)return;host.style.position=host.style.position||'relative';blame=document.createElement('div');blame.className='fluxide-blame';const text=getText();blame.innerHTML=text.split('\n').map((line,i)=>`<div class="fluxide-blame-row"><span class="ln">${i+1}</span><span class="who">Local workspace</span><span>${escapeHTML(line)}</span></div>`).join('')||'<div>No saved content.</div>';host.appendChild(blame);};

    const symbols=document.createElement('div');
    symbols.className='fluxide-symbol-panel';
    symbols.innerHTML='<div class="fluxide-symbol-head"><span>⌄</span><strong>SYMBOL PANEL</strong></div><div class="fluxide-symbol-list"></div>';
    const outline=aside.querySelector('.outline'); if(outline) outline.after(symbols); else aside.appendChild(symbols);
    symbols.querySelector('.fluxide-symbol-head').addEventListener('click',()=>{const l=symbols.querySelector('.fluxide-symbol-list');l.hidden=!l.hidden;});

    const renderSymbols=()=>{const list=symbols.querySelector('.fluxide-symbol-list');const found=[];getText().split('\n').forEach((line,index)=>{const t=line.trim();let m=t.match(/(?:function|fn|def|func|class|struct|interface|enum)\s+([A-Za-z_$][\w$]*)/);let kind=m?t.split(/\s+/)[0]:'';if(!m){m=t.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?:=|:)/);kind=m?'var':kind;}if(m)found.push({name:m[1],kind:kind||'symbol',line:index+1});});list.innerHTML=found.length?found.slice(0,100).map(s=>`<button class="fluxide-symbol" data-line="${s.line}"><span class="kind">${escapeHTML(s.kind.charAt(0).toUpperCase())}</span><span>${escapeHTML(s.name)}</span><span class="line">${s.line}</span></button>`).join(''):'<div style="padding:8px;opacity:.45;font-size:11px">No symbols in this file.</div>';};
    symbols.addEventListener('click',event=>{const item=event.target.closest('.fluxide-symbol');if(!item)return;const line=Number(item.dataset.line);document.querySelector('.monaco-editor textarea')?.focus();window.dispatchEvent(new KeyboardEvent('keydown',{key:'g',code:'KeyG',ctrlKey:true,bubbles:true}));setTimeout(()=>{const q=document.querySelector('.quick-input-widget input');if(q){q.value=String(line);q.dispatchEvent(new Event('input',{bubbles:true}));q.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));}},100);});

    meta.addEventListener('click',async event=>{const button=event.target.closest('button');if(!button)return;if(button.closest('[data-mode="code"]')){meta.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode==='code'));hideBlame();}if(button.closest('[data-mode="blame"]')){meta.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode==='blame'));showBlame();}if(button.dataset.action==='copy'){try{await navigator.clipboard.writeText(getText());}catch{}}if(button.dataset.action==='save')[...document.querySelectorAll('.actions button')].find(x=>x.textContent.includes('Save'))?.click();});

    const refresh=()=>{const text=getText(),name=getActiveFile(),bytes=new TextEncoder().encode(text).length,lines=text?text.split('\n').length:1;meta.querySelector('[data-stat="lines"]').textContent=`${lines} ${lines===1?'Line':'Lines'}`;meta.querySelector('[data-stat="size"]').textContent=bytes<1024?`${bytes} B`:`${(bytes/1024).toFixed(1)} KB`;meta.querySelector('[data-stat="language"]').textContent=name.includes('.')?name.split('.').pop().toUpperCase():'FILE';renderSymbols();};
    refresh();setInterval(refresh,700);return true;
  };

  const start=()=>{if(install())return;const observer=new MutationObserver(()=>{if(install())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),30000);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
