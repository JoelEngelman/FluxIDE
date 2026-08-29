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

  // Browser-only SwiftUI renderer. No Swift compiler, Xcode, macOS or Apple SDKs are used.
  var texts = allMatches(source, /\bText\s*\(\s*["']([^"']+)["']/g);
  var labels = allMatches(source, /\bLabel\s*\(\s*["']([^"']+)["']/g);
  var buttons = allMatches(source, /\bButton\s*\(\s*["']([^"']+)["']/g);
  var fields = allMatches(source, /\bTextField\s*\(\s*["']([^"']+)["']/g);
  var images = allMatches(source, /\bImage\s*\(\s*(?:systemName:\s*)?["']([^"']+)["']/g);
  var seen = 0;

  texts.forEach(function (text) {
    content += '<div class="swift-text">' + escapeHtml(text) + '</div>';
    seen++;
  });
  labels.forEach(function (label) {
    content += '<div class="swift-label">' + escapeHtml(label) + '</div>';
    seen++;
  });
  buttons.forEach(function (label) {
    content += '<button class="swift-button" onclick="this.textContent=\'Pressed!\'">' + escapeHtml(label) + '</button>';
    seen++;
  });
  fields.forEach(function (placeholder) {
    content += '<input class="swift-input" placeholder="' + escapeHtml(placeholder) + '">';
    seen++;
  });
  images.forEach(function (symbol) {
    content += '<div class="swift-image"><span class="sf-symbol">◆</span>' + escapeHtml(symbol.replace(/[-_]/g, ' ')) + '</div>';
    seen++;
  });

  if (!seen) content = '<div class="empty">No supported SwiftUI views found.<br><small>Try Text, Button, Label, TextField, Image, VStack, HStack or ZStack.</small></div>';

  var hasHStack = /\bHStack\b/.test(source);
  var hasZStack = /\bZStack\b/.test(source);
  var hasScroll = /\bScrollView\b/.test(source);
  var hasList = /\bList\b/.test(source);
  var layoutClass = hasHStack ? 'horizontal' : hasZStack ? 'stacked' : 'vertical';
  if (/\bVStack\b/.test(source)) layoutClass = 'vertical';
  if (hasScroll || hasList) layoutClass += ' scroll';

  var html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(title) + '</title><style>' +
    '*{box-sizing:border-box}html,body{margin:0;width:100%;min-height:100%;background:radial-gradient(circle at 50% 25%,#30343b 0,#16181c 42%,#08090b 100%);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Segoe UI",sans-serif}' +
    'body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px 18px;color:#111}' +
    '.device-wrap{position:relative;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 34px 45px rgba(0,0,0,.55))}' +
    /* Keep a true 393x852 logical phone ratio. Scale the entire device uniformly instead of resizing width/height independently. */
    '.device{position:relative;width:393px;height:852px;flex:0 0 393px;background:linear-gradient(145deg,#f4f5f7,#777b81 18%,#17191c 20%,#0b0c0e 80%,#60656b);border-radius:56px;padding:7px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.38),inset 0 0 0 3px rgba(0,0,0,.8),0 0 0 1px #050505;overflow:hidden}' +
    '.device:before{content:"";position:absolute;inset:4px;border-radius:51px;border:1px solid rgba(255,255,255,.18);pointer-events:none;z-index:8}' +
    '.screen-shell{position:relative;width:100%;height:100%;overflow:hidden;border-radius:49px;background:#f2f2f7}' +
    /* Smaller, more realistic Dynamic Island. */
    '.dynamic-island{position:absolute;z-index:20;top:11px;left:50%;transform:translateX(-50%);width:104px;height:30px;border-radius:18px;background:#050505;box-shadow:inset 0 1px 2px rgba(255,255,255,.08),0 1px 2px rgba(0,0,0,.45)}' +
    '.dynamic-island:after{content:"";position:absolute;right:13px;top:9px;width:6px;height:6px;border-radius:50%;background:#18202a;box-shadow:inset 0 0 0 1px #202934}' +
    '.status{position:absolute;z-index:15;top:0;left:0;right:0;height:58px;padding:17px 24px 0;background:linear-gradient(#fff 0%,rgba(255,255,255,.9) 70%,rgba(255,255,255,0));font-size:13px;font-weight:600;color:#111;text-align:left;display:flex;justify-content:space-between}' +
    '.status:after{content:"●  ▰  100%";font-size:11px;letter-spacing:1px}' +
    '.screen{position:absolute;inset:0;padding:82px 22px 34px;display:flex;align-items:stretch;justify-content:flex-start;gap:14px;overflow:auto;background:linear-gradient(#f8f8fa,#f2f2f7)}' +
    '.screen.vertical{flex-direction:column}.screen.horizontal{flex-direction:row;align-items:center;overflow-x:auto}.screen.stacked{position:absolute}.screen.scroll{overflow:auto}' +
    '.swift-text{font-size:20px;line-height:1.35;color:#111;padding:4px 0}.swift-text:first-of-type{font-size:28px;font-weight:700}.swift-label{font-size:18px;color:#333;padding:4px 0}' +
    '.swift-button{border:0;border-radius:14px;padding:14px 18px;background:#007aff;color:#fff;font-size:17px;font-weight:600;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.18)}.swift-button:active{transform:scale(.98)}' +
    '.swift-input{border:1px solid #c7c7cc;border-radius:12px;padding:13px 14px;font-size:17px;background:#fff;outline:none}.swift-input:focus{border-color:#007aff;box-shadow:0 0 0 2px rgba(0,122,255,.15)}' +
    '.swift-image{display:flex;align-items:center;gap:10px;font-size:17px;padding:12px;background:#fff;border-radius:12px;color:#333}.sf-symbol{font-size:22px;color:#007aff}.empty{text-align:center;color:#777;padding:40px 10px;line-height:1.7}' +
    '.home-indicator{position:absolute;z-index:25;bottom:8px;left:50%;transform:translateX(-50%);width:134px;height:5px;border-radius:99px;background:#111;opacity:.9}' +
    '.side-button{position:absolute;left:-3px;width:4px;border-radius:4px;background:#6f7378;box-shadow:0 0 0 1px #18191b}.side-button.one{top:155px;height:42px}.side-button.two{top:209px;height:70px}.side-button.three{top:287px;height:70px}.power{position:absolute;right:-3px;top:218px;height:88px;width:4px;border-radius:4px;background:#6f7378;box-shadow:0 0 0 1px #18191b}' +
    '@media(max-width:430px){.device-wrap{transform:scale(calc((100vw - 36px) / 393));transform-origin:center center}}' +
    '@media(max-height:900px) and (min-width:431px){.device-wrap{transform:scale(calc((100vh - 56px) / 852));transform-origin:center center}}' +
    '</style></head><body><div class="device-wrap"><span class="side-button one"></span><span class="side-button two"></span><span class="side-button three"></span><span class="power"></span><div class="device"><div class="screen-shell"><div class="dynamic-island"></div><div class="status"><span>9:41</span></div><main class="screen ' + layoutClass + '">' + content + '</main><div class="home-indicator"></div></div></div></div></body></html>';

  var url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  var preview = window.open(url, '_blank');
  if (!preview) {
    URL.revokeObjectURL(url);
    throw new Error('SwiftUI preview was blocked by the browser. Allow pop-ups for FluxIDE.');
  }
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  return '✓ SwiftUI iPhone preview opened for ' + file + '. Browser-based; Xcode, macOS and Apple SDKs are not required.';
}

export { executeSwiftUI };
