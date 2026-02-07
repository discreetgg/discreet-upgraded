/**
 * SEO Sitemap Tests
 * 
 * These tests validate that the sitemap is properly generated and accessible.
 * Run with: npm test tests/seo.sitemap.spec.ts
 */

import { describe, it, expect } from 'vitest';
import { generateSitemapData, generateSitemapXML, getStaticRoutes } from '@/lib/sitemap/generate';

describe('Sitemap Generation', () => {
  it('should generate static routes correctly', () => {
    const staticRoutes = getStaticRoutes();
    
    expect(staticRoutes).toBeDefined();
    expect(Array.isArray(staticRoutes)).toBe(true);
    expect(staticRoutes.length).toBeGreaterThan(0);
    
    // Check that homepage is included
    const homepage = staticRoutes.find(route => route.url.endsWith('/'));
    expect(homepage).toBeDefined();
    expect(homepage?.priority).toBe(1.0);
    
    // Check that become-a-seller page is included
    const becomeSellerPage = staticRoutes.find(route => route.url.includes('/become-a-seller'));
    expect(becomeSellerPage).toBeDefined();
  });

  it('should generate valid XML sitemap', () => {
    const staticRoutes = getStaticRoutes();
    const xml = generateSitemapXML(staticRoutes);
    
    expect(xml).toBeDefined();
    expect(typeof xml).toBe('string');
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('</urlset>');
    expect(xml).toContain('<loc>');
    expect(xml).toContain('</loc>');
  });

  it('should include required sitemap elements', () => {
    const staticRoutes = getStaticRoutes();
    const xml = generateSitemapXML(staticRoutes);
    
    // Check for required elements
    expect(xml).toContain('<lastmod>');
    expect(xml).toContain('<changefreq>');
    expect(xml).toContain('<priority>');
  });

  it('should handle empty URL arrays gracefully', () => {
    const xml = generateSitemapXML([]);
    
    expect(xml).toBeDefined();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('</urlset>');
  });
});

describe('Sitemap Data Generation', () => {
  it('should generate complete sitemap data', async () => {
    const sitemapData = await generateSitemapData();
    
    expect(sitemapData).toBeDefined();
    expect(sitemapData.urls).toBeDefined();
    expect(Array.isArray(sitemapData.urls)).toBe(true);
    expect(sitemapData.totalUrls).toBe(sitemapData.urls.length);
    expect(sitemapData.totalUrls).toBeGreaterThan(0);
  });

  it('should include static routes in sitemap data', async () => {
    const sitemapData = await generateSitemapData();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg';
    
    // Check for homepage
    const homepage = sitemapData.urls.find(url => url.url === siteUrl);
    expect(homepage).toBeDefined();
    
    // Check for become-a-seller page
    const becomeSellerPage = sitemapData.urls.find(url => url.url === `${siteUrl}/become-a-seller`);
    expect(becomeSellerPage).toBeDefined();
  });
});