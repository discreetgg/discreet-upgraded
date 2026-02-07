import { NextResponse } from 'next/server';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg';
  const isProduction = process.env.NODE_ENV === 'production';

  const robotsContent = isProduction
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

  return new NextResponse(robotsContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}