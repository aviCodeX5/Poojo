import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'test-results', 'playwright-report', '.wrangler', 'docs']);
const ignoredFiles = new Set(['scripts/assertNoLegacyBackend.ts']);
const patterns = [/firebase/i, /firestore/i, /VITE_FIREBASE/i];
const checkedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.example', '.rules']);

function extensionOf(path: string) {
  const name = path.split(/[\\/]/).pop() || '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot) : '';
}

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path, files);
    } else {
      files.push(path);
    }
  }
  return files;
}

const matches: string[] = [];
for (const file of walk(root)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (ignoredFiles.has(rel)) continue;
  if (!checkedExtensions.has(extensionOf(file)) && !rel.endsWith('.env.example')) continue;
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (patterns.some(pattern => pattern.test(line))) {
      matches.push(`${rel}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (matches.length > 0) {
  console.error('Legacy backend references remain:');
  console.error(matches.join('\n'));
  process.exit(1);
}
