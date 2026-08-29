function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[character];
  });
}

function firstMatch(source, pattern, fallback) {
  var match = source.match(pattern);
  return match && match[1] ? match[1] : fallback;
}

function allMatches(source, pattern) {
  var result = [];
  var match;
  while ((match = pattern.exec(source))) result.push(match[1]);
  return result;
}

function executeSwiftUI(source, filename) {
  var file = filename || 'ContentView.swift';
  var title = firstMatch(source, /(?:navigationTitle|Text)\s*\(\s*["']([^"']+)["']\s*\)/, 'SwiftUI Preview');
  var content = '';
  var texts = allMatches(source, /\bText\s*\(\s*["']([^"']+)["']/g);
  var labels = allMatches(source, /\bLabel\s*\(\s*["']([^"']+)["']/g);
  var buttons = allMatches(source, /\bButton\s*\(\s*["']([^"']+)["']/g);
  var fields = allMatches(source, /\bTextField\s*\(\s*["']([^"']+)["']/g);
  var images = allMatches(source, /\bImage\s*\(\s*(?:systemName:\s*)?["']([^"']+)["']/g);
  var seen = 0;
  texts.forEach(function (text) { content += '<div class="swift-text">' + escapeHtml(text) + '</div>'; seen++; });
  labels.forEach(function (label) { content += '<div class="swift-label">' + escapeHtml(label) + '</div>'; seen++; });
  buttons.forEach(function (label) { content += '<button class="swift-button" onclick="this.textContent=\'Pressed!\'">' + escapeHtml(label) + '</button>'; seen++; });
  fields.forEach(function (placeholder) { content += '<input class="swift-input" placeholder="' + escapeHtml(placeholder) + '">'; seen++; });
  images.forEach(function (symbol) { content += '<div class="swift-image"><span class="sf-symbol">◆</span>' + escapeHtml(symbol.replace(/[-_]/g, ' ')) + '</div>'; seen++; });
  if (!seen) content = '<div class="empty">No supported SwiftUI views found.<br><small>Try Text, Button, Label, TextField, Image, VStack, HStack or ZStack.</small></div>';
  var hasHStack = /\bHStack\b/.test(source);
  var hasZStack = /\bZStack\b/.test(source);
  var hasScroll = /\bScrollView\b/.test(source);
  var hasList = /\bList\b/.test(source);
  var layoutClass = hasHStack ? 'horizontal' : hasZStack ? 'stacked' : 'vertical';
  if (/\bVStack\b/.test(source)) layoutClass = 'vertical';
  if (hasScroll || hasList) layoutClass += ' scroll';
  var html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(title) + '</title><style>' +
    '*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Segoe UI",sans-serif}' +
    'body{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:16px;color:#111;background:#050506;position:relative;overflow:hidden}' +
    'body:before{content:"";position:fixed;inset:-20%;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.09),transparent 22%),radial-gradient(circle at 50% 55%,rgba(120,120,130,.045),transparent 42%),linear-gradient(180deg,#08090b,#030304 70%,#070708);filter:blur(18px);pointer-events:none}' +
    'body:after{content:"";position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(circle at center,black 0,transparent 68%);pointer-events:none}' +
    '.device-wrap{position:relative;width:min(393px,calc(100vw - 32px));height:min(852px,calc(100dvh - 32px));aspect-ratio:393/852;display:flex;align-items:center;justify-content:center;z-index:1;filter:drop-shadow(0 34px 45px rgba(0,0,0,.65))}' +
    '.device{position:relative;width:100%;height:100%;background:linear-gradient(145deg,#f4f5f7,#777b81 18%,#17191c 20%,#0b0c0e 80%,#60656b);border-radius:14.25%;padding:1.78%;box-shadow:inset 0 0 0 1px rgba(255,255,255,.38),inset 0 0 0 3px rgba(0,0,0,.8),0 0 0 1px #050505;overflow:hidden}' +
    '.device:before{content:"";position:absolute;inset:1%;border-radius:13%;border:1px solid rgba(255,255,255,.18);pointer-events:none;z-index:8}' +
    '.screen-shell{position:relative;width:100%;height:100%;overflow:hidden;border-radius:12.5%;background:#f2f2f7}' +
    '.dynamic-island{position:absolute;z-index:20;top:1.3%;left:50%;transform:translateX(-50%);width:26.5%;height:3.55%;min-height:22px;max-height:30px;border-radius:999px;background:#050505;box-shadow:inset 0 1px 2px rgba(255,255,255,.08),0 1px 2px rgba(0,0,0,.45)}' +
    '.dynamic-island:after{content:"";position:absolute;right:12%;top:30%;width:6%;aspect-ratio:1;border-radius:50%;background:#18202a;box-shadow:inset 0 0 0 1px #202934}' +
    '.status{position:absolute;z-index:15;top:0;left:0;right:0;height:7%;padding:2.05% 6.1% 0;background:linear-gradient(#fff 0%,rgba(255,255,255,.9) 70%,rgba(255,255,255,0));font-size:clamp(9px,1.5vw,13px);font-weight:600;color:#111;text-align:left;display:flex;justify-content:space-between}' +
    '.status:after{content:"●  ▰  100%";font-size:.85em;letter-spacing:1px}' +
    '.screen{position:absolute;inset:0;padding:10% 5.6% 5%;display:flex;align-items:stretch;justify-content:flex-start;gap:1.65%;overflow:auto;background:linear-gradient(#f8f8fa,#f2f2f7)}' +
    '.screen.vertical{flex-direction:column}.screen.horizontal{flex-direction:row;align-items:center;overflow-x:auto}.screen.stacked{position:absolute}.screen.scroll{overflow:auto}' +
    '.swift-text{font-size:clamp(14px,2.3vw,20px);line-height:1.35;color:#111;padding:4px 0}.swift-text:first-of-type{font-size:clamp(20px,3.2vw,28px);font-weight:700}.swift-label{font-size:clamp(13px,2.1vw,18px);color:#333;padding:4px 0}' +
    '.swift-button{border:0;border-radius:14px;padding:14px 18px;background:#007aff;color:#fff;font-size:clamp(13px,2vw,17px);font-weight:600;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.18)}.swift-button:active{transform:scale(.98)}' +
    '.swift-input{border:1px solid #c7c7cc;border-radius:12px;padding:13px 14px;font-size:clamp(13px,2vw,17px);background:#fff;outline:none}.swift-input:focus{border-color:#007aff;box-shadow:0 0 0 2px rgba(0,122,255,.15)}' +
    '.swift-image{display:flex;align-items:center;gap:10px;font-size:clamp(13px,2vw,17px);padding:12px;background:#fff;border-radius:12px;color:#333}.sf-symbol{font-size:22px;color:#007aff}.empty{text-align:center;color:#777;padding:40px 10px;line-height:1.7}' +
    '.home-indicator{position:absolute;z-index:25;bottom:1%;left:50%;transform:translateX(-50%);width:34%;height:.6%;min-height:4px;max-height:5px;border-radius:99px;background:#111;opacity:.9}' +
    '.side-button{position:absolute;left:-.8%;width:1%;border-radius:4px;background:#6f7378;box-shadow:0 0 0 1px #18191b}.side-button.one{top:18.2%;height:4.9%}.side-button.two{top:24.5%;height:8.2%}.side-button.three{top:33.7%;height:8.2%}.power{position:absolute;right:-.8%;top:25.6%;height:10.3%;width:1%;border-radius:4px;background:#6f7378;box-shadow:0 0 0 1px #18191b}' +
    '</style></head><body><div class="device-wrap"><span class="side-button one"></span><span class="side-button two"></span><span class="side-button three"></span><span class="power"></span><div class="device"><div class="screen-shell"><div class="dynamic-island"></div><div class="status"><span>9:41</span></div><main class="screen ' + layoutClass + '">' + content + '</main><div class="home-indicator"></div></div></div></div></body></html>';
  var url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  var preview = window.open(url, '_blank');
  if (!preview) { URL.revokeObjectURL(url); throw new Error('SwiftUI preview was blocked by the browser. Allow pop-ups for FluxIDE.'); }
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  return '✓ SwiftUI iPhone preview opened for ' + file + '. Browser-based; Xcode, macOS and Apple SDKs are not required.';
}

export { executeSwiftUI };
