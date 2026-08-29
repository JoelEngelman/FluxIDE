function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[character];
  });
}

function executeSwiftUI(source, filename) {
  var file = filename || 'ContentView.swift';
  var textMatches = source.match(/Text\s*\(\s*["']([^"']+)["']/g) || [];
  var buttonMatches = source.match(/Button\s*\(\s*["']([^"']+)["']/g) || [];
  var inputMatches = source.match(/TextField\s*\(\s*["']([^"']+)["']/g) || [];
  var content = '';
  textMatches.forEach(function (item) {
    var match = item.match(/["']([^"']+)["']/);
    if (match) content += '<p class="text">' + escapeHtml(match[1]) + '</p>';
  });
  buttonMatches.forEach(function (item) {
    var match = item.match(/["']([^"']+)["']/);
    if (match) content += '<button onclick="this.textContent=\'Pressed!\'">' + escapeHtml(match[1]) + '</button>';
  });
  inputMatches.forEach(function (item) {
    var match = item.match(/["']([^"']+)["']/);
    if (match) content += '<input placeholder="' + escapeHtml(match[1]) + '">';
  });
  var titleMatch = source.match(/Text\s*\(\s*["']([^"']+)["']/);
  var title = titleMatch ? titleMatch[1] : 'SwiftUI Preview';
  if (!content) content = '<p class="empty">No supported SwiftUI views found yet.</p>';
  var html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(title) + '</title><style>' +
    'body{margin:0;background:#111827;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.device{width:min(390px,calc(100vw - 32px));min-height:760px;margin:24px auto;background:#f2f2f7;border:8px solid #111;border-radius:44px;overflow:hidden}.status{padding:12px;text-align:center;background:#fff;font-size:12px}.screen{padding:24px;display:flex;flex-direction:column;gap:14px}.text{font-size:20px}.screen>.text:first-child{font-size:28px;font-weight:700}button{border:0;border-radius:12px;padding:12px 18px;background:#007aff;color:white;font-size:16px}input{border:1px solid #ccc;border-radius:10px;padding:12px;font-size:16px}.empty{color:#666}' +
    '</style></head><body><div class="device"><div class="status">FluxIDE · ' + escapeHtml(file) + '</div><div class="screen"><h2>' + escapeHtml(title) + '</h2>' + content + '</div></div></body></html>';
  var url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  var preview = window.open(url, '_blank');
  if (!preview) {
    URL.revokeObjectURL(url);
    throw new Error('SwiftUI preview was blocked by the browser. Allow pop-ups for FluxIDE.');
  }
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  return 'SwiftUI preview opened for ' + file + '. Rendered by FluxIDE — no Xcode or macOS required.';
}

export { executeSwiftUI };
