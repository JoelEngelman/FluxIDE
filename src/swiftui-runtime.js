function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character];
  });
}

function textValue(source, type) {
  var pattern;
  if (type === 'Text' || type === 'Button' || type === 'TextField') {
    pattern = new RegExp(type + "\\s*\\(\\s*[\\\"']([^\\\"']*)[\\\"']");
  } else if (type === 'Image') {
    pattern = /systemName\\s*:\\s*[\"']([^\"']+)[\"']/;
  }
  var match = pattern ? source.match(pattern) : null;
  return match && match[1] ? match[1] : '';
}

function renderSwiftUI(source) {
  var html = '';
  var matches = source.matchAll(/\\b(Text|Button|TextField|Image|Spacer)\\s*\\(/g);
  for (var match of matches) {
    var type = match[1];
    var value = textValue(source.slice(match.index, match.index + 160), type);

    if (type === 'Text') {
      html += '<p class="flux-swift-text">' + escapeHtml(value) + '</p>';
    } else if (type === 'Button') {
      html += '<button class="flux-swift-button" onclick="this.textContent=\'Pressed!\'">' + escapeHtml(value || 'Button') + '</button>';
    } else if (type === 'TextField') {
      html += '<input class="flux-swift-input" placeholder="' + escapeHtml(value || 'Text') + '">';
    } else if (type === 'Image') {
      html += '<div class="flux-swift-image">' + escapeHtml(value || 'Image') + '</div>';
    } else if (type === 'Spacer') {
      html += '<div class="flux-swift-spacer"></div>';
    }
  }

  return html;
}

export function executeSwiftUI(source, filename) {
  var file = filename || 'ContentView.swift';
  var titleMatch = source.match(/Text\\s*\\(\\s*[\"']([^\"']+)[\"']/);
  var title = titleMatch && titleMatch[1] ? titleMatch[1] : 'SwiftUI Preview';
  var content = renderSwiftUI(source);

  if (!content) {
    content = '<p class="flux-swift-empty">No supported SwiftUI views found yet.</p>';
  }

  var html = '<!doctype html>' +
    '<html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(title) + '</title>' +
    '<style>' +
    'body{margin:0;background:#111827;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
    '.device{width:min(390px,calc(100vw - 32px));min-height:760px;margin:28px auto;background:#f2f2f7;color:#111;border:8px solid #050505;border-radius:44px;overflow:hidden;box-shadow:0 20px 60px #0008}' +
    '.status{text-align:center;font-size:12px;padding:12px;background:#fff}' +
    '.screen{padding:24px;display:flex;flex-direction:column;gap:14px}' +
    '.flux-swift-text{font-size:20px;margin:4px 0}.screen>.flux-swift-text:first-child{font-size:28px;font-weight:700}' +
    '.flux-swift-button{border:0;border-radius:12px;padding:12px 18px;background:#007aff;color:#fff;font-size:16px;cursor:pointer}' +
    '.flux-swift-input{border:1px solid #ccc;border-radius:10px;padding:12px;font-size:16px}' +
    '.flux-swift-image{width:48px;height:48px;border-radius:12px;background:#ddd;display:flex;align-items:center;justify-content:center;color:#666;font-size:11px}' +
    '.flux-swift-spacer{min-height:12px;flex:1}.flux-swift-empty{color:#666}' +
    '</style></head><body>' +
    '<div class="device"><div class="status">FluxIDE · ' + escapeHtml(file) + '</div>' +
    '<div class="screen"><h2>' + escapeHtml(title) + '</h2>' + content + '</div></div>' +
    '</body></html>';

  var url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  var preview = window.open(url, '_blank', 'noopener,noreferrer');
  if (!preview) {
    URL.revokeObjectURL(url);
    throw new Error('SwiftUI preview was blocked by the browser. Allow pop-ups for FluxIDE.');
  }
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  return '✓ SwiftUI preview opened for ' + file + '. Rendered by FluxIDE — no Xcode or macOS required.';
}
