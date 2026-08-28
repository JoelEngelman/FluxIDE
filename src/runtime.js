const JUDGE0_URL = import.meta.env.VITE_EXECUTION_API_URL || 'https://ce.judge0.com';

let languagesPromise;

function chooseLanguageId(languages, language) {
  const patterns = {
    javascript: /^JavaScript \(/i,
    typescript: /^TypeScript \(/i,
    python: /^Python \(3/i,
    java: /^Java \(/i,
    c: /^C \(/i,
    cpp: /^C\+\+ \(/i,
    csharp: /^C# \(/i,
    go: /^Go \(/i,
    rust: /^Rust \(/i,
    php: /^PHP \(/i,
    ruby: /^Ruby \(/i,
    swift: /^Swift \(/i,
    kotlin: /^Kotlin \(/i,
    dart: /^Dart \(/i,
    sql: /^SQL \(/i,
    shell: /^Bash \(/i,
    lua: /^Lua \(/i,
    perl: /^Perl \(/i,
    r: /^R \(/i,
    powershell: /^PowerShell \(/i
  };

  const pattern = patterns[language];
  if (!pattern) return null;

  const matches = languages.filter((item) => pattern.test(item.name));
  if (!matches.length) return null;

  return matches.sort((a, b) => b.name.localeCompare(a.name))[0].id;
}

async function getLanguages() {
  if (!languagesPromise) {
    languagesPromise = fetch(`${JUDGE0_URL}/languages/`)
      .then((response) => {
        if (!response.ok) throw new Error(`Execution service returned HTTP ${response.status}`);
        return response.json();
      });
  }
  return languagesPromise;
}

async function executeJudge0(language, source) {
  const languages = await getLanguages();
  const languageId = chooseLanguageId(languages, language);

  if (!languageId) {
    throw new Error(`No browser execution runtime is currently available for ${language}.`);
  }

  const response = await fetch(`${JUDGE0_URL}/submissions?wait=true&base64_encoded=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language_id: languageId,
      source_code: source,
      cpu_time_limit: 3,
      wall_time_limit: 8,
      memory_limit: 128000
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Execution service returned HTTP ${response.status}${body ? `: ${body}` : ''}`);
  }

  const result = await response.json();
  const output = [result.stdout, result.stderr, result.compile_output, result.message]
    .filter(Boolean)
    .join('');

  const status = result.status?.description || 'Finished';
  return `${output || '(no output)'}\n\n[${status}]${result.time ? ` ${result.time}s` : ''}`;
}

function executeFlux(source) {
  const body = source
    .replace(/\/\/.*$/gm, '')
    .replace(/\bfn\s+main\s*\(\s*\)\s*\{([\s\S]*)\}/m, '$1');
  const variables = new Map();
  const output = [];

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim().replace(/;$/, '');
    if (!line) continue;

    const declaration = line.match(/^(?:let|const)\s+([A-Za-z_][\w]*)\s*=\s*(.+)$/);
    if (declaration) {
      variables.set(declaration[1], evaluateFluxExpression(declaration[2], variables));
      continue;
    }

    const print = line.match(/^print\s*\((.*)\)$/);
    if (print) {
      output.push(String(evaluateFluxExpression(print[1], variables)));
      continue;
    }

    throw new Error(`Flux interpreter: unsupported statement: ${line}`);
  }

  return output.join('\n') || 'Process finished with no console output.';
}

function evaluateFluxExpression(expression, variables) {
  const value = expression.trim();

  if (/^"[\s\S]*"$/.test(value) || /^'[^']*'$/.test(value)) {
    return value.slice(1, -1);
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (variables.has(value)) return variables.get(value);

  if (/^[\d\s+\-*/().]+$/.test(value)) {
    return Function(`"use strict"; return (${value})`)();
  }

  return value;
}

export async function executeCode(language, source, filename) {
  if (language === 'javascript') {
    const logs = [];
    const oldLog = console.log;
    try {
      console.log = (...values) => logs.push(values.map(String).join(' '));
      new Function(source)();
      return logs.join('\n') || 'Process finished with no console output.';
    } catch (error) {
      throw new Error(`Runtime error: ${error.message}`);
    } finally {
      console.log = oldLog;
    }
  }

  if (language === 'flux') return executeFlux(source);

  if (language === 'html') {
    const blob = new Blob([source], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return `Live preview opened for ${filename}.`;
  }

  if (language === 'css') {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>FluxIDE CSS Preview</title><style>${source}</style></head><body><div class="preview">FluxIDE CSS Preview</div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return 'CSS preview opened in a new tab.';
  }

  if (language === 'json') {
    JSON.parse(source);
    return '✓ Valid JSON. Nothing to execute.';
  }

  if (['markdown', 'yaml', 'xml', 'dockerfile', 'graphql', 'plaintext'].includes(language)) {
    return `${language} is an editable/preview-oriented file type, not an executable program.`;
  }

  return executeJudge0(language, source);
}
