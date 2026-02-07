export interface SitemapUrl {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SitemapData {
  urls: SitemapUrl[];
  totalUrls: number;
}

/**
 * Get static routes for the sitemap
 */
export function getStaticRoutes(): SitemapUrl[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg';
  
  const staticRoutes: SitemapUrl[] = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/become-a-seller`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/partners`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/server`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Legal pages
    {
      url: `${siteUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/copyright`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/appeal-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/complaints-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/california-privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/18-usc`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  return staticRoutes;
}

/**
 * Fetch dynamic posts from API for sitemap
 */
export async function getDynamicPosts(): Promise<SitemapUrl[]> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg';
  const apiUrl = process.env.NEXT_PUBLIC_BASE_API_URL || 'https://api.discreet.fans';
  
  try {
    // Fetch posts from your API
    const response = await fetch(`${apiUrl}/api/posts/public`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch posts for sitemap:', response.statusText);
      return [];
    }

    const data = await response.json();
    const posts = data.posts || [];

    return posts.map((post: any) => ({
      url: `${siteUrl}/feed/${post._id}`,
      lastModified: new Date(post.updatedAt || post.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error fetching posts for sitemap:', error);
    return [];
  }
}

/**
 * Fetch dynamic user profiles from API for sitemap
 */
export async function getDynamicProfiles(): Promise<SitemapUrl[]> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg';
  const apiUrl = process.env.NEXT_PUBLIC_BASE_API_URL || 'https://api.discreet.fans';
  
  try {
    // Fetch public profiles from your API
    const response = await fetch(`${apiUrl}/api/users/public-profiles`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch profiles for sitemap:', response.statusText);
      return [];
    }

    const data = await response.json();
    const profiles = data.profiles || [];

    return profiles.map((profile: any) => ({
      url: `${siteUrl}/${profile.username}`,
      lastModified: new Date(profile.updatedAt || profile.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));
  } catch (error) {
    console.error('Error fetching profiles for sitemap:', error);
    return [];
  }
}

/**
 * Generate complete sitemap data
 */
export async function generateSitemapData(): Promise<SitemapData> {
  const staticRoutes = getStaticRoutes();
  const dynamicPosts = await getDynamicPosts();
  const dynamicProfiles = await getDynamicProfiles();

  const allUrls = [...staticRoutes, ...dynamicPosts, ...dynamicProfiles];

  return {
    urls: allUrls,
    totalUrls: allUrls.length,
  };
}

/**
 * Convert sitemap data to XML format
 */
export function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map((url) => {
      const lastmod = url.lastModified ? url.lastModified.toISOString() : '';
      const changefreq = url.changeFrequency || '';
      const priority = url.priority || '';

      return `  <url>
    <loc>${url.url}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}${changefreq ? `
    <changefreq>${changefreq}</changefreq>` : ''}${priority ? `
    <priority>${priority}</priority>` : ''}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Generate sitemap index XML for large sites (>50k URLs)
 */
export function generateSitemapIndexXML(sitemapUrls: string[]): string {
  const sitemapEntries = sitemapUrls
    .map((url) => {
      return `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}