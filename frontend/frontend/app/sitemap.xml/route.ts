import { NextResponse } from 'next/server';
import { generateSitemapData, generateSitemapXML } from '@/lib/sitemap/generate';

// Cache the sitemap for 1 hour
let cachedSitemap: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function GET() {
  try {
    const now = Date.now();
    
    // Check if we have a valid cached sitemap
    if (cachedSitemap && (now - cacheTimestamp) < CACHE_DURATION) {
      return new NextResponse(cachedSitemap, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }

    // Generate fresh sitemap
    const sitemapData = await generateSitemapData();
    
    // For large sites (>50k URLs), we should implement sitemap index
    if (sitemapData.totalUrls > 50000) {
      // TODO: Implement sitemap index for large sites
      console.warn(`Large sitemap detected: ${sitemapData.totalUrls} URLs. Consider implementing sitemap index.`);
    }

    const sitemapXML = generateSitemapXML(sitemapData.urls);
    
    // Update cache
    cachedSitemap = sitemapXML;
    cacheTimestamp = now;

    return new NextResponse(sitemapXML, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return a basic sitemap with just static routes on error
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg';
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Shorter cache on error
      },
    });
  }
}