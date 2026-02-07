import type { PostType } from '@/types/global';

export interface WebsiteStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  description: string;
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
}

export interface ArticleStructuredData {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  author: {
    '@type': string;
    name: string;
    url?: string;
  };
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  image?: string[];
}

export interface PersonStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  image?: string;
  description?: string;
  sameAs?: string[];
}

/**
 * Generate website structured data for the homepage
 */
export function generateWebsiteStructuredData(): WebsiteStructuredData {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Discreet',
    url: siteUrl,
    description: 'Discreet - Connect, create, and earn with exclusive content and community features.',
    publisher: {
      '@type': 'Organization',
      name: 'Discreet',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
  };
}

/**
 * Generate article structured data for posts
 */
export function generateArticleStructuredData(post: PostType): ArticleStructuredData {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg';
  const postUrl = `${siteUrl}/feed/${post._id}`;
  
  // Extract images from post media
  const images = post.media?.map(media => media.url).filter(Boolean) || [];
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title || post.content.substring(0, 100),
    description: post.content.substring(0, 160),
    url: postUrl,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.displayName,
      url: `${siteUrl}/${post.author.username}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Discreet',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    ...(images.length > 0 && { image: images }),
  };
}

/**
 * Generate person structured data for user profiles
 */
export function generatePersonStructuredData(user: {
  displayName: string;
  username: string;
  profileImage?: { url: string };
  bio?: string;
}): PersonStructuredData {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://discreet.gg';
  const profileUrl = `${siteUrl}/${user.username}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.displayName,
    url: profileUrl,
    ...(user.profileImage?.url && { image: user.profileImage.url }),
    ...(user.bio && { description: user.bio }),
  };
}

/**
 * Convert structured data to JSON-LD script tag
 */
export function structuredDataToScript(data: any): string {
  return JSON.stringify(data, null, 2);
}