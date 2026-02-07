/**
 * SEO Validation Utilities
 * 
 * Helper functions to validate SEO implementation across the app
 */

export interface SEOValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

export interface PageSEOData {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  structuredData?: any;
  h1Count?: number;
  metaKeywords?: string;
}

/**
 * Validate basic SEO requirements for a page
 */
export function validatePageSEO(data: PageSEOData): SEOValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Title validation
  if (!data.title) {
    errors.push('Missing page title');
    score -= 20;
  } else {
    if (data.title.length < 30) {
      warnings.push('Title is shorter than 30 characters');
      score -= 5;
    }
    if (data.title.length > 60) {
      warnings.push('Title is longer than 60 characters');
      score -= 5;
    }
  }

  // Description validation
  if (!data.description) {
    errors.push('Missing meta description');
    score -= 15;
  } else {
    if (data.description.length < 120) {
      warnings.push('Description is shorter than 120 characters');
      score -= 5;
    }
    if (data.description.length > 160) {
      warnings.push('Description is longer than 160 characters');
      score -= 5;
    }
  }

  // Canonical URL validation
  if (!data.canonical) {
    warnings.push('Missing canonical URL');
    score -= 5;
  }

  // Open Graph validation
  if (!data.ogTitle) {
    warnings.push('Missing Open Graph title');
    score -= 5;
  }
  if (!data.ogDescription) {
    warnings.push('Missing Open Graph description');
    score -= 5;
  }
  if (!data.ogImage) {
    warnings.push('Missing Open Graph image');
    score -= 10;
  }

  // Twitter Card validation
  if (!data.twitterCard) {
    warnings.push('Missing Twitter Card type');
    score -= 5;
  }

  // H1 validation
  if (data.h1Count === 0) {
    errors.push('Missing H1 tag');
    score -= 15;
  } else if (data.h1Count && data.h1Count > 1) {
    warnings.push('Multiple H1 tags found');
    score -= 10;
  }

  // Structured data validation
  if (!data.structuredData) {
    warnings.push('Missing structured data (JSON-LD)');
    score -= 10;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
  };
}

/**
 * Validate sitemap structure
 */
export function validateSitemap(sitemapXML: string): SEOValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Basic XML structure validation
  if (!sitemapXML.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
    errors.push('Missing XML declaration');
    score -= 20;
  }

  if (!sitemapXML.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    errors.push('Missing or incorrect urlset declaration');
    score -= 20;
  }

  if (!sitemapXML.includes('</urlset>')) {
    errors.push('Missing closing urlset tag');
    score -= 20;
  }

  // URL validation
  const urlMatches = sitemapXML.match(/<loc>(.*?)<\/loc>/g);
  if (!urlMatches || urlMatches.length === 0) {
    errors.push('No URLs found in sitemap');
    score -= 30;
  } else {
    // Check for valid URLs
    urlMatches.forEach((match, index) => {
      const url = match.replace(/<\/?loc>/g, '');
      try {
        new URL(url);
      } catch {
        errors.push(`Invalid URL at position ${index + 1}: ${url}`);
        score -= 5;
      }
    });

    // Check sitemap size
    if (urlMatches.length > 50000) {
      warnings.push('Sitemap contains more than 50,000 URLs. Consider using sitemap index.');
      score -= 10;
    }
  }

  // Check for required elements
  if (!sitemapXML.includes('<lastmod>')) {
    warnings.push('Missing lastmod elements');
    score -= 5;
  }

  if (!sitemapXML.includes('<changefreq>')) {
    warnings.push('Missing changefreq elements');
    score -= 5;
  }

  if (!sitemapXML.includes('<priority>')) {
    warnings.push('Missing priority elements');
    score -= 5;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
  };
}

/**
 * Validate robots.txt content
 */
export function validateRobotsTxt(robotsContent: string): SEOValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Basic structure validation
  if (!robotsContent.includes('User-agent:')) {
    errors.push('Missing User-agent directive');
    score -= 30;
  }

  if (!robotsContent.includes('Sitemap:')) {
    warnings.push('Missing Sitemap directive');
    score -= 15;
  }

  // Check for common issues
  if (robotsContent.includes('Disallow: /') && !robotsContent.includes('# Staging environment')) {
    warnings.push('Blocking all crawlers - ensure this is intentional');
    score -= 20;
  }

  // Validate sitemap URL
  const sitemapMatch = robotsContent.match(/Sitemap:\s*(https?:\/\/[^\s]+)/);
  if (sitemapMatch) {
    try {
      new URL(sitemapMatch[1]);
    } catch {
      errors.push('Invalid sitemap URL');
      score -= 15;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
  };
}

/**
 * Generate SEO audit report
 */
export function generateSEOAuditReport(
  pageResults: { [path: string]: SEOValidationResult },
  sitemapResult: SEOValidationResult,
  robotsResult: SEOValidationResult
): {
  overallScore: number;
  summary: string;
  recommendations: string[];
  details: {
    pages: { [path: string]: SEOValidationResult };
    sitemap: SEOValidationResult;
    robots: SEOValidationResult;
  };
} {
  const pageScores = Object.values(pageResults).map(result => result.score);
  const averagePageScore = pageScores.length > 0 
    ? pageScores.reduce((sum, score) => sum + score, 0) / pageScores.length 
    : 0;

  const overallScore = Math.round(
    (averagePageScore * 0.6 + sitemapResult.score * 0.2 + robotsResult.score * 0.2)
  );

  const recommendations: string[] = [];
  
  // Collect recommendations from all results
  Object.values(pageResults).forEach(result => {
    result.errors.forEach(error => recommendations.push(`Page Error: ${error}`));
    result.warnings.forEach(warning => recommendations.push(`Page Warning: ${warning}`));
  });

  sitemapResult.errors.forEach(error => recommendations.push(`Sitemap Error: ${error}`));
  sitemapResult.warnings.forEach(warning => recommendations.push(`Sitemap Warning: ${warning}`));

  robotsResult.errors.forEach(error => recommendations.push(`Robots.txt Error: ${error}`));
  robotsResult.warnings.forEach(warning => recommendations.push(`Robots.txt Warning: ${warning}`));

  let summary = '';
  if (overallScore >= 90) {
    summary = 'Excellent SEO implementation';
  } else if (overallScore >= 80) {
    summary = 'Good SEO implementation with minor improvements needed';
  } else if (overallScore >= 70) {
    summary = 'Fair SEO implementation with several improvements needed';
  } else {
    summary = 'Poor SEO implementation requiring significant improvements';
  }

  return {
    overallScore,
    summary,
    recommendations: recommendations.slice(0, 10), // Top 10 recommendations
    details: {
      pages: pageResults,
      sitemap: sitemapResult,
      robots: robotsResult,
    },
  };
}