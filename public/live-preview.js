/* FluxIDE integrated View / Live Server bridge. It works alongside the existing React IDE without replacing the working editor/runtime. */
(function () {
  'use strict';
  var state = { mode: null, device: 'iphone17', timer: null, last: '' };
  var visual = new Set(['html','css','javascript','flux','swift','typescript']);
  var devices = {
    iphone17: { label:'iPhone 17', w:393, h:852, radius:56, kind:'phone' },
    iphone17pro: { label:'iPhone 17 Pro', w:402, h:874, radius:58, kind:'phone' },
    iphone17promax: { label:'iPhone 17 Pro Max', w:440, h:956, radius:60, kind:'phone' },
    ipadmini: { label:'iPad mini', w:744, h:1133, radius:28, kind:'ipad' },
    ipadpro11: { label:'iPad Pro 11-inch', w:834, h:1194, radius:30, kind:'ipad' },
    ipadpro13: { label:'iPad Pro 13-inch', w:1032, h:1376, radius:32, kind:'ipad' },
    fullscreen: { label:'Full Screen', w:0, h:0, radius:0, kind:'full' }
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function getFiles() { try { return JSON.parse(localStorage.getItem('fluxide-files') || '{}'); } catch (_) { return {}; } }
  function currentFile() {
    var tabs = document.querySelectorAll('.tab.tab-active');
    if (tabs.length) return tabs[0].textContent.replace(/●/g,'').trim();
    var files = document.querySelectorAll('.file.active');
    return files.length ? files[0].textContent.trim() : 'main.html';
  }
  function currentLanguage() {
    var footer = document.querySelector('footer');
    if (!footer) return 'plaintext';
    var spans = footer.querySelectorAll('span');
    return spans.length > 2 ? spans[2].textContent.trim().toLowerCase() : 'plaintext';
  }
  function getSource() {
    var files = getFiles(), name = currentFile();
    if (files[name] != null) return files[name];
    var ta = document.querySelector('.monaco-editor textarea');
    return ta ? ta.value : '';
  }
  function syncEditorToStorage() {
    var save = Array.from(document.querySelectorAll('button')).find(function(b){ return b.textContent.trim().toLowerCase().indexOf('save') !== -1; });
    if (save) save.click();
  }
  function htmlForFlux(src) {
    var title = (src.match(/^\s*ui\\s+window\\s+["']([^"']+)/m) || [,'Flux App'])[1];
    var bg = (src.match(/^\s*ui\\s+background\\s+["']([^"']+)/m) || [,'#0a0d14'])[1];
    var out = [], lines = src.split(/\r?\n/), stack = [];
    lines.forEach(function(line){
      var t = line.trim();
      var m;
      if ((m=t.match(/^ui\\s+text\\s+["'](.+?)["']$/))) out.push('<div class="fx-text">'+esc(m[1])+'</div>');
      else if ((m=t.match(/^ui\\s+button\\s+["'](.+?)["']$/))) out.push('<button class="fx-button">'+esc(m[1])+'</button>');
      else if ((m=t.match(/^ui\\s+input\\s+["'](.+?)["']$/))) out.push('<input class="fx-input" placeholder="'+esc(m[1])+'">');
      else if ((m=t.match(/^ui\\s+image\\s+["'](.+?)["']$/))) out.push('<div class="fx-image">'+esc(m[1])+'</div>');
      else if (/^ui\\s+card\\s*$/.test(t)) { stack.push('card'); out.push('<section class="fx-card">'); }
      else if (/^done\\s*$/.test(t) && stack.pop() === 'card') out.push('</section>');
      else if (/^ui\\s+button\\s/.test(t) && !m) out.push('<button class="fx-button">Button</button>');
    });
    return '<div class="fx-app" style="background:'+esc(bg)+'"><div class="fx-title">'+esc(title)+'</div><div class="fx-body">'+(out.join('') || '<div class="fx-text">Flux UI preview</div>')+'</div></div>';
  }
  function makeHTML(src, lang) {
    if (lang === 'flux') return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+baseStyle()+'</style></head><body>'+htmlForFlux(src)+'</body></html>';
    if (lang === 'swift') {
      var texts = [], m, re = /\\bText\\s*\\(\\s*["']([^"']+)["']/g;
      while ((m=re.exec(src))) texts.push('<div class="swift-text">'+esc(m[1])+'</div>');
      var buttons=[], br=/\\bButton\\s*\\(\\s*["']([^"']+)["']/g; while ((m=br.exec(src))) buttons.push('<button class="fx-button">'+esc(m[1])+'</button>');
      return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+baseStyle()+'</style></head><body><main class="swift-app">'+(texts.concat(buttons).join('')||'<div class="swift-text">SwiftUI Preview</div>')+'</main></body></html>';
    }
    var files=getFiles(), html=src;
    Object.keys(files).forEach(function(name){
      if (/\\.css$/i.test(name)) html=html.replace(new RegExp('<link[^>]+href=["\\\']'+name.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')+'["\\\'][^>]*>','ig'), '<style>'+files[name]+'</style>');
      if (/\\.(js|jsx|ts|tsx)$/i.test(name)) html=html.replace(new RegExp('<script[^>]+src=["\\\']'+name.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')+'["\\\'][^>]*><\\/script>','ig'), '<script>'+files[name]+'<\\/script>');
    });
    if (!/<html/i.test(html)) html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+baseStyle()+'</style></head><body>'+html+'</body></html>';
    return html;
  }
  function baseStyle(){return '*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif}body{background:#fff;color:#111}.fx-app{min-height:100vh;padding:26px}.fx-title{font-size:30px;font-weight:750;margin-bottom:20px}.fx-body{display:flex;flex-direction:column;gap:12px}.fx-card{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.16);border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:12px;color:#fff}.fx-text,.swift-text{font-size:20px;line-height:1.4}.swift-app{min-height:100vh;background:#f2f2f7;padding:80px 24px 30px;display:flex;flex-direction:column;gap:14px}.fx-button{border:0;border-radius:14px;background:#007aff;color:#fff;padding:13px 18px;font-size:17px;font-weight:600}.fx-input{border:1px solid #ccc;border-radius:12px;padding:13px;font-size:17px}.fx-image{padding:24px;border-radius:16px;background:#eee;text-align:center}';}
  function addStyles(){ if(document.getElementById('fluxide-preview-bridge-css'))return; var s=document.createElement('style');s.id='fluxide-preview-bridge-css';s.textContent=''+
    '#fp-choice{position:fixed;inset:0;background:rgba(0,0,0,.62);backdrop-filter:blur(10px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px}'+
    '#fp-choice .box{width:min(520px,100%);background:#17181b;border:1px solid #383a40;border-radius:20px;padding:24px;box-shadow:0 30px 100px #0009;color:#fff}'+
    '#fp-choice h2{margin:0 0 8px;font-size:22px}#fp-choice p{color:#a9abb2;margin:0 0 20px}'+
    '#fp-choice .choices{display:grid;grid-template-columns:1fr 1fr;gap:10px}#fp-choice button{padding:15px;border-radius:13px;border:1px solid #3d3f46;background:#24262b;color:#fff;font-weight:650;cursor:pointer}#fp-choice button:hover{background:#303238}#fp-choice .primary{background:#fff;color:#111}'+
    '#fp-live{position:fixed;inset:0;background:#08090b;z-index:9000;display:flex;flex-direction:column;color:#fff}#fp-live .bar{height:48px;flex:none;display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid #292b30;background:#111216}#fp-live .bar strong{margin-right:10px}#fp-live .bar button,#fp-live .bar select{background:#202227;border:1px solid #363941;color:#fff;border-radius:8px;padding:7px 10px}#fp-live .close{margin-left:auto}#fp-live .body{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr}#fp-live .editor-side{border-right:1px solid #292b30;min-width:0}#fp-live iframe{width:100%;height:100%;border:0;background:#050506}#fp-live .device-stage{display:flex;align-items:center;justify-content:center;overflow:auto;padding:25px;background:radial-gradient(circle at center,#17191d,#07080a 65%)}#fp-live .device{background:linear-gradient(145deg,#e8e9eb,#545960 17%,#111317 19%,#08090b 80%,#4b5056);padding:7px;box-shadow:0 30px 70px #000b,inset 0 0 0 1px #ffffff44;position:relative;flex:none}#fp-live .device.phone{border-radius:56px}#fp-live .device.ipad{border-radius:30px}#fp-live .device.full{width:100%;height:100%;border-radius:0;padding:0;background:#050506;box-shadow:none}#fp-live .screen{width:100%;height:100%;border:0;border-radius:inherit;overflow:hidden;background:#fff}#fp-live .device.phone .screen{border-radius:49px}#fp-live .device.ipad .screen{border-radius:23px}#fp-live .island{position:absolute;z-index:2;top:11px;left:50%;transform:translateX(-50%);width:104px;height:30px;border-radius:18px;background:#050505}#fp-live .home{position:absolute;z-index:2;bottom:9px;left:50%;transform:translateX(-50%);width:134px;height:5px;border-radius:9px;background:#111}#fp-live .device.full .island,#fp-live .device.full .home{display:none}#fp-live .status{position:absolute;z-index:2;top:0;left:0;right:0;height:52px;padding:15px 23px;font:600 13px -apple-system,BlinkMacSystemFont,sans-serif;color:#111;display:flex;justify-content:space-between;pointer-events:none}#fp-live .status:after{content:"●  ▰  100%";font-size:10px}'+
    '@media(max-width:800px){#fp-live .body{grid-template-columns:1fr}#fp-live .editor-side{display:none}#fp-live .device-stage{padding:15px}.choices{grid-template-columns:1fr!important}}';document.head.appendChild(s); }
  function remove(id){var x=document.getElementById(id);if(x)x.remove();}
  function choice(kind){ remove('fp-choice'); if(kind==='view') openPreview(false); else openPreview(true); }
  function showChoice(){
    addStyles(); remove('fp-choice'); var d=document.createElement('div');d.id='fp-choice';d.innerHTML='<div class="box"><h2>How do you want to preview this?</h2><p>Choose a one-off View or an in-editor Live Server. Live Server updates while you edit.</p><div class="choices"><button class="primary" data-p="view">View</button><button data-p="live">Live Server</button></div></div>';d.addEventListener('click',function(e){var b=e.target.closest('button[data-p]');if(b)choice(b.dataset.p);else if(e.target===d)remove('fp-choice');});document.body.appendChild(d);
  }
  function openPreview(live){
    addStyles(); var lang=currentLanguage(); if(!visual.has(lang)){return;}
    var src=getSource(), html=makeHTML(src,lang);
    if(!live){var w=window.open('', '_blank');if(!w){alert('Allow pop-ups for FluxIDE to use View.');return;}w.document.open();w.document.write(html);w.document.close();return;}
    remove('fp-live'); var root=document.createElement('div');root.id='fp-live';root.innerHTML='<div class="bar"><strong>Live Preview</strong><select id="fp-device"><option value="iphone17">iPhone 17</option><option value="iphone17pro">iPhone 17 Pro</option><option value="iphone17promax">iPhone 17 Pro Max</option><option value="ipadmini">iPad mini</option><option value="ipadpro11">iPad Pro 11-inch</option><option value="ipadpro13">iPad Pro 13-inch</option><option value="fullscreen">Full Screen</option></select><button id="fp-refresh">↻ Refresh</button><button id="fp-close" class="close">✕ Close</button></div><div class="body"><div class="editor-side"></div><div class="device-stage"><div class="device phone" id="fp-device-frame"><div class="island"></div><div class="status"><span>9:41</span></div><iframe id="fp-frame" sandbox="allow-scripts allow-forms allow-modals"></iframe><div class="home"></div></div></div></div>';document.body.appendChild(root);
    var frame=root.querySelector('#fp-frame'), stage=root.querySelector('.editor-side'); state.device='iphone17';
    function update(){syncEditorToStorage();var l=currentLanguage(),h=makeHTML(getSource(),l);frame.srcdoc=h;applyDevice();}
    function applyDevice(){var d=devices[state.device], f=root.querySelector('#fp-device-frame'); if(d.kind==='full'){f.className='device full';f.style.width='100%';f.style.height='100%';}else{f.className='device '+d.kind;f.style.width=d.w+'px';f.style.height=d.h+'px';} }
    root.querySelector('#fp-device').addEventListener('change',function(e){state.device=e.target.value;applyDevice();});root.querySelector('#fp-refresh').addEventListener('click',update);root.querySelector('#fp-close').addEventListener('click',function(){clearInterval(state.timer);remove('fp-live');});
    update(); clearInterval(state.timer);state.timer=setInterval(function(){ if(!document.getElementById('fp-live'))return; syncEditorToStorage(); var sig=currentFile()+'|'+currentLanguage()+'|'+JSON.stringify(getFiles()); if(sig!==state.last){state.last=sig;frame.srcdoc=makeHTML(getSource(),currentLanguage());}},600);
  }
  function intercept(e){var b=e.target.closest && e.target.closest('button');if(!b)return;var text=b.textContent.trim().toLowerCase();if(text.indexOf('live server')!==-1 || text==='run'){var lang=currentLanguage();if(visual.has(lang)){e.preventDefault();e.stopImmediatePropagation();showChoice();return false;}}}
  function boot(){addStyles();document.addEventListener('click',intercept,true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
