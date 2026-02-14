import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', '..');

const requiredFiles = [
  'AGENTS.md',
  'docs/README.md',
  'docs/index.md',
  'docs/architecture/backend-map.md',
  'docs/architecture/frontend-map.md',
  'docs/architecture/dependency-rules.md',
  'docs/plans/README.md',
  'docs/plans/templates/small-task.md',
  'docs/plans/templates/execution-plan.md',
  'docs/plans/decision-log.md',
  'docs/workflows/agent-pr-protocol.md',
  'docs/workflows/agent-review-protocol.md',
  'docs/legibility/ui-journeys.md',
  'docs/legibility/observability.md',
  'docs/tooling/devtools-mcp.md',
  'docs/reliability/budgets.yaml',
  'docs/automation/doc-gardening.prompt.md',
  'scripts/ci',
  'scripts/bootstrap',
];

const errors = [];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`Missing required file: ${relativePath}`);
  }
}

const agentsPath = path.join(root, 'AGENTS.md');
if (fs.existsSync(agentsPath)) {
  const lineCount = fs.readFileSync(agentsPath, 'utf8').split('\n').length;
  if (lineCount > 140) {
    errors.push(`AGENTS.md should stay short; found ${lineCount} lines (limit: 140).`);
  }
}

const markdownFiles = requiredFiles
  .filter((file) => file.endsWith('.md'))
  .map((file) => path.join(root, file));

const markdownLinkRegex = /\[[^\]]+\]\(([^)]+)\)/g;

for (const filePath of markdownFiles) {
  if (!fs.existsSync(filePath)) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const match of content.matchAll(markdownLinkRegex)) {
    const rawLink = match[1].trim();

    if (
      rawLink.startsWith('http://') ||
      rawLink.startsWith('https://') ||
      rawLink.startsWith('mailto:') ||
      rawLink.startsWith('#')
    ) {
      continue;
    }

    const linkWithoutAnchor = rawLink.split('#')[0];
    if (!linkWithoutAnchor) continue;

    const resolved = rawLink.startsWith('/')
      ? path.join(root, linkWithoutAnchor.slice(1))
      : path.resolve(path.dirname(filePath), linkWithoutAnchor);

    if (!fs.existsSync(resolved)) {
      const relFromRoot = path.relative(root, filePath);
      errors.push(`Broken link in ${relFromRoot}: ${rawLink}`);
    }
  }
}

const docsIndexPath = path.join(root, 'docs', 'index.md');
if (fs.existsSync(docsIndexPath)) {
  const docsIndex = fs.readFileSync(docsIndexPath, 'utf8');
  const expectedRefs = [
    'docs/architecture/backend-map.md',
    'docs/architecture/frontend-map.md',
    'docs/plans/README.md',
    'docs/workflows/agent-pr-protocol.md',
  ];

  for (const ref of expectedRefs) {
    if (!docsIndex.includes(ref)) {
      errors.push(`docs/index.md is missing required reference: ${ref}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Doc integrity check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Doc integrity check passed.');
