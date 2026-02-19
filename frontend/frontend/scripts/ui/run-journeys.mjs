#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');

const runId =
  process.env.UI_RUN_ID ||
  new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', 'Z');
const baseUrl = normalizeBaseUrl(process.env.UI_BASE_URL || 'http://127.0.0.1:3000');
const artifactsRoot = path.resolve(repoRoot, process.env.UI_ARTIFACTS_ROOT || 'artifacts/ui');
const headless = process.env.UI_HEADLESS !== '0';
const mockApi = process.env.UI_MOCK_API !== '0';
const timeoutMs = Number.parseInt(process.env.UI_TIMEOUT_MS || '45000', 10);
const explicitBrowserPath = process.env.UI_BROWSER_PATH;

const chromePath = detectChromePath(explicitBrowserPath);
if (!chromePath) {
  console.error('UI harness failed: Chrome/Chromium executable not found.');
  console.error('Remediation: set UI_BROWSER_PATH to a Chrome/Chromium binary (for example /Applications/Google Chrome.app/Contents/MacOS/Google Chrome).');
  process.exit(1);
}

const nowIso = new Date().toISOString();
const mockViewer = buildMockUser({
  discordId: 'ui-harness-viewer',
  username: 'ui_harness_viewer',
  displayName: 'UI Harness Viewer',
  role: 'buyer',
  takingCams: false,
  takingCalls: false,
  profileImage: buildProfileImage('/user.svg', 'viewer-profile-image'),
});
const mockSeller = buildMockUser({
  discordId: 'ui-harness-seller',
  username: 'ui_harness_seller',
  displayName: 'UI Harness Seller',
  role: 'seller',
  takingCams: true,
  takingCalls: true,
  callRate: 15,
  minimumCallTime: 1,
  followerCount: 125,
  profileImage: buildProfileImage('/user.svg', 'seller-profile-image'),
});
const mockPost = {
  _id: 'mock-post-1',
  title: 'Harness post',
  content: 'Harness test post content for UI legibility verification.',
  visibility: 'general',
  priceToView: '0',
  tippingEnabled: true,
  categories: ['general'],
  scheduledPost: {
    isScheduled: false,
    scheduledFor: null,
    _id: 'scheduled-1',
  },
  isDraft: false,
  likes: [],
  likesCount: 1,
  commentsCount: 0,
  viewCount: 0,
  bookmarksCount: 0,
  author: {
    _id: 'author-1',
    discordId: mockSeller.discordId,
    displayName: mockSeller.displayName,
    discordAvatar: '',
    profileImage: mockSeller.profileImage,
    username: mockSeller.username,
    role: mockSeller.role,
    takingCams: true,
  },
  media: [],
  createdAt: nowIso,
  updatedAt: nowIso,
};

const journeys = [
  {
    id: 'auth-flow',
    description: 'Validate auth entry and callback flow.',
    keyApiCalls: [
      {
        id: 'current-user',
        pattern: /\/api\/user(?:$|\?|\/)/,
      },
    ],
    run: async ({ page }) => {
      const authResponse = await page.goto(`${baseUrl}/auth`, {
        waitUntil: 'domcontentloaded',
        timeout: timeoutMs,
      });
      assertDocumentResponse(authResponse, '/auth');

      const authPath = new URL(page.url()).pathname;
      if (authPath !== '/auth' && authPath !== '/') {
        throw new Error(`Unexpected route after /auth load: ${authPath}`);
      }

      await page.waitForTimeout(500);

      const callbackResponse = await page.goto(`${baseUrl}/auth/callback?code=ui-harness-code`, {
        waitUntil: 'domcontentloaded',
        timeout: timeoutMs,
      });
      assertDocumentResponse(callbackResponse, '/auth/callback');

      await page.waitForURL((url) => url.pathname === '/', { timeout: timeoutMs });
      await page.getByText('Harness test post', { exact: false }).first().waitFor({
        timeout: timeoutMs,
      });
    },
  },
  {
    id: 'feed-view',
    description: 'Validate feed renders with post content.',
    keyApiCalls: [
      {
        id: 'feed-posts',
        pattern: /\/api\/post(?:$|\?)/,
      },
    ],
    run: async ({ page }) => {
      const response = await page.goto(`${baseUrl}/`, {
        waitUntil: 'domcontentloaded',
        timeout: timeoutMs,
      });
      assertDocumentResponse(response, '/');

      await page.getByText('Harness test post', { exact: false }).first().waitFor({
        timeout: timeoutMs,
      });
    },
  },
  {
    id: 'cams-connect',
    description: 'Validate cams list and connect dialog rendering.',
    keyApiCalls: [
      {
        id: 'online-users',
        pattern: /\/api\/chat\/online-users(?:$|\?)/,
      },
      {
        id: 'user-detail',
        pattern: /\/api\/user\/[^/?]+(?:$|\?)/,
      },
    ],
    run: async ({ page }) => {
      const response = await page.goto(`${baseUrl}/cams`, {
        waitUntil: 'domcontentloaded',
        timeout: timeoutMs,
      });
      assertDocumentResponse(response, '/cams');

      const sellerCard = page.getByText('UI Harness Seller', { exact: false }).first();
      await sellerCard.waitFor({ timeout: timeoutMs });
      await sellerCard.click({ force: true });

      await page.getByText(/charges/i).first().waitFor({ timeout: timeoutMs });
      await page.getByRole('button', { name: /Dial|Not taking cams/i }).first().waitFor({
        timeout: timeoutMs,
      });
    },
  },
];

const requestedJourneyIds = (process.env.UI_JOURNEYS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

const selectedJourneys =
  requestedJourneyIds.length === 0
    ? journeys
    : journeys.filter((journey) => requestedJourneyIds.includes(journey.id));

const unknownJourneyIds = requestedJourneyIds.filter(
  (id) => !journeys.some((journey) => journey.id === id),
);

if (unknownJourneyIds.length > 0) {
  console.error(`UI harness failed: unknown journey id(s): ${unknownJourneyIds.join(', ')}`);
  console.error(`Available journeys: ${journeys.map((journey) => journey.id).join(', ')}`);
  process.exit(1);
}

if (selectedJourneys.length === 0) {
  console.error('UI harness failed: no journeys selected.');
  process.exit(1);
}

await ensureDir(artifactsRoot);

console.log(`UI harness run id: ${runId}`);
console.log(`UI base URL: ${baseUrl}`);
console.log(`UI artifacts root: ${path.relative(repoRoot, artifactsRoot)}`);
console.log(`Chrome path: ${chromePath}`);
console.log(`Mock API mode: ${mockApi ? 'enabled' : 'disabled'}`);

const browser = await chromium.launch({
  headless,
  executablePath: chromePath,
  args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
});

const journeyResults = [];

for (const journey of selectedJourneys) {
  const result = await runJourney(browser, journey);
  journeyResults.push(result);
}

await browser.close();

const reportMarkdown = renderMarkdownReport({
  runId,
  baseUrl,
  artifactsRoot,
  chromePath,
  mockApi,
  results: journeyResults,
});

const reportMarkdownPath = path.join(artifactsRoot, `report-${runId}.md`);
const reportJsonPath = path.join(artifactsRoot, `report-${runId}.json`);
await fsp.writeFile(reportMarkdownPath, reportMarkdown, 'utf8');
await writeJson(reportJsonPath, {
  runId,
  baseUrl,
  chromePath,
  mockApi,
  results: journeyResults,
});

console.log(`UI report written to ${path.relative(repoRoot, reportMarkdownPath)}`);
console.log(`UI JSON report written to ${path.relative(repoRoot, reportJsonPath)}`);

const failed = journeyResults.filter((result) => result.status === 'failed');
if (failed.length > 0) {
  console.error(`UI harness failed: ${failed.length}/${journeyResults.length} journey(ies) failed.`);
  for (const result of failed) {
    console.error(`- ${result.id}: ${result.failureReason}`);
    if (result.remediation) {
      console.error(`  Remediation: ${result.remediation}`);
    }
  }
  process.exit(1);
}

console.log(`UI harness passed: ${journeyResults.length} journey(ies).`);

async function runJourney(browserInstance, journey) {
  const startedAt = new Date().toISOString();
  const journeyArtifactDir = path.join(artifactsRoot, journey.id, runId);
  await ensureDir(journeyArtifactDir);

  const consoleWarnings = [];
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  const httpFailures = [];
  const keyApiCalls = [];
  const observedKeyApiCallIds = new Set();

  let status = 'passed';
  let failureReason = null;
  let remediation = null;

  const context = await browserInstance.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');

  if (mockApi) {
    await installApiMocks(page);
  }

  page.on('console', (message) => {
    const type = message.type();
    const entry = {
      type,
      text: message.text(),
      location: message.location(),
      timestamp: new Date().toISOString(),
    };

    if (type === 'warning') {
      consoleWarnings.push(entry);
    }
    if (type === 'error') {
      consoleErrors.push(entry);
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  });

  page.on('requestfailed', (request) => {
    requestFailures.push({
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
      failureText: request.failure()?.errorText || 'request failed',
      timestamp: new Date().toISOString(),
    });
  });

  page.on('response', (response) => {
    const url = response.url();
    const statusCode = response.status();
    const entry = {
      method: response.request().method(),
      url,
      status: statusCode,
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= 400) {
      httpFailures.push(entry);
    }

    for (const keyApiCall of journey.keyApiCalls) {
      if (!keyApiCall.pattern.test(url)) {
        continue;
      }

      observedKeyApiCallIds.add(keyApiCall.id);
      keyApiCalls.push({
        key: keyApiCall.id,
        ...entry,
      });
    }
  });

  try {
    await journey.run({ page });

    const missingKeyApiCalls = journey.keyApiCalls
      .map((keyApiCall) => keyApiCall.id)
      .filter((keyApiCallId) => !observedKeyApiCallIds.has(keyApiCallId));

    if (missingKeyApiCalls.length > 0) {
      throw new Error(
        `Missing expected key API calls: ${missingKeyApiCalls.join(', ')}`,
      );
    }
  } catch (error) {
    status = 'failed';
    failureReason = error instanceof Error ? error.message : String(error);

    if (failureReason.includes('Missing expected key API calls')) {
      remediation =
        'Verify the journey route behavior and mock/live API wiring. If running against live services, confirm endpoints are reachable and not blocked by auth/cors.';
    } else if (failureReason.includes('returned HTTP')) {
      remediation =
        'Ensure the frontend app is running at UI_BASE_URL and the route exists. Re-run with UI_MOCK_API=1 to isolate UI routing from backend dependency.';
    } else {
      remediation =
        'Check artifacts for screenshot, DOM snapshot, console, and network output. Fix the selector/flow mismatch or endpoint availability, then rerun ./scripts/ci ui.';
    }
  }

  const screenshotPath = path.join(journeyArtifactDir, 'screenshot.png');
  const domSnapshotPath = path.join(journeyArtifactDir, 'dom-snapshot.json');
  const consolePath = path.join(journeyArtifactDir, 'console.json');
  const networkPath = path.join(journeyArtifactDir, 'network.json');
  const performanceMetricsPath = path.join(journeyArtifactDir, 'performance-metrics.json');
  const tracePath = path.join(journeyArtifactDir, 'trace.zip');

  let performanceMetrics = { metrics: [] };
  try {
    performanceMetrics = await cdp.send('Performance.getMetrics');
  } catch (error) {
    performanceMetrics = {
      metrics: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    const domSnapshot = await cdp.send('DOMSnapshot.captureSnapshot', {
      computedStyles: [],
      includeDOMRects: true,
      includePaintOrder: true,
    });
    await writeJson(domSnapshotPath, domSnapshot);
  } catch (error) {
    await writeJson(domSnapshotPath, {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    await writeJson(path.join(journeyArtifactDir, 'screenshot-error.json'), {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  await writeJson(consolePath, {
    warnings: consoleWarnings,
    errors: consoleErrors,
    pageErrors,
  });

  await writeJson(networkPath, {
    requestFailures,
    httpFailures,
    keyApiCalls,
  });

  await writeJson(performanceMetricsPath, performanceMetrics);

  try {
    await context.tracing.stop({ path: tracePath });
  } catch (error) {
    await writeJson(path.join(journeyArtifactDir, 'trace-error.json'), {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  await context.close();

  const finishedAt = new Date().toISOString();
  const result = {
    id: journey.id,
    description: journey.description,
    status,
    startedAt,
    finishedAt,
    artifactsDir: path.relative(repoRoot, journeyArtifactDir),
    counts: {
      consoleWarnings: consoleWarnings.length,
      consoleErrors: consoleErrors.length,
      pageErrors: pageErrors.length,
      requestFailures: requestFailures.length,
      httpFailures: httpFailures.length,
      keyApiCalls: keyApiCalls.length,
    },
    keyApiCallsObserved: Array.from(observedKeyApiCallIds),
    failureReason,
    remediation,
  };

  await writeJson(path.join(journeyArtifactDir, 'result.json'), result);

  console.log(
    `[ui] ${journey.id}: ${status.toUpperCase()} | warnings=${consoleWarnings.length} errors=${consoleErrors.length} network_failures=${requestFailures.length + httpFailures.length}`,
  );

  return result;
}

async function installApiMocks(page) {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const pathname = requestUrl.pathname;
    const method = request.method().toUpperCase();

    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: buildCorsHeaders(),
        body: '',
      });
      return;
    }

    if (pathname.endsWith('/api/auth/discord/signin') && method === 'GET') {
      await route.fulfill({
        status: 302,
        headers: {
          ...buildCorsHeaders(),
          location: `${baseUrl}/auth/callback?code=ui-harness-code`,
        },
        body: '',
      });
      return;
    }

    if (pathname.endsWith('/api/auth/refresh') && method === 'POST') {
      await fulfillJson(route, 200, { refreshed: true });
      return;
    }

    if (pathname.endsWith('/api/user') && method === 'GET') {
      await fulfillJson(route, 200, mockViewer);
      return;
    }

    if (pathname.endsWith('/api/user/creators') && method === 'GET') {
      await fulfillJson(route, 200, [mockSeller]);
      return;
    }

    if (/\/api\/user\/[^/?]+$/.test(pathname) && method === 'GET') {
      const userId = pathname.split('/').pop();
      const user = userId === mockSeller.discordId ? mockSeller : mockViewer;
      await fulfillJson(route, 200, user);
      return;
    }

    if (pathname.endsWith('/api/chat/online-users') && method === 'GET') {
      await fulfillJson(route, 200, [mockSeller.discordId]);
      return;
    }

    if (pathname.endsWith('/api/post') && method === 'GET') {
      await fulfillJson(route, 200, {
        data: [mockPost],
        hasNextPage: false,
      });
      return;
    }

    if (/\/api\/post\/[^/?]+$/.test(pathname) && method === 'GET') {
      await fulfillJson(route, 200, mockPost);
      return;
    }

    if (pathname.endsWith('/api/post/trending') && method === 'GET') {
      await fulfillJson(route, 200, [mockPost]);
      return;
    }

    if (method === 'GET') {
      await fulfillJson(route, 200, []);
      return;
    }

    await fulfillJson(route, 200, {});
  });
}

function buildMockUser(overrides) {
  return {
    discordId: 'ui-harness-user',
    username: 'ui_harness_user',
    callRate: 5,
    email: 'ui-harness@example.com',
    takingCams: false,
    takingCalls: false,
    minimumCallTime: 1,
    displayName: 'UI Harness User',
    discordAvatar: '',
    role: 'buyer',
    discordNotification: {
      enabled: true,
      newFollower: true,
      newComment: true,
      newLike: true,
      newSubscriber: true,
      tip: true,
      _id: 'discord-notification-settings',
    },
    emailNotification: {
      enabled: true,
      newSubscriber: true,
      tip: true,
      _id: 'email-notification-settings',
    },
    inAppNotification: {
      enabled: true,
      newFollower: true,
      newComment: true,
      newLike: true,
      newSubscriber: true,
      tip: true,
      _id: 'inapp-notification-settings',
    },
    _2FAEnabled: false,
    _2FAVerified: false,
    backupCodes: [],
    createdAt: nowIso,
    updatedAt: nowIso,
    hasAuthPin: false,
    isAgeVerified: true,
    bio: 'Harness user',
    discordDisplayName: 'UI Harness User',
    isUsingDiscordName: true,
    profileImage: null,
    profileBanner: null,
    followingCount: 0,
    followerCount: 0,
    race: null,
    ...overrides,
  };
}

function buildProfileImage(url, id) {
  return {
    _id: id,
    public_id: id,
    uploadedAt: nowIso,
    url,
  };
}

async function fulfillJson(route, status, payload) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: buildCorsHeaders(),
    body: JSON.stringify(payload),
  });
}

function buildCorsHeaders() {
  return {
    'cache-control': 'no-store',
    'access-control-allow-origin': baseUrl,
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-requested-with',
    vary: 'Origin',
  };
}

function assertDocumentResponse(response, routePath) {
  if (!response) {
    throw new Error(`Navigation to ${routePath} did not produce an HTTP response.`);
  }

  const statusCode = response.status();
  if (statusCode >= 400) {
    throw new Error(`Navigation to ${routePath} returned HTTP ${statusCode}.`);
  }
}

function normalizeBaseUrl(input) {
  const normalized = input.trim();
  if (!normalized) {
    return 'http://127.0.0.1:3000';
  }

  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

function detectChromePath(explicitPath) {
  if (explicitPath && fs.existsSync(explicitPath)) {
    return explicitPath;
  }

  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function ensureDir(targetDir) {
  await fsp.mkdir(targetDir, { recursive: true });
}

async function writeJson(filePath, payload) {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function renderMarkdownReport({
  runId: currentRunId,
  baseUrl: currentBaseUrl,
  artifactsRoot: currentArtifactsRoot,
  chromePath: currentChromePath,
  mockApi: currentMockApi,
  results,
}) {
  const lines = [];

  lines.push('# UI Legibility Report');
  lines.push('');
  lines.push(`- Run ID: \`${currentRunId}\``);
  lines.push(`- Base URL: \`${currentBaseUrl}\``);
  lines.push(`- Chrome Path: \`${currentChromePath}\``);
  lines.push(`- Mock API Mode: \`${currentMockApi ? 'enabled' : 'disabled'}\``);
  lines.push(`- Artifacts Root: \`${path.relative(repoRoot, currentArtifactsRoot)}\``);
  lines.push('');

  for (const result of results) {
    const statusIcon = result.status === 'passed' ? 'PASS' : 'FAIL';
    lines.push(`## ${result.id} (${statusIcon})`);
    lines.push(`- Description: ${result.description}`);
    lines.push(`- Artifacts: \`${result.artifactsDir}\``);
    lines.push(`- Console warnings/errors: ${result.counts.consoleWarnings}/${result.counts.consoleErrors}`);
    lines.push(`- Page errors: ${result.counts.pageErrors}`);
    lines.push(`- Network failures (request + 4xx/5xx): ${result.counts.requestFailures + result.counts.httpFailures}`);
    lines.push(`- Key API calls observed: ${result.keyApiCallsObserved.join(', ') || '(none)'}`);

    if (result.failureReason) {
      lines.push(`- Failure reason: ${result.failureReason}`);
    }

    if (result.remediation) {
      lines.push(`- Remediation: ${result.remediation}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}
