import { cookies } from 'next/headers';
import { getAuthCookie } from '@/lib/cookies';
import type { UserType } from '@/types/global';

/**
 * API base URL for server-side requests
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.discreet.fans/api';

/**
 * Get the current authenticated user on the server
 * Uses auth token/cookies to fetch user data
 * @returns User object if authenticated, null otherwise
 */
export async function getServerUser(): Promise<UserType | null> {
    try {
        const cookieStore = await cookies();

        // Respect explicit manual logout even if auth cookies still exist.
        const manualLogout = cookieStore.get('manual_logout')?.value === '1';
        if (manualLogout) {
            return null;
        }
        
        // Build cookie header from all available cookies to forward to API
        const cookieHeader = cookieStore.getAll()
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');

        // Try to get auth token from cookies first (set by backend)
        const authTokenCookie = cookieStore.get('auth_token');
        const authToken = authTokenCookie?.value;

        // Try authenticated request with Bearer token first
        if (authToken) {
            const response = await fetch(`${API_URL}/user`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                    ...(cookieHeader && { 'Cookie': cookieHeader }),
                },
                cache: 'no-store', // Don't cache user data on server
            });

            if (response.ok) {
                const user = await response.json();
                return user;
            }
        }

        // Try with cookies only (session-based auth)
        if (cookieHeader) {
            const response = await fetch(`${API_URL}/user`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookieHeader,
                },
                cache: 'no-store',
            });

            if (response.ok) {
                const user = await response.json();
                return user;
            }
        }

        // Fallback for environments where API auth cookies are not readable on the frontend domain:
        // use the mirrored frontend discord_id cookie to resolve the current user.
        const discordId = await getAuthCookie();
        if (discordId) {
            const user = await getServerUserByDiscordId(discordId);
            if (user) {
                return user;
            }
        }

        // No authenticated session available
        return null;
    } catch (error: any) {
        // Only log non-DNS errors in production, or all errors in development
        const isNetworkError = error?.code === 'ENOTFOUND' || 
                              error?.message?.includes('getaddrinfo') ||
                              error?.message?.includes('fetch failed');
        
        if (!isNetworkError || process.env.NODE_ENV === 'development') {
            // Log DNS/network errors only in development to reduce noise
            if (isNetworkError && process.env.NODE_ENV === 'development') {
                // Silently handle DNS errors in development (API might be unreachable)
                // This is expected when running locally without API access
            } else {
                console.warn('Error fetching server user (will fallback to client):', error);
            }
        }
        return null;
    }
}

/**
 * Get user by Discord ID on the server
 * @param discordId - Discord ID to fetch user for
 * @returns User object if found, null otherwise
 */
export async function getServerUserByDiscordId(discordId: string): Promise<UserType | null> {
    try {
        const response = await fetch(`${API_URL}/user/${discordId}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error: any) {
        const isNetworkError = error?.code === 'ENOTFOUND' || 
                              error?.message?.includes('getaddrinfo') ||
                              error?.message?.includes('fetch failed');
        
        if (!isNetworkError || process.env.NODE_ENV === 'development') {
            console.error('Error fetching user by Discord ID:', error);
        }
        return null;
    }
}

/**
 * Get user by username on the server
 * @param username - Username to fetch user for
 * @returns User object if found, null otherwise
 */
export async function getServerUserByUsername(username: string): Promise<UserType | null> {
    try {
        const response = await fetch(`${API_URL}/user/username?username=${username}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error: any) {
        const isNetworkError = error?.code === 'ENOTFOUND' || 
                              error?.message?.includes('getaddrinfo') ||
                              error?.message?.includes('fetch failed');
        
        if (!isNetworkError || process.env.NODE_ENV === 'development') {
            console.error('Error fetching user by username:', error);
        }
        return null;
    }
}

/**
 * Check if user is authenticated (convenience export)
 */
export { isAuthenticated } from './cookies';
