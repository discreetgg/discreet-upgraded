import type { Metadata } from "next";
import type { PostType } from "@/types/global";

export interface SEOConfig {
	title: string;
	description: string;
	canonical?: string;
	ogImage?: string;
	ogType?: "website" | "article" | "profile";
	twitterCard?: "summary" | "summary_large_image";
	noIndex?: boolean;
	keywords?: string[];
}

/**
 * Generate base metadata for the site
 */
export function generateBaseMetadata(): Metadata {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://discreet.gg";

	return {
		metadataBase: new URL(siteUrl),
		title: {
			template: "%s | Discreet",
			default: "Discreet - Connect, Create, and Earn",
		},
		description:
			"Join Discreet to connect with creators, share exclusive content, and build your community. Start earning today.",
		keywords: [
			"content creation",
			"creators",
			"community",
			"exclusive content",
			"social platform",
		],
		authors: [{ name: "Discreet" }],
		creator: "Discreet",
		publisher: "Discreet",
		formatDetection: {
			email: false,
			address: false,
			telephone: false,
		},
		openGraph: {
			type: "website",
			locale: "en_US",
			url: siteUrl,
			siteName: "Discreet",
			title: "Discreet - Connect, Create, and Earn",
			description:
				"Join Discreet to connect with creators, share exclusive content, and build your community.",
			images: [
				{
					url: `${siteUrl}/discreet-banner.png`,
					width: 1200,
					height: 630,
					alt: "Discreet Logo",
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: "Discreet - Connect, Create, and Earn",
			description:
				"Join Discreet to connect with creators, share exclusive content, and build your community.",
			images: [`${siteUrl}/discreet-banner.png`],
		},
		robots: {
			index: process.env.NODE_ENV === "production",
			follow: process.env.NODE_ENV === "production",
			googleBot: {
				index: process.env.NODE_ENV === "production",
				follow: process.env.NODE_ENV === "production",
				"max-video-preview": -1,
				"max-image-preview": "large",
				"max-snippet": -1,
			},
		},
		verification: {
			// Add your verification codes here
			// google: 'your-google-verification-code',
			// yandex: 'your-yandex-verification-code',
			// yahoo: 'your-yahoo-verification-code',
		},
	};
}

/**
 * Generate metadata for homepage
 */
export function generateHomeMetadata(): Metadata {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://discreet.gg";

	return {
		title: "Home",
		description:
			"Discover exclusive content from top creators. Join the Discreet community and start your journey today.",
		alternates: {
			canonical: siteUrl,
		},
		openGraph: {
			title: "Discreet - Home",
			description:
				"Discover exclusive content from top creators. Join the Discreet community and start your journey today.",
			url: siteUrl,
			type: "website",
		},
		twitter: {
			title: "Discreet - Home",
			description:
				"Discover exclusive content from top creators. Join the Discreet community and start your journey today.",
		},
	};
}

/**
 * Generate metadata for post pages
 */
export function generatePostMetadata(post: PostType): Metadata {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://discreet.gg";
	const postUrl = `${siteUrl}/feed/${post._id}`;

	const title = post.title || `Post by ${post.author.displayName}`;
	const description =
		post.content.length > 160
			? `${post.content.substring(0, 157)}...`
			: post.content;

	// Get the first image from post media for OG image
	const ogImage = post.media?.[0]?.url || `${siteUrl}/discreet-banner.png`;

	return {
		title,
		description,
		alternates: {
			canonical: postUrl,
		},
		openGraph: {
			title,
			description,
			url: postUrl,
			type: "article",
			publishedTime: post.createdAt,
			modifiedTime: post.updatedAt,
			authors: [post.author.displayName],
			images: [
				{
					url: ogImage,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
		},
		twitter: {
			title,
			description,
			images: [ogImage],
			card: "summary_large_image",
		},
	};
}

/**
 * Generate metadata for user profile pages
 */
export function generateProfileMetadata(user: {
	displayName: string;
	username: string;
	profileImage?: { url: string };
	bio?: string;
}): Metadata {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://discreet.gg";
	const profileUrl = `${siteUrl}/${user.username}`;

	const title = `${user.displayName} (@${user.username})`;
	const description =
		user.bio || `Check out ${user.displayName}'s profile on Discreet`;
	const ogImage = user.profileImage?.url || `${siteUrl}/discreet-banner.png`;

	return {
		title,
		description,
		alternates: {
			canonical: profileUrl,
		},
		openGraph: {
			title,
			description,
			url: profileUrl,
			type: "profile",
			images: [
				{
					url: ogImage,
					width: 1200,
					height: 630,
					alt: `${user.displayName}'s profile picture`,
				},
			],
		},
		twitter: {
			title,
			description,
			images: [ogImage],
			card: "summary_large_image",
		},
	};
}

/**
 * Generate metadata for static pages
 */
export function generateStaticPageMetadata(config: SEOConfig): Metadata {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://discreet.gg";
	const canonical = config.canonical || siteUrl;

	return {
		title: config.title,
		description: config.description,
		...(config.keywords && { keywords: config.keywords }),
		alternates: {
			canonical,
		},
		openGraph: {
			title: config.title,
			description: config.description,
			url: canonical,
			type: config.ogType || "website",
			...(config.ogImage && {
				images: [
					{
						url: config.ogImage,
						width: 1200,
						height: 630,
						alt: config.title,
					},
				],
			}),
		},
		twitter: {
			title: config.title,
			description: config.description,
			card: config.twitterCard || "summary_large_image",
			...(config.ogImage && { images: [config.ogImage] }),
		},
		...(config.noIndex && {
			robots: {
				index: false,
				follow: false,
			},
		}),
	};
}
