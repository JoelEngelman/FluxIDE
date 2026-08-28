import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function runtimeTransform() {
  return {
    name: 'fluxide-runtime-transform',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.jsx')) return null;

      const withRuntimeImport = code.replace(
        "import './styles.css';",
        "import './styles.css';\nimport { executeCode } from './runtime.js';"
      );

      const replacement = `  async function run() {
    setPanel('output');
    setOutput(\`▶ Running \${active}...\`);

    try {
      const result = await executeCode(language, draft, active);
      setOutput(result);
    } catch (error) {
      setOutput(\`Runtime error: \${error.message}\`);
    }
  }

  function format() {`;

      const transformed = withRuntimeImport.replace(
        /  function run\\(\\) \\{[\\s\\S]*?\\n  \\}\\n\\n  function format\\(\\) \\{/,
        replacement
      );

      if (transformed === withRuntimeImport) {
        throw new Error('FluxIDE build transform could not locate the run() function in src/main.jsx');
      }

      return { code: transformed, map: null };
    }
  };
}

export default defineConfig({
  plugins: [runtimeTransform(), react()],
  base: '/FluxIDE/'
});
