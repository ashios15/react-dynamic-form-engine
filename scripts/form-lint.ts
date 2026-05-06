#!/usr/bin/env node
/**
 * form-lint — static analyzer for FormConfig JSON files.
 *
 * Usage:
 *   form-lint <path-to-config.json> [--json]
 *   cat config.json | form-lint [--json]
 *
 * Exit codes:
 *   0  no errors (warnings allowed)
 *   1  usage / IO / parse error
 *   2  at least one error found
 *
 * The config must be a plain JSON object shaped like `FormConfig`. Zod
 * validators attached to fields can't survive JSON serialization, so the
 * validation-type-mismatch rule is a no-op for the CLI — use the programmatic
 * `lint()` for that.
 */
import { readFileSync } from 'node:fs';
import { lint, formatReport, type LintReport } from '../src/lint/lint';
import type { FormConfig } from '../src/types';

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function fail(message: string): never {
  process.stderr.write(`form-lint: ${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const pathArg = args.find((a) => !a.startsWith('--'));

  let raw: string;
  if (pathArg) {
    try {
      raw = readFileSync(pathArg, 'utf8');
    } catch (err) {
      fail(`cannot read ${pathArg}: ${(err as Error).message}`);
    }
  } else if (!process.stdin.isTTY) {
    raw = await readStdin();
  } else {
    fail('no config provided (pass a path or pipe JSON on stdin)');
  }

  let config: FormConfig;
  try {
    config = JSON.parse(raw) as FormConfig;
  } catch (err) {
    fail(`invalid JSON: ${(err as Error).message}`);
  }

  // onSubmit is required by the type but meaningless in a static JSON context.
  if (typeof (config as { onSubmit?: unknown }).onSubmit !== 'function') {
    (config as { onSubmit: () => void }).onSubmit = () => {};
  }

  const report: LintReport = lint(config);

  if (asJson) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    process.stdout.write(formatReport(report));
  }

  process.exit(report.ok ? 0 : 2);
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
