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

function executeSwiftUI(source, filename) {
  var file = filename || 'ContentView.swift';
  var content = '';
  var title = firstMatch(source, /(?:navigationTitle|Text)\s*\(\s*["']([^"']+)["']\s*\)/, 'SwiftUI Preview');

  // Browser-only SwiftUI-style renderer. It deliberately never invokes Swift,
  // SwiftUI, UIKit, AppKit, Xcode, or Apple's SDKs.
  var textPattern = /\b(?:Text|Label)\s*\(\s*["']([^"']+)["']/g;
  var buttonPattern = /\bButton\s*\(\s*["']([^"']+)["']/g;
  var fieldPattern = /\bTextField\s*\(\s*["']([^"']+)["']/g;
  var imagePattern = /\bImage\s*\(\s*(?:systemName:\s*)?["']([^"']+)["']/g;
  var seen = 0;
  var match;

  while ((match = textPattern.exec(source))) {
    content += '<div class="text">' + escapeHtml(match[1]) + '</div>';
    seen++;
  }

  while ((match = buttonPattern.exec(source))) {
    content += '<button class="swift-button" onclick="this.dataset.pressed=\'1\';this.textContent=\'Pressed!\'">' + escapeHtml(match[1]) + '</button>';
    seen++;
  }

  while ((match = fieldPattern.exec(source))) {
    content += '<input class="swift-input" placeholder="' + escapeHtml(match[1]) + '">';
    seen++;
  }

  while ((match = imagePattern.exec(source))) {
    var symbol = escapeHtml(match[1]);
    content += '<div class="symbol" title="' + symbol + '">' + escapeHtml(symbol.replace(/[-_]/g, ' ')) + '</div>';
    seen++;
  }

  if (!seen) {
    content = '<div class="empty">No supported SwiftUI views found.<br><small>Try Text, Button, TextField, Label or Image.</small></div>';
  }

  var background = firstMatch(source, /\.background\(\s*Color\.([A-Za-z]+)/, 'system');
  var html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(title) + '</title><style>' +
    '*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#111827;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif;display:flex;align-items:center;justify-content:center;padding:24px}' +
    '.device{width:min(390px,100%);min-height:760px;background:#f2f2f7;border:8px solid #111;border-radius:44px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.45)}' +
    '.status{height:42px;padding:13px 18px;background:#fff;font-size:11px;text-align:center;color:#555;border-bottom:1px solid #ddd}' +
    '.screen{min-height:710px;padding:28px 22px;display:flex;flex-direction:column;align-items:stretch;gap:14px;overflow:auto}' +
    '.screen:before{content:"' + escapeHtml(background) + '";display:none}' +
    '.screen h1{font-size:32px;margin:0 0 6px;font-weight:700;color:#111}.text{font-size:20px;line-height:1.35;color:#111;padding:4px 0}.text:first-of-type{font-size:28px;font-weight:700}' +
    '.swift-button{border:0;border-radius:12px;padding:13px 18px;background:#007aff;color:#fff;font-size:17px;font-weight:600;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.15)}.swift-button:active{transform:scale(.98)}' +
    '.swift-input{border:1px solid #c7c7cc;border-radius:11px;padding:13px 14px;font-size:17px;background:#fff;outline:none}.swift-input:focus{border-color:#007aff;box-shadow:0 0 0 2px rgba(0,122,255,.15)}' +
    '.symbol{font-size:17px;padding:12px;background:#fff;border-radius:12px;color:#333}.empty{text-align:center;color:#777;padding:40px 10px;line-height:1.7}' +
    '</style></head><body><div class="device"><div class="status">FluxIDE SwiftUI Runtime · ' + escapeHtml(file) + '</div><main class="screen"><h1>' + escapeHtml(title) + '</h1>' + content + '</main></div></body></html>';

  var url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  var preview = window.open(url, '_blank');
  if (!preview) {
    URL.revokeObjectURL(url);
    throw new Error('SwiftUI preview was blocked by the browser. Allow pop-ups for FluxIDE.');
  }
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  return '✓ SwiftUI browser preview opened for ' + file + '. No Xcode, macOS, or Apple SDK is required.';
}

export { executeSwiftUI };
