import { defineConfig } from 'tsup';
import { chmodSync, readFileSync, writeFileSync } from 'node:fs';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    lint: 'src/lint/lint.ts',
    'form-lint': 'scripts/form-lint.ts',
  },
  format: ['cjs', 'esm'],
  dts: {
    // Don't emit .d.ts for the CLI bin — it's not a public module.
    entry: { index: 'src/index.ts', lint: 'src/lint/lint.ts' },
  },
  clean: true,
  sourcemap: true,
  target: 'node18',
  splitting: false,
  async onSuccess() {
    // Add a shebang to the CLI bin so `npm exec form-lint` works.
    for (const ext of ['cjs', 'js']) {
      const path = `dist/form-lint.${ext}`;
      try {
        const body = readFileSync(path, 'utf8');
        if (!body.startsWith('#!')) {
          writeFileSync(path, `#!/usr/bin/env node\n${body}`);
        }
        chmodSync(path, 0o755);
      } catch {
        // file may not exist for a given format; ignore.
      }
    }
  },
});
