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

  var iphoneImage = 'https://images.openai.com/static-rsc-4/7PR_L1vjsYLTPBXV3KlgAwCSvxGHuDEXsPas6O9nlzNvLY5QRF0cWIHg0oBMNEVOE0tADu3ZQJA2y6XQz76B-Ped52131dkSP70nRJw4w-JmIccNQE0SczX4t3yfgsbPYWvZGm1ceZ6W_rdpkWsO9lKV0YueqZTNZud0RjZooNFlpA7HPxHDFMNhzqScHS41?purpose=fullsize';

  var html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(title) + '</title><style>' +
    '*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Segoe UI",sans-serif}' +
    'body{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:18px;color:#111;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.07),transparent 24%),radial-gradient(circle at 50% 60%,rgba(120,120,130,.045),transparent 46%),linear-gradient(180deg,#090a0c,#020203 72%,#08090b);position:relative;overflow:hidden}' +
    'body:before{content:"";position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.014) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.014) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(circle at center,black,transparent 72%);pointer-events:none}' +
    '.device-wrap{position:relative;width:min(430px,calc(100vw - 28px));height:min(900px,calc(100dvh - 28px));display:flex;align-items:center;justify-content:center;overflow:visible;z-index:1}' +
    '.device-art{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;display:block;z-index:3;pointer-events:none;user-select:none}' +
    '.screen-clip{position:absolute;z-index:2;width:75.2%;height:94.2%;left:12.4%;top:2.9%;border-radius:12.8%;overflow:hidden;background:#f2f2f7}' +
    '.screen{position:absolute;inset:0;padding:9.5% 6% 6%;display:flex;align-items:stretch;justify-content:flex-start;gap:1.65%;overflow:auto;background:linear-gradient(#f8f8fa,#f2f2f7)}' +
    '.screen.vertical{flex-direction:column}.screen.horizontal{flex-direction:row;align-items:center;overflow-x:auto}.screen.stacked{position:absolute}.screen.scroll{overflow:auto}' +
    '.dynamic-island{position:absolute;z-index:10;top:1.45%;left:50%;transform:translateX(-50%);width:27%;height:3.7%;min-height:18px;max-height:32px;border-radius:999px;background:#050505;box-shadow:inset 0 1px 2px rgba(255,255,255,.08),0 1px 2px rgba(0,0,0,.4)}' +
    '.dynamic-island:after{content:"";position:absolute;right:11%;top:29%;width:6%;aspect-ratio:1;border-radius:50%;background:#17202b}' +
    '.status{position:absolute;z-index:8;top:0;left:0;right:0;height:7%;padding:2.1% 6.2% 0;background:linear-gradient(#fff 0%,rgba(255,255,255,.94) 70%,rgba(255,255,255,0));font-size:clamp(9px,1.6vw,13px);font-weight:600;color:#111;display:flex;justify-content:space-between}' +
    '.status:after{content:"●  ▰  100%";font-size:.84em;letter-spacing:1px}' +
    '.home-indicator{position:absolute;z-index:10;bottom:1.2%;left:50%;transform:translateX(-50%);width:34%;height:.6%;min-height:4px;max-height:5px;border-radius:99px;background:#111;opacity:.9}' +
    '.swift-text{font-size:clamp(14px,2.3vw,20px);line-height:1.35;color:#111;padding:4px 0}.swift-text:first-of-type{font-size:clamp(20px,3.2vw,28px);font-weight:700}.swift-label{font-size:clamp(13px,2.1vw,18px);color:#333;padding:4px 0}' +
    '.swift-button{border:0;border-radius:14px;padding:14px 18px;background:#007aff;color:#fff;font-size:clamp(13px,2vw,17px);font-weight:600;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.18)}.swift-button:active{transform:scale(.98)}' +
    '.swift-input{border:1px solid #c7c7cc;border-radius:12px;padding:13px 14px;font-size:clamp(13px,2vw,17px);background:#fff;outline:none}.swift-input:focus{border-color:#007aff;box-shadow:0 0 0 2px rgba(0,122,255,.15)}' +
    '.swift-image{display:flex;align-items:center;gap:10px;font-size:clamp(13px,2vw,17px);padding:12px;background:#fff;border-radius:12px;color:#333}.sf-symbol{font-size:22px;color:#007aff}.empty{text-align:center;color:#777;padding:40px 10px;line-height:1.7}' +
    '@media(max-height:720px){.device-wrap{width:min(390px,calc(100vw - 24px));height:calc(100dvh - 24px)}}@media(max-width:600px){.device-wrap{width:calc(100vw - 20px);height:calc(100dvh - 20px)}.screen-clip{width:75.2%;height:94.2%;left:12.4%;top:2.9%}}' +
    '</style></head><body><div class="device-wrap"><div class="screen-clip"><div class="dynamic-island"></div><div class="status"><span>9:41</span></div><main class="screen ' + layoutClass + '">' + content + '</main><div class="home-indicator"></div></div><img class="device-art" src="' + iphoneImage + '" alt="iPhone 17 preview frame"></div></body></html>';

  var url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  var preview = window.open(url, '_blank');
  if (!preview) {
    URL.revokeObjectURL(url);
    throw new Error('SwiftUI preview was blocked by the browser. Allow pop-ups for FluxIDE.');
  }
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  return '✓ SwiftUI iPhone 17 preview opened for ' + file + '. Browser-based; Xcode, macOS and Apple SDKs are not required.';
}

export { executeSwiftUI };
