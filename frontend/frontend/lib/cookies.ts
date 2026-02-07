import { cookies } from 'next/headers';

/**
 * Cookie name for storing Discord ID
 */
const DISCORD_ID_COOKIE = 'discord_id';
const AUTH_TOKEN_COOKIE = 'auth_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Cookie options for auth cookies (server-side)
 */
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
};

/**
 * Client-side cookie options (not httpOnly so document.cookie can read them)
 */
const CLIENT_COOKIE_OPTIONS = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
};

// ==================== SERVER-SIDE FUNCTIONS ====================

/**
 * Get the Discord ID from cookies (server-side only)
 * @returns Discord ID if authenticated, null otherwise
 */
export async function getAuthCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(DISCORD_ID_COOKIE);
    return cookie?.value ?? null;
}

/**
 * Set the Discord ID cookie (server-side only)
 * Used after successful Discord OAuth login
 * @param discordId - The Discord ID to store
 */
export async function setAuthCookie(discordId: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(DISCORD_ID_COOKIE, discordId, COOKIE_OPTIONS);
}

/**
 * Clear the auth cookie (server-side only)
 * Used during logout
 */
export async function clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(DISCORD_ID_COOKIE);
}

/**
 * Check if user is authenticated by checking cookie existence (server-side)
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
    const discordId = await getAuthCookie();
    return !!discordId;
}

// ==================== CLIENT-SIDE FUNCTIONS ====================

/**
 * Get a cookie value by name (client-side)
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
}

/**
 * Set a cookie (client-side)
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 */
export function setCookie(
    name: string,
    value: string,
    options: {
        maxAge?: number;
        expires?: Date;
        path?: string;
        domain?: string;
        secure?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
    } = {}
): void {
    if (typeof document === 'undefined') return;

    let cookieString = `${name}=${value}`;

    if (options.maxAge) {
        cookieString += `; max-age=${options.maxAge}`;
    }

    if (options.expires) {
        cookieString += `; expires=${options.expires.toUTCString()}`;
    }

    cookieString += `; path=${options.path || '/'}`;

    if (options.domain) {
        cookieString += `; domain=${options.domain}`;
    }

    if (options.secure) {
        cookieString += '; secure';
    }

    if (options.sameSite) {
        cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;
}

/**
 * Delete a cookie (client-side)
 * @param name - Cookie name
 * @param path - Cookie path (default: '/')
 */
export function deleteCookie(name: string, path = '/'): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
}

/**
 * Get auth token from cookie (client-side)
 * @returns Auth token or null if not found
 */
export function getAuthTokenCookie(): string | null {
    return getCookie(AUTH_TOKEN_COOKIE);
}

/**
 * Set auth token cookie (client-side)
 * @param token - Auth token
 */
export function setAuthTokenCookie(token: string): void {
    setCookie(AUTH_TOKEN_COOKIE, token, {
        ...CLIENT_COOKIE_OPTIONS,
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
}

/**
 * Get Discord ID from cookie (client-side)
 * @returns Discord ID or null if not found
 */
export function getDiscordIdCookie(): string | null {
    return getCookie(DISCORD_ID_COOKIE);
}

/**
 * Set Discord ID cookie (client-side)
 * @param discordId - Discord ID
 */
export function setDiscordIdCookie(discordId: string): void {
    setCookie(DISCORD_ID_COOKIE, discordId, {
        ...CLIENT_COOKIE_OPTIONS,
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
}

/**
 * Get refresh token from cookie (client-side)
 * @returns Refresh token or null if not found
 */
export function getRefreshTokenCookie(): string | null {
    return getCookie(REFRESH_TOKEN_COOKIE);
}

/**
 * Set refresh token cookie (client-side)
 * @param token - Refresh token
 */
export function setRefreshTokenCookie(token: string): void {
    setCookie(REFRESH_TOKEN_COOKIE, token, {
        ...CLIENT_COOKIE_OPTIONS,
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
}

/**
 * Check if any auth cookie exists (client-side)
 * @returns true if any auth cookie exists
 */
export function hasAuthCookie(): boolean {
    return !!(
        getAuthTokenCookie() ||
        getDiscordIdCookie() ||
        getRefreshTokenCookie()
    );
}

/**
 * Clear all auth cookies (client-side)
 */
export function clearAllAuthCookies(): void {
    deleteCookie(AUTH_TOKEN_COOKIE);
    deleteCookie(DISCORD_ID_COOKIE);
    deleteCookie(REFRESH_TOKEN_COOKIE);
}
