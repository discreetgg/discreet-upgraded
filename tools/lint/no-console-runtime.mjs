import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', '..');
const baselinePath = path.join(__dirname, 'no-console-runtime-baseline.json');

if (!fs.existsSync(baselinePath)) {
  console.error(`Missing baseline file: ${path.relative(root, baselinePath)}`);
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

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

const currentCounts = {};
const pattern = /\bconsole\.(log|debug|info|warn|error)\s*\(/;

for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let count = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue;
    }
    if (pattern.test(trimmed)) {
      count += 1;
    }
  }

  if (count > 0) {
    currentCounts[relative] = count;
  }
}

const violations = [];

for (const [file, count] of Object.entries(currentCounts)) {
  const allowed = baseline[file] ?? 0;
  if (count > allowed) {
    violations.push({ file, count, allowed });
  }
}

if (violations.length > 0) {
  console.error('Invariant failed: new runtime console usage detected.\n');
  for (const violation of violations) {
    console.error(`- ${violation.file}`);
    console.error(`  Found: ${violation.count}, Allowed baseline: ${violation.allowed}`);
    console.error(
      '  Remediation: replace console.* with structured logging (Nest Logger in backend) or centralized debug utility in frontend. If intentionally temporary, document rationale in docs/plans and update baseline in a dedicated PR.'
    );
  }
  process.exit(1);
}

console.log('No-console invariant passed.');
