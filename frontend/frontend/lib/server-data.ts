import type { PostType } from '@/types/global';

/**
 * API base URL for server-side requests
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.discreet.fans/api';

/**
 * Interface for posts response with pagination
 */
interface PostsResponse {
    data: PostType[];
    hasNextPage: boolean;
    nextCursor?: string;
}

/**
 * Fetch posts on the server with visibility filtering
 * @param visibility - Post visibility filter
 * @param limit - Number of posts to fetch
 * @param cursor - Pagination cursor
 * @returns Posts data with pagination info
 */
export async function getServerPosts(
    visibility: string = 'general',
    limit: number = 10,
    cursor?: string
): Promise<PostsResponse> {
    try {
        const params = new URLSearchParams({
            visibility,
            limit: limit.toString(),
            ...(cursor && { cursor }),
        });

        const response = await fetch(`${API_URL}/posts?${params}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Don't cache posts on server (they change frequently)
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch posts: ${response.statusText}`);
        }

        const data = await response.json();

        // Normalize response structure
        if (Array.isArray(data)) {
            return {
                data,
                hasNextPage: data.length >= limit,
                nextCursor: data.length > 0 ? data[data.length - 1]._id : undefined,
            };
        }

        return data;
    } catch (error) {
        console.error('Error fetching server posts:', error);
        return {
            data: [],
            hasNextPage: false,
        };
    }
}

/**
 * Fetch trending posts on the server
 * @param limit - Number of posts to fetch
 * @returns Array of trending posts
 */
export async function getServerTrendingPosts(limit: number = 10): Promise<PostType[]> {
    try {
        const response = await fetch(`${API_URL}/posts/trending?limit=${limit}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            next: { revalidate: 600 }, // Cache for 10 minutes
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch trending posts: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
        console.error('Error fetching trending posts:', error);
        return [];
    }
}

/**
 * Fetch a single post by ID on the server
 * @param postId - Post ID to fetch
 * @returns Post data if found, null otherwise
 */
export async function getServerPost(postId: string): Promise<PostType | null> {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching post:', error);
        return null;
    }
}

/**
 * Fetch creator media on the server
 * @param discordId - Creator Discord ID
 * @returns Array of media posts
 */
export async function getServerCreatorMedia(discordId: string): Promise<PostType[]> {
    try {
        const response = await fetch(`${API_URL}/creator/${discordId}/media`, {
            headers: {
                'Content-Type': 'application/json',
            },
            next: { revalidate: 600 }, // Cache for 10 minutes
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
        console.error('Error fetching creator media:', error);
        return [];
    }
}

/**
 * Fetch creator posts on the server
 * @param discordId - Creator Discord ID
 * @param limit - Number of posts to fetch
 * @returns Array of creator posts
 */
export async function getServerCreatorPosts(
    discordId: string,
    limit: number = 10
): Promise<PostType[]> {
    try {
        const response = await fetch(`${API_URL}/creator/${discordId}/posts?limit=${limit}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : data.data || [];
    } catch (error) {
        console.error('Error fetching creator posts:', error);
        return [];
    }
}
