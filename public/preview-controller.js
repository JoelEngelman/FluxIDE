(() => {
  const state = { mode: null, device: 'iphone17pro', timer: null };
  const devices = {
    iphone17: ['iPhone 17', 393, 852, 52], iphone17pro: ['iPhone 17 Pro', 402, 874, 54], iphone17promax: ['iPhone 17 Pro Max', 430, 932, 58],
    ipadmini: ['iPad mini', 744, 1133, 34], ipadpro11: ['iPad Pro 11"', 834, 1194, 36], ipadpro13: ['iPad Pro 13"', 1024, 1366, 38], full: ['Full Screen', 0, 0, 0]
  };
  const visual = new Set(['html','css','javascript','flux','swift']);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function getCode(){ const models = window.monaco?.editor?.getModels?.() || []; return models.length ? models[0].getValue() : ''; }
  function getLang(){ return document.querySelector('.toolbar select')?.value || 'plaintext'; }
  function swiftToHtml(src){
    const texts=[...src.matchAll(/\bText\s*\(\s*["']([^"']+)/g)].map(m=>m[1]);
    const labels=[...src.matchAll(/\bLabel\s*\(\s*["']([^"']+)/g)].map(m=>m[1]);
    const buttons=[...src.matchAll(/\bButton\s*\(\s*["']([^"']+)/g)].map(m=>m[1]);
    const fields=[...src.matchAll(/\bTextField\s*\(\s*["']([^"']+)/g)].map(m=>m[1]);
    const images=[...src.matchAll(/\bImage\s*\(\s*(?:systemName:\s*)?["']([^"']+)/g)].map(m=>m[1]);
    let body=''; texts.forEach(t=>body+=`<div class="swift-text">${esc(t)}</div>`); labels.forEach(t=>body+=`<div class="swift-label">${esc(t)}</div>`); buttons.forEach(t=>body+=`<button onclick="this.textContent='Pressed!'">${esc(t)}</button>`); fields.forEach(t=>body+=`<input placeholder="${esc(t)}">`); images.forEach(t=>body+=`<div class="swift-image">◈ ${esc(t.replace(/[-_]/g,' '))}</div>`);
    return `<div class="swift-screen ${/HStack/.test(src)?'horizontal':'vertical'}">${body||'<div class="empty">No supported SwiftUI views found.</div>'}</div>`;
  }
  function fluxToHtml(src){
    const bg=(src.match(/ui\s+background\s+["']([^"']+)/)||[])[1]||'#0a0d14';
    const texts=[...src.matchAll(/ui\s+text\s+["']([^"']+)/g)].map(m=>m[1]);
    const buttons=[...src.matchAll(/ui\s+button\s+["']([^"']+)/g)].map(m=>m[1]);
    const cards=Math.max(1,(src.match(/ui\s+card\b/g)||[]).length);
    let body=texts.map(t=>`<div>${esc(t)}</div>`).join('')+buttons.map(t=>`<button>${esc(t)}</button>`).join('');
    return `<div class="flux-screen" style="background:${esc(bg)}"><div class="flux-card">${body||'<div>Flux preview</div>'}</div></div>`;
  }
  function renderDoc(code, lang){
    if(lang==='swift') return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#f2f2f7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif}.swift-screen{min-height:100vh;padding:82px 22px 38px;box-sizing:border-box;display:flex;gap:14px;justify-content:flex-start}.vertical{flex-direction:column}.horizontal{flex-direction:row;align-items:center;overflow:auto}.swift-text{font-size:20px}.swift-text:first-child{font-size:28px;font-weight:700}.swift-label{font-size:18px;color:#444}button{border:0;border-radius:14px;padding:14px 18px;background:#007aff;color:white;font-size:17px;font-weight:600}input{padding:13px;border:1px solid #ccc;border-radius:12px;font-size:17px}.swift-image{padding:12px;background:#fff;border-radius:12px}.empty{text-align:center;color:#777}</style></head><body>${swiftToHtml(code)}</body></html>`;
    if(lang==='flux') return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:system-ui;color:white}.flux-screen{min-height:100vh;padding:32px;box-sizing:border-box}.flux-card{padding:28px;border-radius:24px;background:rgba(255,255,255,.08);backdrop-filter:blur(20px);display:flex;flex-direction:column;gap:14px;max-width:600px;margin:auto}.flux-card button{background:#8b5cf6;color:#fff;border:0;border-radius:12px;padding:12px 16px;font-weight:600}</style></head><body>${fluxToHtml(code)}</body></html>`;
    if(lang==='html') return code;
    if(lang==='javascript') return `<!doctype html><html><body><script>${code.replace(/<\/script>/gi,'<\\/script>')}<\/script></body></html>`;
    return `<!doctype html><html><body><pre>Preview is available for visual languages.</pre></body></html>`;
  }
  function iframeHtml(code,lang){ return `<iframe id="fp-frame" title="FluxIDE Live Preview" sandbox="allow-scripts allow-forms allow-modals"></iframe>`; }
  function inject(){
    if(document.getElementById('fp-live')) return;
    const root=document.createElement('div'); root.id='fp-live'; root.innerHTML=`<div class="fp-head"><b>Live Preview</b><select id="fp-device">${Object.entries(devices).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select><button id="fp-view">View</button><button id="fp-close">×</button></div><div class="fp-stage"><div class="fp-device-wrap"><div class="fp-device"><div class="fp-island"></div><iframe id="fp-frame" sandbox="allow-scripts allow-forms allow-modals"></iframe></div></div></div>`;
    document.body.appendChild(root);
    root.querySelector('#fp-close').onclick=close;
    root.querySelector('#fp-view').onclick=()=>view();
    root.querySelector('#fp-device').onchange=e=>{state.device=e.target.value; resize();};
  }
  function resize(){ const root=document.getElementById('fp-live'); const wrap=root?.querySelector('.fp-device-wrap'); const dev=root?.querySelector('.fp-device'); if(!wrap||!dev)return; const [name,w,h,r]=devices[state.device]; root.classList.toggle('full',state.device==='full'); if(state.device==='full'){dev.style.width='100%';dev.style.height='100%';dev.style.borderRadius='0';}else{dev.style.width=w+'px';dev.style.height=h+'px';dev.style.borderRadius=r+'px';} }
  function update(){ const frame=document.getElementById('fp-frame'); if(!frame)return; const doc=frame.contentDocument; if(!doc)return; const code=getCode(); const lang=getLang(); doc.open();doc.write(renderDoc(code,lang));doc.close();resize(); }
  function live(){ inject(); state.mode='live'; const root=document.getElementById('fp-live'); root.classList.add('open'); update(); clearInterval(state.timer); state.timer=setInterval(update,350); }
  function view(){ const code=getCode(),lang=getLang(); const w=window.open('','_blank'); if(!w)return; w.document.open();w.document.write(renderDoc(code,lang));w.document.close(); }
  function close(){ clearInterval(state.timer);state.mode=null;document.getElementById('fp-live')?.remove(); }
  function popup(){
    if(!visual.has(getLang())) return false;
    if(document.getElementById('fp-choice')) return true;
    const o=document.createElement('div');o.id='fp-choice';o.innerHTML=`<div class="fp-choice-box"><h2>Run ${esc(getLang().toUpperCase())}</h2><p>How would you like to view your app?</p><button data-a="view">↗ View / Preview <small>Open in a new tab</small></button><button data-a="live">⚡ Live Preview <small>Interactive preview inside FluxIDE</small></button><button class="cancel">Cancel</button></div>`;document.body.appendChild(o);
    o.onclick=e=>{const a=e.target.closest('[data-a]')?.dataset.a;if(a){o.remove();a==='live'?live():view();}if(e.target.classList.contains('cancel'))o.remove();}; return true;
  }
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const text=b.textContent.trim();if((text.includes('Run')||text.includes('Live Server'))&&!b.closest('#fp-live')&&!b.closest('#fp-choice')){e.preventDefault();e.stopImmediatePropagation();popup();}},true);
  const style=document.createElement('style');style.textContent=`#fp-live{display:none;position:fixed;z-index:9998;top:0;right:0;bottom:0;width:52%;background:#0b0c0f;border-left:1px solid rgba(255,255,255,.1);color:#fff;font-family:system-ui}.app:has(#fp-live.open) main{margin-right:52%}#fp-live.open{display:flex;flex-direction:column}.fp-head{height:52px;display:flex;align-items:center;gap:8px;padding:0 12px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(20,20,24,.85);backdrop-filter:blur(18px)}.fp-head select,.fp-head button{background:#202127;color:#fff;border:1px solid #363842;border-radius:9px;padding:7px 10px}.fp-head b{margin-right:auto}.fp-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:auto;padding:24px}.fp-device-wrap{display:flex;align-items:center;justify-content:center}.fp-device{position:relative;overflow:hidden;background:#111;box-shadow:0 25px 60px rgba(0,0,0,.6),inset 0 0 0 2px rgba(255,255,255,.2);transition:.2s}.fp-device iframe{width:100%;height:100%;border:0;display:block;background:#fff}.fp-island{position:absolute;z-index:5;top:10px;left:50%;transform:translateX(-50%);width:104px;height:30px;border-radius:18px;background:#050505;pointer-events:none}.fp-device[style*="border-radius: 0"] .fp-island{display:none}#fp-choice{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.55);backdrop-filter:blur(10px);display:grid;place-items:center}#fp-choice .fp-choice-box{width:min(430px,calc(100vw - 32px));padding:24px;border-radius:24px;background:rgba(30,31,36,.96);color:#fff;box-shadow:0 30px 80px rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.12)}#fp-choice h2{margin:0 0 6px}#fp-choice p{color:#a9abb5;margin:0 0 18px}#fp-choice button{display:block;width:100%;margin:8px 0;padding:14px;text-align:left;border:1px solid #3b3d46;border-radius:14px;background:#202127;color:#fff;cursor:pointer}#fp-choice button:hover{background:#2a2b33}#fp-choice small{display:block;color:#999;margin-top:3px}.app:has(#fp-live.full) main{margin-right:0}@media(max-width:900px){#fp-live{left:0;right:0;width:100%}.app:has(#fp-live.open) main{margin-right:100%}}`;document.head.appendChild(style);
  })();