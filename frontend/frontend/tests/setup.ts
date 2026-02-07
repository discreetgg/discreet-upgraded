/**
 * Test setup for Vitest
 * This file is loaded before all tests
 */

import { vi } from 'vitest';

// Mock fetch globally for all tests
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ posts: [], profiles: [] }),
    text: () => Promise.resolve(''),
  })
) as any;

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SITE_URL = 'https://test.discreet.gg';
process.env.NEXT_PUBLIC_BASE_API_URL = 'https://api.test.discreet.fans';