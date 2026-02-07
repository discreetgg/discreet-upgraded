import { setAuthCookie } from '@/lib/cookies';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cookie name for storing Discord ID (client-readable)
 */
const DISCORD_ID_COOKIE = 'discord_id';

/**
 * API route to set Discord ID cookie
 * Called from client-side after successful authentication
 * Sets both httpOnly (server-side) and client-readable cookies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discordId } = body;

    if (!discordId || typeof discordId !== 'string') {
      return NextResponse.json(
        { error: 'Discord ID is required' },
        { status: 400 }
      );
    }

    // rS2fn5nRyQJyeaqowWCAKd5G1VmnURWdXvQ8ts3pnYj

    // Set the Discord ID cookie (httpOnly for security)
    // httpOnly cookies are more secure and can't be accessed via JavaScript
    // The client will verify auth via API calls which automatically include httpOnly cookies
    await setAuthCookie(discordId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting Discord ID cookie:', error);
    return NextResponse.json(
      { error: 'Failed to set Discord ID cookie' },
      { status: 500 }
    );
  }
}

