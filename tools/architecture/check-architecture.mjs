import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', '..');

const backendSrc = path.join(root, 'backend', 'backend', 'src');
const frontendRoot = path.join(root, 'frontend', 'frontend');

const violations = [];

function walkFiles(dir, extensions, out = []) {
  if (!fs.existsSync(dir)) return out;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
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

function addViolation(rule, filePath, line, detail, remediation) {
  violations.push({
    rule,
    filePath: path.relative(root, filePath),
    line,
    detail,
    remediation,
  });
}

function scanImports(filePath, fileKind) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^\s*import\s+.*?from\s+['"]([^'"]+)['"]/);
    if (!match) continue;

    const importPath = match[1];

    if (
      fileKind === 'backend' &&
      (importPath.startsWith('@/') ||
        importPath.includes('/frontend/frontend/') ||
        importPath.startsWith('frontend/'))
    ) {
      addViolation(
        'backend-no-frontend-import',
        filePath,
        i + 1,
        `Backend file imports frontend path: ${importPath}`,
        'Remove frontend coupling. Move shared contracts into a neutral module (for example DTO/schema/types under backend) and import from there.'
      );
    }

    if (
      fileKind === 'frontend' &&
      (importPath.includes('/backend/backend/') ||
        importPath.startsWith('src/database/') ||
        importPath.startsWith('backend/'))
    ) {
      addViolation(
        'frontend-no-backend-import',
        filePath,
        i + 1,
        `Frontend file imports backend implementation path: ${importPath}`,
        'Use API contracts or shared plain types only. Replace direct backend imports with frontend-side request/adapter code in `lib/` or `actions/`.'
      );
    }

    if (importPath.includes('oldController') || importPath.includes('wallet.service.old')) {
      addViolation(
        'no-legacy-module-import',
        filePath,
        i + 1,
        `Importing legacy/deprecated module: ${importPath}`,
        'Import the active module implementation instead. If migration is incomplete, add an explicit adapter module and deprecate references there.'
      );
    }

    if (filePath.includes(`${path.sep}dto${path.sep}`)) {
      if (/(\.service|\.controller|\.gateway|\.module)(['"])?$/.test(importPath) || /\/(service|controller|gateway|module)\./.test(importPath)) {
        addViolation(
          'dto-boundary-leak',
          filePath,
          i + 1,
          `DTO file depends on transport/service module: ${importPath}`,
          'Keep DTOs boundary-pure. Move shared types to a neutral `dto` or `types` file and import that instead of services/controllers/modules.'
        );
      }
    }

    if (filePath.includes(`${path.sep}database${path.sep}schemas${path.sep}`)) {
      if (/(\.service|\.controller|\.gateway|\.module)(['"])?$/.test(importPath) || /\/(service|controller|gateway|module)\./.test(importPath)) {
        addViolation(
          'schema-boundary-leak',
          filePath,
          i + 1,
          `Schema file depends on transport/service module: ${importPath}`,
          'Keep schemas persistence-only. Move business logic to services and keep schema imports limited to schema-level helpers/types.'
        );
      }
    }
  }
}

const backendFiles = walkFiles(backendSrc, new Set(['.ts']));
const frontendFiles = walkFiles(frontendRoot, new Set(['.ts', '.tsx'])).filter((file) => {
  return !file.includes(`${path.sep}docs${path.sep}`) && !file.includes(`${path.sep}tests${path.sep}`);
});

backendFiles.forEach((file) => scanImports(file, 'backend'));
frontendFiles.forEach((file) => scanImports(file, 'frontend'));

if (violations.length > 0) {
  console.error('Architecture check failed with actionable violations:\n');
  for (const violation of violations) {
    console.error(`- [${violation.rule}] ${violation.filePath}:${violation.line}`);
    console.error(`  Why: ${violation.detail}`);
    console.error(`  Remediation: ${violation.remediation}`);
  }
  process.exit(1);
}

console.log('Architecture check passed.');
