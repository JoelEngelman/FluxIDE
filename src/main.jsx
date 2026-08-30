import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Editor from '@monaco-editor/react';
import {
  Folder, FileCode2, GitBranch, Search, Play, Save, RefreshCw, Plus,
  Trash2, Terminal, CheckCircle2, Download, Upload, Copy, Command,
  Settings, FilePlus, FolderPlus, History, PanelLeft, Sun, Moon,
  ChevronRight, ChevronDown, Braces, Eye, SplitSquareHorizontal, X,
  Pencil, Globe
} from 'lucide-react';
import { executeSwiftUI } from './swiftui-runtime';
import './styles.css';

const LANGUAGES = [
  ['javascript', 'JavaScript'], ['flux', 'Flux'], ['typescript', 'TypeScript'],
  ['html', 'HTML'], ['css', 'CSS'], ['json', 'JSON'], ['python', 'Python'],
  ['java', 'Java'], ['c', 'C'], ['cpp', 'C++'], ['csharp', 'C#'], ['go', 'Go'],
  ['rust', 'Rust'], ['php', 'PHP'], ['ruby', 'Ruby'], ['swift', 'Swift'],
  ['kotlin', 'Kotlin'], ['dart', 'Dart'], ['sql', 'SQL'], ['shell', 'Shell'],
  ['markdown', 'Markdown'], ['yaml', 'YAML'], ['xml', 'XML'], ['dockerfile', 'Dockerfile'],
  ['graphql', 'GraphQL'], ['lua', 'Lua'], ['perl', 'Perl'], ['r', 'R'],
  ['powershell', 'PowerShell'], ['plaintext', 'Plain Text']
];

const EXTENSIONS = {
  javascript: 'js', flux: 'flux', typescript: 'ts', html: 'html', css: 'css',
  json: 'json', python: 'py', java: 'java', c: 'c', cpp: 'cpp', csharp: 'cs',
  go: 'go', rust: 'rs', php: 'php', ruby: 'rb', swift: 'swift', kotlin: 'kt',
  dart: 'dart', sql: 'sql', shell: 'sh', markdown: 'md', yaml: 'yaml', xml: 'xml',
  dockerfile: 'dockerfile', graphql: 'graphql', lua: 'lua', perl: 'pl', r: 'r',
  powershell: 'ps1', plaintext: 'txt'
};

const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/';

const FILE_ICONS = {
  js: 'javascript/javascript-original.svg',
  jsx: 'javascript/javascript-original.svg',
  ts: 'typescript/typescript-original.svg',
  tsx: 'typescript/typescript-original.svg',
  html: 'html5/html5-original.svg',
  htm: 'html5/html5-original.svg',
  css: 'css3/css3-original.svg',
  scss: 'sass/sass-original.svg',
  sass: 'sass/sass-original.svg',
  json: 'json/json-original.svg',
  py: 'python/python-original.svg',
  java: 'java/java-original.svg',
  c: 'c/c-original.svg',
  h: 'c/c-original.svg',
  cpp: 'cplusplus/cplusplus-original.svg',
  cc: 'cplusplus/cplusplus-original.svg',
  cxx: 'cplusplus/cplusplus-original.svg',
  cs: 'csharp/csharp-original.svg',
  go: 'go/go-original.svg',
  rs: 'rust/rust-original.svg',
  php: 'php/php-original.svg',
  rb: 'ruby/ruby-original.svg',
  swift: 'swift/swift-original.svg',
  kt: 'kotlin/kotlin-original.svg',
  dart: 'dart/dart-original.svg',
  sql: 'azuresqldatabase/azuresqldatabase-original.svg',
  sh: 'bash/bash-original.svg',
  bash: 'bash/bash-original.svg',
  md: 'markdown/markdown-original.svg',
  yaml: 'yaml/yaml-original.svg',
  yml: 'yaml/yaml-original.svg',
  xml: 'xml/xml-original.svg',
  lua: 'lua/lua-original.svg',
  pl: 'perl/perl-original.svg',
  r: 'r/r-original.svg',
  ps1: 'powershell/powershell-original.svg',
  graphql: 'graphql/graphql-plain.svg',
  dockerfile: 'docker/docker-original.svg'
};

const DEFAULT_FILES = {
  'main.js': `function hello() {
  console.log("Hello from FluxIDE!");
}

hello();`,

  'main.flux': `// Welcome to FluxIDE — Flux language
fn main() {
  print("Hello from Flux!");
}
`,

  'README.md': `# FluxIDE

A web-first developer workspace.

Ctrl+K opens the command palette.`,

  'package.json': `{"name":"my-project","version":"1.0.0"}`
};

function detectLanguage(name) {
  const lower = name.toLowerCase();
  const extension =
    lower === 'dockerfile'
      ? 'dockerfile'
      : lower.split('.').pop();

  return {
    flux: 'flux',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'css',
    sass: 'css',
    json: 'json',
    py: 'python',
    java: 'java',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    dart: 'dart',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    lua: 'lua',
    pl: 'perl',
    r: 'r',
    ps1: 'powershell',
    graphql: 'graphql',
    dockerfile: 'dockerfile',
    txt: 'plaintext'
  }[extension] || 'plaintext';
}

function FileIcon({ name }) {
  const lower = name.toLowerCase();
  const extension =
    lower === 'dockerfile'
      ? 'dockerfile'
      : lower.split('.').pop();

  if (extension === 'flux') {
    return (
      <span className="file-icon file-icon-flux">
        <img
          src={`${import.meta.env.BASE_URL}android-chrome-512x512.png`}
          alt="Flux"
          width="16"
          height="16"
        />
      </span>
    );
  }

  const icon = FILE_ICONS[extension];

  if (!icon) {
    return (
      <span className="file-icon file-icon-default">
        <FileCode2 />
      </span>
    );
  }

  return (
    <span className={`file-icon file-icon-${extension}`}>
      <img
        src={`${DEVICON_BASE}${icon}`}
        alt={`${extension} file`}
        width="16"
        height="16"
      />
    </span>
  );
}

function registerFluxLanguage(monaco) {
  if (
    monaco.languages
      .getLanguages()
      .some((language) => language.id === 'flux')
  ) {
    return;
  }

  monaco.languages.register({
    id: 'flux',
    extensions: ['.flux'],
    aliases: ['Flux', 'flux'],
    mimetypes: ['text/x-flux', 'text/flux']
  });

  monaco.languages.setLanguageConfiguration('flux', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },

    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],

    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '`', close: '`' }
    ],

    surroundingPairs: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
      ['"', '"'],
      ["'", "'"],
      ['`', '`']
    ],

    folding: {
      markers: {
        start: /^\s*\/\/\s*#?region\b/,
        end: /^\s*\/\/\s*#?endregion\b/
      }
    }
  });

  const keywords = [
    'if', 'else', 'when', 'otherwise', 'unless', 'while', 'until',
    'repeat', 'loop', 'for', 'in', 'of', 'match', 'case', 'default',
    'break', 'continue', 'return', 'yield', 'try', 'catch', 'finally',
    'throw', 'raise', 'assert', 'let', 'make', 'const', 'fixed', 'var',
    'create', 'define', 'declare', 'set', 'use', 'import', 'export',
    'from', 'as', 'module', 'package', 'project', 'and', 'or', 'not',
    'is', "isn't", 'equals', 'contains', 'starts', 'ends', 'notin',
    'public', 'private', 'protected', 'internal', 'static', 'final',
    'async', 'await', 'native', 'extern', 'inline', 'unsafe', 'sealed',
    'abstract', 'override', 'where', 'with', 'into', 'using', 'by',
    'via', 'on', 'at', 'inside', 'outside', 'before', 'after'
  ];

  const types = [
    'text', 'string', 'number', 'integer', 'decimal', 'boolean', 'bool',
    'list', 'array', 'map', 'object', 'set', 'tuple', 'function', 'fn',
    'void', 'any', 'unknown', 'never', 'byte', 'bytes', 'date', 'time',
    'datetime', 'url', 'path', 'file', 'error'
  ];

  const builtins = [
    'print', 'say', 'write', 'read', 'input', 'ask', 'log', 'debug',
    'warn', 'error', 'panic', 'exit', 'abs', 'ceil', 'floor', 'round',
    'sqrt', 'pow', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
    'ln', 'exp', 'min', 'max', 'clamp', 'random', 'randomInt',
    'randomFloat', 'pi', 'e', 'len', 'length', 'count', 'first', 'last',
    'push', 'pop', 'shift', 'unshift', 'insert', 'remove', 'contains',
    'find', 'filter', 'map', 'reduce', 'sort', 'reverse', 'join', 'split',
    'slice', 'range', 'zip', 'enumerate', 'str', 'text', 'num', 'number',
    'int', 'integer', 'float', 'bool', 'boolean', 'set', 'tuple', 'json',
    'parse', 'stringify', 'now', 'today', 'sleep', 'time', 'clock', 'env',
    'platform', 'os', 'args', 'exec', 'command', 'open', 'close',
    'readFile', 'writeFile', 'appendFile', 'exists', 'deleteFile',
    'copyFile', 'moveFile', 'listFiles', 'mkdir', 'rmdir', 'fetch',
    'request', 'get', 'post', 'put', 'patch', 'delete', 'download',
    'upload', 'connect', 'listen', 'send', 'receive', 'html', 'css',
    'dom', 'element', 'render', 'route', 'serve', 'redirect', 'response'
  ];

  monaco.languages.setMonarchTokensProvider('flux', {
    defaultToken: 'identifier',
    keywords,
    types,
    builtins,

    tokenizer: {
      root: [
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
        [/(?<![A-Za-z0-9_])#.*$/, 'comment'],
        [/#!.*$/, 'comment'],

        [/@[A-Za-z_][A-Za-z0-9_]*/, 'annotation'],

        [
          /\$\{/,
          {
            token: 'delimiter.bracket',
            next: '@interpolation'
          }
        ],

        [
          /"""/,
          {
            token: 'string',
            next: '@tripleString'
          }
        ],

        [
          /"/,
          {
            token: 'string',
            next: '@doubleString'
          }
        ],

        [
          /'/,
          {
            token: 'string',
            next: '@singleString'
          }
        ],

        [
          /`/,
          {
            token: 'string',
            next: '@templateString'
          }
        ],

        [/\b0[xX][0-9A-Fa-f](?:_?[0-9A-Fa-f])*\b/, 'number.hex'],
        [/\b0[bB][01](?:_?[01])*\b/, 'number.binary'],
        [/\b0[oO][0-7](?:_?[0-7])*\b/, 'number.octal'],
        [/\b\d(?:_?\d)*\.\d(?:_?\d)*(?:[eE][+-]?\d+)?\b/, 'number.float'],
        [/\b\d(?:_?\d)*[eE][+-]?\d+\b/, 'number.float'],
        [/\b\d(?:_?\d)*\b/, 'number'],

        [
          /[A-Za-z_][A-Za-z0-9_]*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@types': 'type',
              '@builtins': 'predefined',
              'true|false': 'constant',
              'null|none|nil': 'constant',
              '@default': 'identifier'
            }
          }
        ],

        [/[+\-*\/%=<>!&|^~?:]+/, 'operator'],
        [/[{}()[\],.;]/, 'delimiter'],
        [/\$[A-Za-z_][A-Za-z0-9_]*/, 'variable']
      ],

      comment: [
        [/[^/*]+/, 'comment'],
        [/\/\*/, 'comment', '@push'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment']
      ],

      doubleString: [
        [/\\(?:n|r|t|b|f|v|0|\\|"|'|`)/, 'string.escape'],
        [/\\u\{[0-9A-Fa-f]+\}/, 'string.escape'],
        [/\\x[0-9A-Fa-f]{2}/, 'string.escape'],
        [
          /\$\{/,
          {
            token: 'delimiter.bracket',
            next: '@interpolation'
          }
        ],
        [/[^"\\$]+/, 'string'],
        [
          /"/,
          {
            token: 'string',
            next: '@pop'
          }
        ]
      ],

      singleString: [
        [/\\(?:n|r|t|b|f|v|0|\\|"|'|`)/, 'string.escape'],
        [/\\u\{[0-9A-Fa-f]+\}/, 'string.escape'],
        [/\\x[0-9A-Fa-f]{2}/, 'string.escape'],
        [/[^'\\]+/, 'string'],
        [
          /'/,
          {
            token: 'string',
            next: '@pop'
          }
        ]
      ],

      tripleString: [
        [/\\(?:n|r|t|b|f|v|0|\\|"|'|`)/, 'string.escape'],
        [
          /\$\{/,
          {
            token: 'delimiter.bracket',
            next: '@interpolation'
          }
        ],
        [/[^"\\$]+/, 'string'],
        [
          /"""/,
          {
            token: 'string',
            next: '@pop'
          }
        ]
      ],

      templateString: [
        [/\\(?:n|r|t|b|f|v|0|\\|"|'|`)/, 'string.escape'],
        [
          /\$\{/,
          {
            token: 'delimiter.bracket',
            next: '@interpolation'
          }
        ],
        [/[^`\\$]+/, 'string'],
        [
          /`/,
          {
            token: 'string',
            next: '@pop'
          }
        ]
      ],

      interpolation: [
        [
          /\}/,
          {
            token: 'delimiter.bracket',
            next: '@pop'
          }
        ],
        [/\b\d+(?:\.\d+)?\b/, 'number'],
        [
          /[A-Za-z_][A-Za-z0-9_]*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@types': 'type',
              '@builtins': 'predefined',
              '@default': 'identifier'
            }
          }
        ],
        [/[+\-*\/%=<>!&|^~?:]+/, 'operator'],
        [/\s+/, 'white']
      ]
    }
  });

  monaco.languages.registerCompletionItemProvider('flux', {
    triggerCharacters: ['.', ':'],

    provideCompletionItems: () => ({
      suggestions: builtins.map((label) => ({
        label,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: label
      }))
    })
  });
}

function App() {
  const [files, setFiles] = useState(
    () =>
      JSON.parse(localStorage.getItem('fluxide-files') || 'null') ||
      DEFAULT_FILES
  );

  const [active, setActive] = useState('main.js');
  const [draft, setDraft] = useState(files['main.js'] ?? '');
  const [language, setLanguage] = useState('javascript');
  const [pendingLanguage, setPendingLanguage] = useState(null);

  // NEW: controls the HTML Run popup.
  const [htmlRunPrompt, setHtmlRunPrompt] = useState(false);

  const [query, setQuery] = useState('');
  const [output, setOutput] = useState('Ready. Welcome to FluxIDE.');
  const [version] = useState('0.5.1');
  const [latest, setLatest] = useState(null);
  const [theme, setTheme] = useState(
    localStorage.getItem('fluxide-theme') || 'monokai'
  );

  const [palette, setPalette] = useState(false);
  const [settings, setSettings] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [zoom, setZoom] = useState(14);
  const [history, setHistory] = useState([]);
  const [panel, setPanel] = useState(null);
  const [split, setSplit] = useState(false);
  const [tabs, setTabs] = useState(['main.js']);
  const [outline, setOutline] = useState(true);
  const [terminal, setTerminal] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    localStorage.setItem('fluxide-files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('fluxide-theme', theme);
  }, [theme]);

  useEffect(() => {
    setDraft(files[active] ?? '');
    setLanguage(detectLanguage(active));

    if (!tabs.includes(active)) {
      setTabs((current) => [...current, active]);
    }
  }, [active]);

  useEffect(() => {
    const keyHandler = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 's'
      ) {
        event.preventDefault();
        save();
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault();
        setPalette((v) => !v);
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'p'
      ) {
        event.preventDefault();
        document.querySelector('.search input')?.focus();
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'r'
      ) {
        event.preventDefault();
        openRename();
      }

      if (event.key === 'Escape') {
        setPalette(false);
        setSettings(false);
        setPendingLanguage(null);
        setRenameOpen(false);
        setHtmlRunPrompt(false);
      }
    };

    addEventListener('keydown', keyHandler);

    return () => removeEventListener('keydown', keyHandler);
  }, [draft, active, files, language]);

  const visible = useMemo(
    () =>
      Object.keys(files).filter((file) =>
        file.toLowerCase().includes(query.toLowerCase())
      ),
    [files, query]
  );

  const lines = draft.split('\n');

  const editorTheme =
    theme === 'monokai'
      ? 'fluxide-monokai'
      : theme === 'dark'
        ? 'vs-dark'
        : 'light';

  const togglePanel = (id) =>
    setPanel((current) => (current === id ? null : id));

  function save() {
    setHistory((current) =>
      [
        ...current,
        {
          file: active,
          time: new Date().toLocaleTimeString()
        }
      ].slice(-30)
    );

    setFiles((current) => ({
      ...current,
      [active]: draft
    }));

    setOutput(`✓ Saved ${active}`);
  }

  function newFile() {
    const name = prompt('New file name', 'untitled.js');

    if (!name || files[name]) return;

    setFiles((current) => ({
      ...current,
      [name]: ''
    }));

    setActive(name);
    setOutput(`Created ${name}`);
  }

  function newProject() {
    if (!confirm('Create a new empty project?')) return;

    setFiles({
      'main.js': 'console.log("Hello, FluxIDE!");',
      'README.md': '# New FluxIDE Project\n'
    });

    setTabs(['main.js']);
    setActive('main.js');
    setOutput('New project created.');
  }

  function remove() {
    if (!confirm(`Delete ${active}?`)) return;

    const next = { ...files };
    delete next[active];

    const first =
      Object.keys(next)[0] || 'main.js';

    if (!Object.keys(next).length) {
      next[first] = '';
    }

    setFiles(next);

    setTabs((current) =>
      current.filter((tab) => tab !== active)
    );

    setActive(first);
    setOutput(`Deleted ${active}`);
  }

  function openRename() {
    setRenameValue(active);
    setRenameOpen(true);
  }

  function renameFile() {
    const nextName = renameValue.trim();

    if (!nextName || nextName === active) {
      setRenameOpen(false);
      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(files, nextName)
    ) {
      setOutput(
        `Cannot rename: ${nextName} already exists.`
      );
      return;
    }

    const next = {
      ...files,
      [nextName]: draft
    };

    delete next[active];

    setFiles(next);

    setTabs((current) =>
      current.map((tab) =>
        tab === active ? nextName : tab
      )
    );

    setActive(nextName);
    setRenameOpen(false);

    setOutput(
      `✓ Renamed ${active} → ${nextName}`
    );
  }

  function closeTab(file) {
    const remaining = tabs.filter(
      (tab) => tab !== file
    );

    setTabs(remaining);

    if (
      active === file &&
      remaining.length
    ) {
      setActive(
        remaining[remaining.length - 1]
      );
    }
  }

  function duplicate() {
    let name = active.replace(
      /(\.[^.]*)?$/,
      '-copy$1'
    );

    let index = 2;

    while (
      Object.prototype.hasOwnProperty.call(
        files,
        name
      )
    ) {
      name = active.replace(
        /(\.[^.]*)?$/,
        `-copy${index++}$1`
      );
    }

    setFiles((current) => ({
      ...current,
      [name]: draft
    }));

    setActive(name);
  }

  function requestLanguageChange(nextLanguage) {
    if (nextLanguage === language) return;

    const nextExtension =
      EXTENSIONS[nextLanguage];

    const proposedName = active.includes('.')
      ? `${active.slice(
          0,
          active.lastIndexOf('.')
        )}.${nextExtension}`
      : `${active}.${nextExtension}`;

    setPendingLanguage({
      nextLanguage,
      proposedName
    });
  }

  function confirmLanguageChange() {
    if (!pendingLanguage) return;

    const {
      nextLanguage,
      proposedName
    } = pendingLanguage;

    if (
      Object.prototype.hasOwnProperty.call(
        files,
        proposedName
      ) &&
      proposedName !== active
    ) {
      setOutput(
        `Cannot change file type: ${proposedName} already exists.`
      );

      setPendingLanguage(null);
      return;
    }

    const next = {
      ...files,
      [proposedName]: draft
    };

    delete next[active];

    setFiles(next);

    setTabs((current) =>
      current.map((tab) =>
        tab === active ? proposedName : tab
      )
    );

    setActive(proposedName);
    setLanguage(nextLanguage);
    setPendingLanguage(null);

    setOutput(
      `✓ Changed file type: ${active} → ${proposedName}`
    );
  }

  function run() {
    setPanel('output');

    try {
      /*
       * HTML DOES NOT RUN DIRECTLY.
       *
       * Instead of showing:
       * "Browser execution is not available..."
       *
       * we show the new FluxIDE popup asking whether
       * the user wants to open it in Live Server.
       */
      if (language === 'html') {
        setHtmlRunPrompt(true);
        return;
      }

      if (
        language === 'swift' &&
        /(^|\n)\s*(import\s+(SwiftUI|UIKit|AppKit)|@main\b|struct\s+\w+\s*:\s*(View|App)|UIViewController\b)/m.test(
          draft
        )
      ) {
        setOutput(
          executeSwiftUI(draft, active)
        );
        return;
      }

      if (language === 'javascript') {
        const oldLog = console.log;
        const logs = [];

        try {
          console.log = (...values) =>
            logs.push(
              values.map(String).join(' ')
            );

          new Function(draft)();

          setOutput(
            logs.join('\n') ||
              'Process finished with no console output.'
          );
        } catch (error) {
          setOutput(
            `Runtime error: ${error.message}`
          );
        } finally {
          console.log = oldLog;
        }

        return;
      }

      if (language === 'flux') {
        const printMatches = [
          ...draft.matchAll(
            /\b(?:print|say)\s*\(\s*["']([\s\S]*?)["']\s*\)/g
          )
        ];

        setOutput(
          printMatches.length
            ? printMatches
                .map((match) => match[1])
                .join('\n')
            : 'Flux source loaded. Browser execution currently supports print()/say() string output; full Flux runtime requires the Flux runtime/compiler.'
        );

        return;
      }

      setOutput(
        `${LANGUAGES.find(
          ([id]) => id === language
        )?.[1] || language} editing is supported. Browser execution is not available for this language yet.`
      );
    } catch (error) {
      setOutput(
        `Runtime error: ${error.message}`
      );
    }
  }

  function format() {
    if (language === 'json') {
      try {
        setDraft(
          JSON.stringify(
            JSON.parse(draft),
            null,
            2
          )
        );

        setOutput('✓ Formatted JSON');
      } catch (error) {
        setOutput(
          `Format error: ${error.message}`
        );
      }

      return;
    }

    setDraft(
      draft
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n')
    );

    setOutput(
      '✓ Formatting cleanup complete.'
    );
  }

  function download() {
    const link =
      document.createElement('a');

    link.href = URL.createObjectURL(
      new Blob([draft], {
        type: 'text/plain'
      })
    );

    link.download = active;
    link.click();

    setOutput(
      `Downloaded ${active}`
    );
  }

  function upload() {
    const input =
      document.createElement('input');

    input.type = 'file';
    input.multiple = true;

    input.onchange = () =>
      Array.from(
        input.files || []
      ).forEach((file) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          setFiles((current) => ({
            ...current,
            [file.name]: String(
              reader.result
            )
          }));

          setActive(file.name);
        };

        reader.readAsText(file);
      });

    input.click();
  }

  function copy() {
    navigator.clipboard?.writeText(draft);
    setOutput(
      'Copied contents to clipboard.'
    );
  }

  function openLiveServer() {
    if (
      detectLanguage(active) !== 'html' &&
      language !== 'html'
    ) {
      setOutput(
        'Live Server works with an HTML file. Open an .html file first.'
      );

      setPanel('output');
      return;
    }

    let html = draft;

    Object.entries(files)
      .filter(
        ([name]) =>
          detectLanguage(name) === 'css'
      )
      .forEach(
        ([name, content]) => {
          const escaped =
            name.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&'
            );

          html = html.replace(
            new RegExp(
              `<link[^>]+href=["']${escaped}["'][^>]*>`,
              'gi'
            ),
            `<style>${content}</style>`
          );
        }
      );

    Object.entries(files)
      .filter(
        ([name]) =>
          detectLanguage(name) ===
          'javascript'
      )
      .forEach(
        ([name, content]) => {
          const escaped =
            name.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&'
            );

          html = html.replace(
            new RegExp(
              `<script[^>]+src=["']${escaped}["'][^>]*><\\/script>`,
              'gi'
            ),
            `<script>${content}<\\/script>`
          );
        }
      );

    const preview =
      window.open('', '_blank');

    if (!preview) {
      setOutput(
        'Live Server was blocked by the browser. Allow pop-ups for FluxIDE.'
      );

      return;
    }

    preview.document.write(html);
    preview.document.close();

    setOutput(
      `✓ Live preview opened for ${active}`
    );
  }

  async function updates() {
    setOutput(
      'Checking update endpoint…'
    );

    try {
      const response =
        await fetch(
          `${import.meta.env.BASE_URL}update.json`,
          {
            cache: 'no-store'
          }
        );

      if (!response.ok) {
        throw Error(
          `HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      setLatest(data.version);

      setOutput(
        data.version !== version
          ? `⬆ Update available: ${data.version}`
          : `✓ You are up to date (${version}).`
      );
    } catch (error) {
      setOutput(
        `Update check unavailable. (${error.message})`
      );
    }
  }

  const command = (name) => {
    setPalette(false);

    ({
      new: newFile,
      project: newProject,
      rename: openRename,
      save,
      run,
      live: openLiveServer,
      format,
      download,
      upload,
      updates,
      settings: () =>
        setSettings(true),
      terminal: () =>
        setPanel('terminal'),
      problems: () =>
        setPanel('problems'),
      split: () =>
        setSplit((v) => !v),
      outline: () =>
        setOutline((v) => !v)
    })[name]?.();
  };

  return (
    <div className={`app ${theme}`}>
      <header>
        <button
          className="icon"
          onClick={() =>
            setSidebar((v) => !v)
          }
        >
          <PanelLeft />
        </button>

        <div className="brand">
          <img
            src={`${import.meta.env.BASE_URL}android-chrome-512x512.png`}
            alt="Flux"
          />
          FluxIDE <span>WEB</span>
        </div>

        <div className="actions">
          <button onClick={newProject}>
            <FolderPlus /> New Project
          </button>

          <button onClick={save}>
            <Save /> Save
          </button>

          <button onClick={run}>
            <Play /> Run
          </button>

          <button
            onClick={() =>
              setPalette(true)
            }
          >
            <Command /> Commands
          </button>

          <button
            onClick={() =>
              togglePanel('source')
            }
          >
            <GitBranch /> Source
          </button>

          <button onClick={openLiveServer}>
            <Globe /> Live Server
          </button>

          <button onClick={updates}>
            <RefreshCw /> Updates
          </button>
        </div>

        <div className="version">
          v{version}
          {latest &&
          latest !== version ? (
            <b> → v{latest}</b>
          ) : null}
        </div>
      </header>

      <div className="workspace">
        {sidebar && (
          <aside>
            <div className="side-title">
              <Folder /> EXPLORER

              <button
                className="mini"
                onClick={newFile}
              >
                <Plus />
              </button>
            </div>

            <div className="search">
              <Search />

              <input
                placeholder="Search files (Ctrl+P)"
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
              />
            </div>

            <div className="files">
              {visible.map((file) => (
                <button
                  className={
                    file === active
                      ? 'file active'
                      : 'file'
                  }
                  key={file}
                  onClick={() =>
                    setActive(file)
                  }
                >
                  <FileIcon name={file} />

                  {file}

                  {file === active &&
                  draft !== files[file] ? (
                    <i />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="outline">
              <div
                onClick={() =>
                  setOutline((v) => !v)
                }
              >
                {outline ? (
                  <ChevronDown />
                ) : (
                  <ChevronRight />
                )}

                <Braces /> OUTLINE
              </div>

              {outline && (
                <small>
                  {lines
                    .filter((line) =>
                      /function|class|const|let|var|fn|struct/.test(
                        line
                      )
                    )
                    .slice(0, 10)
                    .map(
                      (
                        line,
                        index
                      ) => (
                        <span
                          key={index}
                        >
                          {line
                            .trim()
                            .slice(
                              0,
                              45
                            )}
                        </span>
                      )
                    )}
                </small>
              )}
            </div>

            <div className="side-bottom">
              <button onClick={newFile}>
                <FilePlus /> New File
              </button>

              <button onClick={upload}>
                <Upload /> Import Files
              </button>

              <button onClick={download}>
                <Download /> Export File
              </button>

              <button onClick={copy}>
                <Copy /> Copy Contents
              </button>

              <button onClick={duplicate}>
                <Copy /> Duplicate
              </button>

              <button onClick={openRename}>
                <Pencil /> Rename
              </button>

              <button onClick={remove}>
                <Trash2 /> Delete
              </button>

              <button
                onClick={() =>
                  togglePanel('source')
                }
              >
                <GitBranch /> Source Control
              </button>

              <button
                onClick={() =>
                  togglePanel('history')
                }
              >
                <History /> Local History
              </button>

              <button
                onClick={() =>
                  setSettings(true)
                }
              >
                <Settings /> Settings
              </button>
            </div>
          </aside>
        )}

        <main>
          <div className="tabs">
            {tabs.map((file) => (
              <div
                className={`tab ${
                  file === active
                    ? 'tab-active'
                    : ''
                }`}
                key={file}
                onClick={() =>
                  setActive(file)
                }
              >
                <FileIcon name={file} />

                {file}

                {file === active &&
                draft !== files[file] ? (
                  <strong>●</strong>
                ) : null}

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    closeTab(file);
                  }}
                >
                  <X />
                </button>
              </div>
            ))}

            <button
              className="newtab"
              onClick={newFile}
            >
              <Plus />
            </button>
          </div>

          <div className="toolbar">
            <select
              value={language}
              onChange={(event) =>
                requestLanguageChange(
                  event.target.value
                )
              }
            >
              {LANGUAGES.map(
                ([id, label]) => (
                  <option
                    key={id}
                    value={id}
                  >
                    {label}
                  </option>
                )
              )}
            </select>

            <button onClick={format}>
              Format
            </button>

            <button
              onClick={() =>
                setZoom((z) =>
                  Math.min(24, z + 1)
                )
              }
            >
              A+
            </button>

            <button
              onClick={() =>
                setZoom((z) =>
                  Math.max(10, z - 1)
                )
              }
            >
              A−
            </button>

            <button
              onClick={() =>
                setSplit((v) => !v)
              }
            >
              <SplitSquareHorizontal />
            </button>

            <span>
              {draft === files[active]
                ? 'Saved'
                : 'Unsaved changes'}{' '}
              · {draft.length} chars · Ln{' '}
              {lines.length}
            </span>
          </div>

          <div
            className={
              split
                ? 'editors split'
                : 'editors'
            }
          >
            <div className="editor">
              <Editor
                height="100%"
                theme={editorTheme}
                language={language}
                value={draft}
                onChange={(value) =>
                  setDraft(value ?? '')
                }
                beforeMount={
                  registerFluxLanguage
                }
                options={{
                  fontSize: zoom,
                  minimap: {
                    enabled: true
                  },
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  bracketPairColorization: {
                    enabled: true
                  },
                  smoothScrolling: true,
                  stickyScroll: {
                    enabled: true
                  },
                  codeLens: true,
                  renderWhitespace:
                    'selection',
                  quickSuggestions: true
                }}
              />
            </div>

            {split && (
              <div className="editor second">
                <Editor
                  height="100%"
                  theme={editorTheme}
                  language={language}
                  value={draft}
                  options={{
                    fontSize: zoom,
                    minimap: {
                      enabled: false
                    },
                    automaticLayout: true,
                    readOnly: true,
                    wordWrap: 'on'
                  }}
                />
              </div>
            )}
          </div>

          {panel && (
            <div className="bottom">
              <div className="bottom-tabs">
                {[
                  [
                    'output',
                    Terminal,
                    'Output'
                  ],
                  [
                    'problems',
                    CheckCircle2,
                    'Problems'
                  ],
                  [
                    'source',
                    GitBranch,
                    'Source Control'
                  ],
                  [
                    'history',
                    History,
                    'History'
                  ],
                  [
                    'terminal',
                    Command,
                    'Terminal'
                  ]
                ].map(
                  ([
                    id,
                    Icon,
                    label
                  ]) => (
                    <button
                      className={
                        panel === id
                          ? 'selected'
                          : ''
                      }
                      key={id}
                      onClick={() =>
                        togglePanel(id)
                      }
                    >
                      <Icon /> {label}
                    </button>
                  )
                )}

                <button
                  className="panel-close"
                  onClick={() =>
                    setPanel(null)
                  }
                >
                  <X />
                </button>
              </div>

              {panel === 'terminal' ? (
                <div className="terminal">
                  <span>$</span>

                  <input
                    autoFocus
                    value={terminal}
                    onChange={(event) =>
                      setTerminal(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        'Enter'
                      ) {
                        setOutput(
                          `$ ${terminal}\nBrowser terminal: execution requires Electron.`
                        );

                        setPanel(
                          'output'
                        );

                        setTerminal(
                          ''
                        );
                      }
                    }}
                  />
                </div>
              ) : (
                <pre>
                  {panel === 'output'
                    ? output
                    : panel === 'problems'
                      ? '✓ No problems reported.'
                      : panel === 'source'
                        ? 'Browser source control workspace ready. Native Git requires Electron or a backend.'
                        : history.length
                          ? history
                              .map(
                                (
                                  item
                                ) =>
                                  `${item.time}  ${item.file}`
                              )
                              .join(
                                '\n'
                              )
                          : 'No local history yet.'}
                </pre>
              )}
            </div>
          )}
        </main>
      </div>

      <footer>
        <span>
          <GitBranch /> main
        </span>

        <span>
          {Object.keys(files).length}{' '}
          files
        </span>

        <span>{language}</span>

        <span>
          Ln {lines.length}
        </span>

        <span>Spaces: 2</span>

        <span>UTF-8</span>

        <span className="grow" />

        <button
          className="icon"
          onClick={() =>
            setTheme((current) =>
              current === 'monokai'
                ? 'light'
                : current === 'light'
                  ? 'dark'
                  : 'monokai'
            )
          }
        >
          {theme === 'light' ? (
            <Moon />
          ) : (
            <Sun />
          )}
        </button>
      </footer>

      {palette && (
        <div
          className="overlay"
          onClick={() =>
            setPalette(false)
          }
        >
          <div
            className="palette"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <input
              autoFocus
              placeholder="Type a command…"
            />

            <button
              onClick={() =>
                command('new')
              }
            >
              <FilePlus /> New File
            </button>

            <button
              onClick={() =>
                command('project')
              }
            >
              <FolderPlus /> New Project
            </button>

            <button
              onClick={() =>
                command('rename')
              }
            >
              <Pencil /> Rename File
            </button>

            <button
              onClick={() =>
                command('save')
              }
            >
              <Save /> Save
            </button>

            <button
              onClick={() =>
                command('run')
              }
            >
              <Play /> Run
            </button>

            <button
              onClick={() =>
                command('live')
              }
            >
              <Globe /> Live Server
            </button>

            <button
              onClick={() =>
                command('format')
              }
            >
              <Braces /> Format Document
            </button>

            <button
              onClick={() =>
                command('split')
              }
            >
              <SplitSquareHorizontal /> Split Editor
            </button>

            <button
              onClick={() =>
                command('terminal')
              }
            >
              <Terminal /> Terminal
            </button>

            <button
              onClick={() =>
                command('problems')
              }
            >
              <CheckCircle2 /> Problems
            </button>

            <button
              onClick={() =>
                command('outline')
              }
            >
              <Eye /> Toggle Outline
            </button>

            <button
              onClick={() =>
                command('download')
              }
            >
              <Download /> Export
            </button>

            <button
              onClick={() =>
                command('upload')
              }
            >
              <Upload /> Import
            </button>

            <button
              onClick={() =>
                command('updates')
              }
            >
              <RefreshCw /> Check Updates
            </button>

            <button
              onClick={() =>
                command('settings')
              }
            >
              <Settings /> Settings
            </button>
          </div>
        </div>
      )}

      {settings && (
        <div
          className="overlay"
          onClick={() =>
            setSettings(false)
          }
        >
          <div
            className="settings"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>
              FluxIDE Settings
            </h2>

            <label>
              Editor font size

              <input
                type="number"
                min="10"
                max="24"
                value={zoom}
                onChange={(event) =>
                  setZoom(
                    Number(
                      event.target.value
                    )
                  )
                }
              />
            </label>

            <p>
              Browser workspace data is
              stored locally. Native folders,
              terminal processes, debugging
              and real Git are reserved for
              the Electron/backend phase.
            </p>

            <button
              onClick={() =>
                setSettings(false)
              }
            >
              Close
            </button>
          </div>
        </div>
      )}

      {pendingLanguage && (
        <div
          className="overlay"
          onClick={() =>
            setPendingLanguage(null)
          }
        >
          <div
            className="settings"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>
              Change file type?
            </h2>

            <p>
              This will rename{' '}
              <strong>{active}</strong> to{' '}
              <strong>
                {pendingLanguage.proposedName}
              </strong>{' '}
              and change the editor
              language.
            </p>

            <p>
              <strong>
                Risks:
              </strong>{' '}
              changing the file extension
              can alter syntax highlighting,
              tooling, formatting and how
              other programs interpret the
              file. The code itself will not
              be automatically converted.
            </p>

            <div className="settings-actions">
              <button
                onClick={() =>
                  setPendingLanguage(null)
                }
              >
                Cancel
              </button>

              <button
                onClick={
                  confirmLanguageChange
                }
              >
                Proceed & Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {renameOpen && (
        <div
          className="overlay"
          onClick={() =>
            setRenameOpen(false)
          }
        >
          <div
            className="settings"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>
              Rename File
            </h2>

            <input
              autoFocus
              value={renameValue}
              onChange={(event) =>
                setRenameValue(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  'Enter'
                ) {
                  renameFile();
                }
              }}
            />

            <div className="settings-actions">
              <button
                onClick={() =>
                  setRenameOpen(false)
                }
              >
                Cancel
              </button>

              <button
                onClick={renameFile}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          NEW HTML RUN POPUP
          ========================================================= */}
      {htmlRunPrompt && (
        <div
          className="overlay"
          onClick={() =>
            setHtmlRunPrompt(false)
          }
        >
          <div
            className="settings"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>
              Open HTML in Live Server?
            </h2>

            <p>
              HTML files can't be executed
              directly by FluxIDE's Run
              button. Would you like to open
              this file in Live Server instead?
            </p>

            <div className="settings-actions">
              <button
                onClick={() =>
                  setHtmlRunPrompt(false)
                }
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setHtmlRunPrompt(false);
                  openLiveServer();
                }}
              >
                <Globe /> Open in Live Server
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(
  document.getElementById('root')
).render(<App />);
