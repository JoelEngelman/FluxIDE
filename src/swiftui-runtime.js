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

  // FluxIDE's SwiftUI implementation is intentionally a browser renderer.
  // It interprets common SwiftUI view declarations and never invokes Apple's SDKs.
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

  if (!seen) {
    content = '<div class="empty">No supported SwiftUI views found.<br><small>Try Text, Button, Label, TextField, Image, VStack, HStack or ZStack.</small></div>';
  }

  var hasVStack = /\bVStack\b/.test(source);
  var hasHStack = /\bHStack\b/.test(source);
  var hasZStack = /\bZStack\b/.test(source);
  var hasScroll = /\bScrollView\b/.test(source);
  var hasList = /\bList\b/.test(source);
  var backgroundColor = firstMatch(source, /\.background\(\s*Color\.([A-Za-z]+)/, 'system');
  var layoutClass = hasHStack ? 'horizontal' : hasZStack ? 'stacked' : 'vertical';
  if (hasVStack) layoutClass = 'vertical';
  if (hasScroll || hasList) layoutClass += ' scroll';

  var html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(title) + '</title><style>' +
    '*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#111827;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif;display:flex;align-items:center;justify-content:center;padding:24px}' +
    '.device{width:min(390px,100%);min-height:760px;background:#f2f2f7;border:8px solid #111;border-radius:44px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.45)}' +
    '.status{height:42px;padding:13px 18px;background:#fff;font-size:11px;text-align:center;color:#555;border-bottom:1px solid #ddd}' +
    '.screen{min-height:710px;padding:28px 22px;display:flex;align-items:stretch;justify-content:flex-start;gap:14px;overflow:auto;background:#f2f2f7}' +
    '.screen.vertical{flex-direction:column}.screen.horizontal{flex-direction:row;align-items:center;overflow-x:auto}.screen.stacked{position:relative}.screen.scroll{overflow:auto}' +
    '.screen h1{font-size:32px;margin:0 0 6px;font-weight:700;color:#111}.swift-text{font-size:20px;line-height:1.35;color:#111;padding:4px 0}.swift-text:first-of-type{font-size:28px;font-weight:700}.swift-label{font-size:18px;color:#333;padding:4px 0}' +
    '.swift-button{border:0;border-radius:12px;padding:13px 18px;background:#007aff;color:#fff;font-size:17px;font-weight:600;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.15)}.swift-button:active{transform:scale(.98)}' +
    '.swift-input{border:1px solid #c7c7cc;border-radius:11px;padding:13px 14px;font-size:17px;background:#fff;outline:none}.swift-input:focus{border-color:#007aff;box-shadow:0 0 0 2px rgba(0,122,255,.15)}' +
    '.swift-image{display:flex;align-items:center;gap:10px;font-size:17px;padding:12px;background:#fff;border-radius:12px;color:#333}.sf-symbol{font-size:22px;color:#007aff}.empty{text-align:center;color:#777;padding:40px 10px;line-height:1.7}' +
    '</style></head><body><div class="device"><div class="status">FluxIDE SwiftUI Preview · ' + escapeHtml(file) + '</div><main class="screen ' + layoutClass + '"><h1>' + escapeHtml(title) + '</h1>' + content + '</main></div></body></html>';

  var url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  var preview = window.open(url, '_blank');
  if (!preview) {
    URL.revokeObjectURL(url);
    throw new Error('SwiftUI preview was blocked by the browser. Allow pop-ups for FluxIDE.');
  }
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  return '✓ SwiftUI browser preview opened for ' + file + '. This preview is fully browser-based; Xcode, macOS and Apple SDKs are not required.';
}

export { executeSwiftUI };
