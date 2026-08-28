import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Editor from '@monaco-editor/react';
import {
  Folder,
  FileCode2,
  GitBranch,
  Search,
  Play,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Terminal,
  CheckCircle2,
  Download,
  Upload,
  Copy,
  Command,
  Settings,
  FilePlus,
  FolderPlus,
  History,
  PanelLeft,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  Braces,
  Eye,
  SplitSquareHorizontal,
  X,
} from 'lucide-react';
import './styles.css';

const LANGUAGES = [
  ['javascript', 'JavaScript'],
  ['flux', 'Flux'],
  ['typescript', 'TypeScript'],
  ['html', 'HTML'],
  ['css', 'CSS'],
  ['json', 'JSON'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['c', 'C'],
  ['cpp', 'C++'],
  ['csharp', 'C#'],
  ['go', 'Go'],
  ['rust', 'Rust'],
  ['php', 'PHP'],
  ['ruby', 'Ruby'],
  ['swift', 'Swift'],
  ['kotlin', 'Kotlin'],
  ['dart', 'Dart'],
  ['sql', 'SQL'],
  ['shell', 'Shell'],
  ['markdown', 'Markdown'],
  ['yaml', 'YAML'],
  ['xml', 'XML'],
  ['dockerfile', 'Dockerfile'],
  ['graphql', 'GraphQL'],
  ['lua', 'Lua'],
  ['perl', 'Perl'],
  ['r', 'R'],
  ['powershell', 'PowerShell'],
  ['plaintext', 'Plain Text'],
];

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
  'package.json': `{
  "name": "my-project",
  "version": "1.0.0"
}`,
};

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
  dockerfile: 'docker/docker-original.svg',
};

const DEVICON_BASE =
  'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/';

function detectLanguage(name) {
  const extension = name.toLowerCase().split('.').pop();

  return (
    {
      flux: 'flux',
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      html: 'html',
      htm: 'html',
      css: 'css',
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
    }[extension] || 'plaintext'
  );
}

function FileIcon({ name }) {
  const lowerName = name.toLowerCase();
  const extension = lowerName.split('.').pop();

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

  // Special filenames get their own product icons.
  if (lowerName === 'dockerfile') {
    return (
      <span className="file-icon file-icon-dockerfile">
        <img
          src={`${DEVICON_BASE}${FILE_ICONS.dockerfile}`}
          alt="Dockerfile"
          width="16"
          height="16"
        />
      </span>
    );
  }

  const icon = FILE_ICONS[extension];

  if (icon) {
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

  return (
    <span className="file-icon file-icon-default">
      <FileCode2 />
    </span>
  );
}

function App() {
  const [files, setFiles] = useState(
    () =>
      JSON.parse(localStorage.getItem('fluxide-files') || 'null') ||
      DEFAULT_FILES,
  );
  const [active, setActive] = useState('main.js');
  const [draft, setDraft] = useState(files['main.js']);
  const [language, setLanguage] = useState('javascript');
  const [query, setQuery] = useState('');
  const [output, setOutput] = useState('Ready. Welcome to FluxIDE.');
  const [version] = useState('0.4.0');
  const [latest, setLatest] = useState(null);
  const [theme, setTheme] = useState(
    localStorage.getItem('fluxide-theme') || 'monokai',
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

  useEffect(() => {
    localStorage.setItem('fluxide-files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    setDraft(files[active] ?? '');
    setLanguage(detectLanguage(active));

    if (!tabs.includes(active)) {
      setTabs((currentTabs) => [...currentTabs, active]);
    }
  }, [active]);

  useEffect(() => {
    localStorage.setItem('fluxide-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPalette((value) => !value);
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        document.querySelector('.search input')?.focus();
      }

      if (event.key === 'Escape') {
        setPalette(false);
        setSettings(false);
      }
    };

    addEventListener('keydown', handleKeyDown);
    return () => removeEventListener('keydown', handleKeyDown);
  }, [draft, active, files]);

  const visible = useMemo(
    () =>
      Object.keys(files).filter((file) =>
        file.toLowerCase().includes(query.toLowerCase()),
      ),
    [files, query],
  );

  function save() {
    setHistory((currentHistory) =>
      [
        ...currentHistory,
        {
          file: active,
          time: new Date().toLocaleTimeString(),
          content: files[active],
        },
      ].slice(-30),
    );

    setFiles((currentFiles) => ({ ...currentFiles, [active]: draft }));
    setOutput(`✓ Saved ${active}`);
  }

  function newFile() {
    const name = prompt('New file name', 'untitled.js');
    if (!name || files[name]) return;

    setFiles((currentFiles) => ({ ...currentFiles, [name]: '' }));
    setActive(name);
    setOutput(`Created ${name}`);
  }

  function newProject() {
    if (!confirm('Create a new empty project?')) return;

    setFiles({
      'main.js': 'console.log("Hello, FluxIDE!");',
      'README.md': '# New FluxIDE Project\n',
    });
    setTabs(['main.js']);
    setActive('main.js');
    setOutput('New project created.');
  }

  function remove() {
    if (!confirm(`Delete ${active}?`)) return;

    const newFiles = { ...files };
    delete newFiles[active];

    const firstFile = Object.keys(newFiles)[0] || 'main.js';
    if (!Object.keys(newFiles).length) newFiles[firstFile] = '';

    setFiles(newFiles);
    setTabs((currentTabs) => currentTabs.filter((tab) => tab !== active));
    setActive(firstFile);
    setOutput(`Deleted ${active}`);
  }

  function closeTab(file) {
    const remainingTabs = tabs.filter((tab) => tab !== file);
    setTabs(remainingTabs);

    if (active === file && remainingTabs.length) {
      setActive(remainingTabs[remainingTabs.length - 1]);
    }
  }

  function duplicate() {
    let name = active.replace(/(\.[^.]*)?$/, '-copy$1');
    let index = 2;

    while (files[name]) {
      name = active.replace(/(\.[^.]*)?$/, `-copy${index++}$1`);
    }

    setFiles((currentFiles) => ({ ...currentFiles, [name]: draft }));
    setActive(name);
  }

  function run() {
    setPanel('output');

    if (language !== 'javascript') {
      setOutput(
        `${language} editing is supported. Native execution arrives with Electron.`,
      );
      return;
    }

    try {
      const logs = [];
      const oldConsoleLog = console.log;
      console.log = (...values) => logs.push(values.map(String).join(' '));
      new Function(draft)();
      console.log = oldConsoleLog;
      setOutput(
        logs.join('\n') || 'Process finished with no console output.',
      );
    } catch (error) {
      setOutput(`Runtime error: ${error.message}`);
    }
  }

  function format() {
    if (language === 'json') {
      try {
        setDraft(JSON.stringify(JSON.parse(draft), null, 2));
        setOutput('✓ Formatted JSON');
      } catch (error) {
        setOutput(`Format error: ${error.message}`);
      }
      return;
    }

    setDraft(
      draft
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n'),
    );
  }

  function download() {
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(
      new Blob([draft], { type: 'text/plain' }),
    );
    anchor.download = active;
    anchor.click();
    setOutput(`Downloaded ${active}`);
  }

  function upload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;

    input.onchange = () => {
      Array.from(input.files || []).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setFiles((currentFiles) => ({
            ...currentFiles,
            [file.name]: String(reader.result),
          }));
          setActive(file.name);
        };
        reader.readAsText(file);
      });
    };

    input.click();
  }

  function copy() {
    navigator.clipboard?.writeText(draft);
    setOutput('Copied contents to clipboard.');
  }

  async function updates() {
    setOutput('Checking update endpoint…');

    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}update.json`,
        { cache: 'no-store' },
      );

      if (!response.ok) throw Error(`HTTP ${response.status}`);

      const data = await response.json();
      setLatest(data.version);
      setOutput(
        data.version !== version
          ? `⬆ Update available: ${data.version}`
          : `✓ You are up to date (${version}).`,
      );
    } catch (error) {
      setOutput(`Update check unavailable. (${error.message})`);
    }
  }

  function command(commandName) {
    setPalette(false);

    (
      {
        new: newFile,
        project: newProject,
        save,
        run,
        format,
        download,
        upload,
        updates,
        settings: () => setSettings(true),
        terminal: () => setPanel('terminal'),
        problems: () => setPanel('problems'),
        split: () => setSplit((value) => !value),
        outline: () => setOutline((value) => !value),
      }[commandName]
    )?.();
  }

  const lines = draft.split('\n');
  const togglePanel = (id) =>
    setPanel((currentPanel) => (currentPanel === id ? null : id));
  const monokai = theme === 'monokai';

  return (
    <div className={`app ${theme}`}>
      <header>
        <button className="icon" onClick={() => setSidebar((value) => !value)}>
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
          <button onClick={newProject}><FolderPlus /> New Project</button>
          <button onClick={save}><Save /> Save</button>
          <button onClick={run}><Play /> Run</button>
          <button onClick={() => setPalette(true)}><Command /> Commands</button>
          <button onClick={() => togglePanel('source')}><GitBranch /> Source</button>
          <button onClick={updates}><RefreshCw /> Updates</button>
        </div>

        <div className="version">
          v{version}
          {latest && latest !== version ? <b> → v{latest}</b> : null}
        </div>
      </header>

      <div className="workspace">
        {sidebar && (
          <aside>
            <div className="side-title">
              <Folder /> EXPLORER
              <button className="mini" onClick={newFile}><Plus /></button>
            </div>

            <div className="search">
              <Search />
              <input
                placeholder="Search files (Ctrl+P)"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="files">
              {visible.map((file) => (
                <button
                  className={file === active ? 'file active' : 'file'}
                  key={file}
                  onClick={() => setActive(file)}
                >
                  <FileIcon name={file} />
                  {file}
                  {file === active && draft !== files[file] ? <i /> : null}
                </button>
              ))}
            </div>

            <div className="outline">
              <div onClick={() => setOutline((value) => !value)}>
                {outline ? <ChevronDown /> : <ChevronRight />}
                <Braces /> OUTLINE
              </div>
              {outline && (
                <small>
                  {lines
                    .filter((line) => /function|class|const|let|var|fn|struct/.test(line))
                    .slice(0, 10)
                    .map((line, index) => (
                      <span key={index}>{line.trim().slice(0, 45)}</span>
                    ))}
                </small>
              )}
            </div>

            <div className="side-bottom">
              <button onClick={newFile}><FilePlus /> New File</button>
              <button onClick={upload}><Upload /> Import Files</button>
              <button onClick={download}><Download /> Export File</button>
              <button onClick={copy}><Copy /> Copy Contents</button>
              <button onClick={duplicate}><Copy /> Duplicate</button>
              <button onClick={remove}><Trash2 /> Delete</button>
              <button onClick={() => togglePanel('source')}><GitBranch /> Source Control</button>
              <button onClick={() => togglePanel('history')}><History /> Local History</button>
              <button onClick={() => setSettings(true)}><Settings /> Settings</button>
            </div>
          </aside>
        )}

        <main>
          <div className="tabs">
            {tabs.map((file) => (
              <div
                className={`tab ${file === active ? 'tab-active' : ''}`}
                key={file}
                onClick={() => setActive(file)}
              >
                <FileIcon name={file} />
                {file}
                {file === active && draft !== files[file] ? <strong>●</strong> : null}
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
            <button className="newtab" onClick={newFile}><Plus /></button>
          </div>

          <div className="toolbar">
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              {LANGUAGES.map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
            <button onClick={format}>Format</button>
            <button onClick={() => setZoom((value) => Math.min(24, value + 1))}>A+</button>
            <button onClick={() => setZoom((value) => Math.max(10, value - 1))}>A−</button>
            <button onClick={() => setSplit((value) => !value)}><SplitSquareHorizontal /></button>
            <span>
              {draft === files[active] ? 'Saved' : 'Unsaved changes'} · {draft.length} chars · Ln {lines.length}
            </span>
          </div>

          <div className={split ? 'editors split' : 'editors'}>
            <div className="editor">
              <Editor
                height="100%"
                theme={monokai ? 'fluxide-monokai' : theme === 'dark' ? 'vs-dark' : 'light'}
                language={language}
                value={draft}
                onChange={(value) => setDraft(value ?? '')}
                beforeMount={(monaco) => {
                  monaco.languages.register({ id: 'flux', extensions: ['.flux'], aliases: ['Flux'] });
                  monaco.languages.setMonarchTokensProvider('flux', {
                    tokenizer: {
                      root: [
                        [/\/\/.*$/, 'comment'],
                        [/\b(fn|function|let|const|if|else|return|true|false|struct|import|from|match|for|while|in)\b/, 'keyword'],
                        [/'"'"'[^'"'"']*'"'"'/, 'string'],
                        [/\b\d+(\.\d+)?\b/, 'number'],
                        [/\b[A-Z][A-Za-z0-9_]*\b/, 'type'],
                        [/[{}()[\]]/, 'delimiter.bracket'],
                      ],
                    },
                  });
                  monaco.editor.defineTheme('fluxide-monokai', {
                    base: 'vs-dark',
                    inherit: false,
                    rules: [
                      { token: 'comment', foreground: '75715E' },
                      { token: 'keyword', foreground: 'F92672' },
                      { token: 'number', foreground: 'AE81FF' },
                      { token: 'string', foreground: 'E6DB74' },
                      { token: 'type', foreground: '66D9EF' },
                      { token: 'delimiter', foreground: 'F8F8F2' },
                      { token: 'identifier', foreground: 'F8F8F2' },
                    ],
                    colors: {
                      'editor.background': '#272822',
                      'editor.foreground': '#F8F8F2',
                      'editorLineNumber.foreground': '#75715E',
                      'editorLineNumber.activeForeground': '#F8F8F2',
                      'editorCursor.foreground': '#F8F8F0',
                      'editor.selectionBackground': '#49483E',
                      'editor.inactiveSelectionBackground': '#3E3D32',
                      'editor.lineHighlightBackground': '#2E2F28',
                      'editorIndentGuide.background': '#3E3D32',
                      'editorIndentGuide.activeBackground': '#75715E',
                      'editorWidget.background': '#1E1F1C',
                      'editorSuggestWidget.background': '#1E1F1C',
                      'editorSuggestWidget.border': '#49483E',
                    },
                  });
                }}
                options={{
                  fontSize: zoom,
                  minimap: { enabled: true },
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  bracketPairColorization: { enabled: true },
                  smoothScrolling: true,
                  stickyScroll: { enabled: true },
                  codeLens: true,
                  renderWhitespace: 'selection',
                  quickSuggestions: true,
                }}
              />
            </div>

            {split && (
              <div className="editor second">
                <Editor
                  height="100%"
                  theme={monokai ? 'fluxide-monokai' : theme === 'dark' ? 'vs-dark' : 'light'}
                  language={language}
                  value={draft}
                  options={{
                    fontSize: zoom,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    readOnly: true,
                    wordWrap: 'on',
                  }}
                />
              </div>
            )}
          </div>

          {panel && (
            <div className="bottom">
              <div className="bottom-tabs">
                {[
                  ['output', Terminal, 'Output'],
                  ['problems', CheckCircle2, 'Problems'],
                  ['source', GitBranch, 'Source Control'],
                  ['history', History, 'History'],
                  ['terminal', Command, 'Terminal'],
                ].map(([id, Icon, label]) => (
                  <button
                    className={panel === id ? 'selected' : ''}
                    key={id}
                    onClick={() => togglePanel(id)}
                  >
                    <Icon /> {label}
                  </button>
                ))}
                <button className="panel-close" onClick={() => setPanel(null)}><X /></button>
              </div>

              {panel === 'terminal' ? (
                <div className="terminal">
                  <span>$</span>
                  <input
                    autoFocus
                    value={terminal}
                    onChange={(event) => setTerminal(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        setOutput(`$ ${terminal}\nBrowser terminal: execution requires Electron.`);
                        setPanel('output');
                        setTerminal('');
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
                          ? history.map((item) => `${item.time}  ${item.file}`).join('\n')
                          : 'No local history yet.'}
                </pre>
              )}
            </div>
          )}
        </main>
      </div>

      <footer>
        <span><GitBranch /> main</span>
        <span>{Object.keys(files).length} files</span>
        <span>{language}</span>
        <span>Ln {lines.length}</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        <span className="grow" />
        <button
          className="icon"
          onClick={() => setTheme((value) => value === 'monokai' ? 'light' : value === 'light' ? 'dark' : 'monokai')}
        >
          {theme === 'light' ? <Moon /> : <Sun />}
        </button>
      </footer>

      {palette && (
        <div className="overlay" onClick={() => setPalette(false)}>
          <div className="palette" onClick={(event) => event.stopPropagation()}>
            <input autoFocus placeholder="Type a command…" />
            <button onClick={() => command('new')}><FilePlus /> New File</button>
            <button onClick={() => command('project')}><FolderPlus /> New Project</button>
            <button onClick={() => command('save')}><Save /> Save</button>
            <button onClick={() => command('run')}><Play /> Run</button>
            <button onClick={() => command('format')}><Braces /> Format Document</button>
            <button onClick={() => command('split')}><SplitSquareHorizontal /> Split Editor</button>
            <button onClick={() => command('terminal')}><Terminal /> Terminal</button>
            <button onClick={() => command('problems')}><CheckCircle2 /> Problems</button>
            <button onClick={() => command('outline')}><Eye /> Toggle Outline</button>
            <button onClick={() => command('download')}><Download /> Export</button>
            <button onClick={() => command('upload')}><Upload /> Import</button>
            <button onClick={() => command('updates')}><RefreshCw /> Check Updates</button>
            <button onClick={() => command('settings')}><Settings /> Settings</button>
          </div>
        </div>
      )}

      {settings && (
        <div className="overlay" onClick={() => setSettings(false)}>
          <div className="settings" onClick={(event) => event.stopPropagation()}>
            <h2>FluxIDE Settings</h2>
            <label>
              Editor font size
              <input
                type="number"
                min="10"
                max="24"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>
            <p>
              Browser workspace data is stored locally. Native folders, terminal processes,
              debugging and real Git are reserved for the Electron/backend phase.
            </p>
            <button onClick={() => setSettings(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
