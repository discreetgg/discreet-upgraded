import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', '..');
const baselinePath = path.join(__dirname, 'controller-boundary-baseline.json');

if (!fs.existsSync(baselinePath)) {
  console.error(`Missing baseline file: ${path.relative(root, baselinePath)}`);
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'docs' || entry.name === 'tests') {
        continue;
      }
      walkFiles(absolute, out);
      continue;
    }

    if (entry.name.endsWith('.controller.ts')) {
      out.push(absolute);
    }
  }

  return out;
}

const backendSrc = path.join(root, 'backend', 'backend', 'src');
const controllers = walkFiles(backendSrc);

const pattern = /@(Body|Query|Param|Req)\([^)]*\)\s*[^,\n)]*:\s*any\b/g;
const violations = [];

for (const file of controllers) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(pattern);
  const count = matches ? matches.length : 0;
  const allowed = baseline[relative] ?? 0;

  if (count > allowed) {
    violations.push({ file: relative, count, allowed });
  }
}

if (violations.length > 0) {
  console.error('Invariant failed: controller boundary typed as `any` beyond baseline.\n');
  for (const violation of violations) {
    console.error(`- ${violation.file}`);
    console.error(`  Found: ${violation.count}, Allowed baseline: ${violation.allowed}`);
    console.error(
      '  Remediation: replace `any` with concrete DTO/request boundary types (for example `Request & { user: JwtPayload }`, typed `@Body()` DTOs, typed params/queries). If a temporary exception is required, document it in docs/plans and update baseline explicitly.'
    );
  }
  process.exit(1);
}

console.log('Controller boundary invariant passed.');
