import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', '..');
const allowlistPath = path.join(__dirname, 'max-file-lines-allowlist.json');
const maxLines = 800;

if (!fs.existsSync(allowlistPath)) {
  console.error(`Missing allowlist file: ${path.relative(root, allowlistPath)}`);
  process.exit(1);
}

const allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));

function walkFiles(dir, extensions, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.next' ||
        entry.name === 'dist' ||
        entry.name === 'coverage' ||
        entry.name === 'docs' ||
        entry.name === 'tests'
      ) {
        continue;
      }
      walkFiles(absolute, extensions, out);
      continue;
    }

    if (extensions.has(path.extname(entry.name))) {
      out.push(absolute);
    }
  }

  return out;
}

const targets = [
  path.join(root, 'backend', 'backend', 'src'),
  path.join(root, 'frontend', 'frontend', 'app'),
  path.join(root, 'frontend', 'frontend', 'actions'),
  path.join(root, 'frontend', 'frontend', 'components'),
  path.join(root, 'frontend', 'frontend', 'context'),
  path.join(root, 'frontend', 'frontend', 'hooks'),
  path.join(root, 'frontend', 'frontend', 'lib'),
];

const files = targets.flatMap((target) => walkFiles(target, new Set(['.ts', '.tsx'])));

const violations = [];

for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const lines = fs.readFileSync(file, 'utf8').split('\n').length;

  if (lines <= maxLines) continue;

  const allowedMax = allowlist[relative];

  if (allowedMax === undefined) {
    violations.push({
      file: relative,
      lines,
      allowed: maxLines,
      kind: 'new-oversize-file',
    });
    continue;
  }

  if (lines > allowedMax) {
    violations.push({
      file: relative,
      lines,
      allowed: allowedMax,
      kind: 'oversize-growth',
    });
  }
}

if (violations.length > 0) {
  console.error(`Invariant failed: file size limit exceeded (>${maxLines} lines).\n`);
  for (const violation of violations) {
    console.error(`- ${violation.file}`);
    console.error(`  Found: ${violation.lines} lines, Allowed: ${violation.allowed}`);
    if (violation.kind === 'new-oversize-file') {
      console.error(
        '  Remediation: split this file into focused modules/components/hooks before merging. If an exception is unavoidable, record rationale in docs/plans and add a bounded allowlist entry.'
      );
    } else {
      console.error(
        '  Remediation: reduce file size growth by extracting logic into sibling modules. If growth is intentionally temporary, document it in docs/plans and cap the allowlist at a justified limit.'
      );
    }
  }
  process.exit(1);
}

console.log('Max-file-lines invariant passed.');
