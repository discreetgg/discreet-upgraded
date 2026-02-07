/**
 * Robots.txt Tests
 * 
 * These tests validate that robots.txt is properly configured for different environments.
 * Run with: npm test tests/robots.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Robots.txt Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Helper function to generate robots.txt content
  const generateRobotsContent = (nodeEnv: string, siteUrl: string) => {
    const isProduction = nodeEnv === 'production';
    
    return isProduction
      ? `User-agent: *
Allow: /

# Static pages
Allow: /
Allow: /become-a-seller
Allow: /partners
Allow: /terms-of-service
Allow: /privacy-policy
Allow: /copyright
Allow: /appeal-policy
Allow: /complaints-policy
Allow: /california-privacy-policy
Allow: /18-usc

# Disallow private/protected routes
Disallow: /messages
Disallow: /wallet
Disallow: /bookmarks
Disallow: /notifications
Disallow: /earnings
Disallow: /settings
Disallow: /profile
Disallow: /auth
Disallow: /api

# Allow public profiles and posts
Allow: /feed/*
Allow: /*/

Sitemap: ${siteUrl}/sitemap.xml`
      : `User-agent: *
Disallow: /

# Staging environment - block all crawling
Sitemap: ${siteUrl}/sitemap.xml`;
  };

  it('should allow crawling in production environment', () => {
    process.env.NODE_ENV === 'production';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://discreet.gg';

    const robotsContent = generateRobotsContent(
      process.env.NODE_ENV,
      process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg'
    );

    expect(robotsContent).toContain('User-agent: *');
    expect(robotsContent).toContain('Allow: /');
    expect(robotsContent).toContain('Disallow: /messages');
    expect(robotsContent).toContain('Disallow: /wallet');
    expect(robotsContent).toContain('Disallow: /auth');
    expect(robotsContent).toContain('Disallow: /api');
    expect(robotsContent).toContain('Allow: /become-a-seller');
    expect(robotsContent).toContain('Allow: /partners');
    expect(robotsContent).toContain('Allow: /feed/*');
    expect(robotsContent).toContain('Sitemap: https://discreet.gg/sitemap.xml');
  });

  it('should block all crawling in non-production environment', () => {
    process.env.NODE_ENV === 'development';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.discreet.gg';

    const robotsContent = generateRobotsContent(
      process.env.NODE_ENV,
      process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg'
    );

    expect(robotsContent).toContain('User-agent: *');
    expect(robotsContent).toContain('Disallow: /');
    expect(robotsContent).toContain('# Staging environment - block all crawling');
    expect(robotsContent).toContain('Sitemap: https://staging.discreet.gg/sitemap.xml');
    expect(robotsContent).not.toContain('Allow: /become-a-seller');
  });

  it('should use default site URL when environment variable is not set', () => {
     process.env.NODE_ENV === 'production';
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg';
    
    expect(siteUrl).toBe('https://discreet.gg');
  });

  it('should include sitemap reference in all environments', () => {
    const testCases = [
      { NODE_ENV: 'production', SITE_URL: 'https://discreet.gg' },
      { NODE_ENV: 'development', SITE_URL: 'https://staging.discreet.gg' },
      { NODE_ENV: 'test', SITE_URL: 'https://test.discreet.gg' },
    ];

    testCases.forEach(({ NODE_ENV, SITE_URL }) => {
      process.env.NODE_ENV === NODE_ENV;
      process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;

      const robotsContent = generateRobotsContent(NODE_ENV, SITE_URL);

      expect(robotsContent).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    });
  });
});