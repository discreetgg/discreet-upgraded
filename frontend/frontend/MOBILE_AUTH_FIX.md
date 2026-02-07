# Mobile Authentication Fix

## Problem
Discord OAuth authentication was not working properly on mobile devices. Users would be redirected to Discord, authorize the app, but then not be properly authenticated when returning to the application.

## Root Causes

### 1. **Missing OAuth Callback Handler**
The application didn't have a dedicated page to handle the OAuth redirect on the client side. This meant:
- No explicit validation that authentication succeeded
- No proper state management after OAuth completion
- No handling of OAuth errors

### 2. **Mobile Browser Cookie Restrictions**
Modern mobile browsers (especially iOS Safari) have strict cookie policies:
- Third-party cookies are blocked by default
- `SameSite` cookie restrictions are enforced more strictly
- Cookies set during redirects may not persist

### 3. **Silent Authentication Failures**
- The global context provider would fail silently on initial load
- No clear feedback to users about what went wrong
- SessionStorage was being used but might not persist through OAuth redirects on mobile

## Solution Implemented

### 1. Created OAuth Callback Handler (`/auth/callback`)
**File:** `app/(auth)/auth/callback/page.tsx`

This new page:
- Handles the redirect from Discord OAuth
- Explicitly checks authentication by fetching user data
- Sets authentication state in the React context
- Provides clear error messages if authentication fails
- Redirects users to their intended destination

### 2. Updated Discord Sign-in Service
**File:** `lib/services.ts` - `discordSigninService()`

Enhanced the sign-in function to:
- Detect mobile devices using user agent
- Pass an explicit callback URL for mobile devices
- Store the original page in sessionStorage for post-auth redirect
- Ensure the backend knows where to redirect after OAuth

### 3. Improved Global Context Provider
**File:** `context/global-context-provider.tsx`

Modified the authentication check on mount to:
- Handle authentication failures silently on initial load
- Not show error toasts before OAuth completes
- Still fetch and validate user data from cookies

## How It Works Now

### Desktop Flow (Unchanged)
1. User clicks "Sign in with Discord"
2. Redirects to Discord OAuth
3. Discord redirects back to backend
4. Backend sets authentication cookie and redirects to frontend
5. Frontend loads and validates authentication via cookie

### Mobile Flow (New)
1. User clicks "Sign in with Discord"
2. Mobile detection triggers and passes callback URL
3. Redirects to Discord OAuth with `?callback=<url>`
4. Discord redirects to backend with callback parameter
5. Backend sets authentication cookie (with appropriate SameSite settings)
6. Backend redirects to `/auth/callback`
7. **Callback page explicitly validates authentication**
8. Sets auth state in React context
9. Redirects to original page or home

## Backend Requirements

For this fix to work completely, the backend needs to:

1. **Accept and use the `callback` parameter:**
   ```
   GET /auth/discord/signin?callback=<encoded_callback_url>
   ```

2. **Set cookies with proper SameSite configuration:**
   ```javascript
   // For mobile compatibility
   res.cookie('auth_token', token, {
     httpOnly: true,
     secure: true,
     sameSite: 'none', // Important for mobile OAuth
     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
   });
   ```

3. **Redirect to the callback URL after OAuth:**
   ```javascript
   // After successful OAuth
   const callbackUrl = req.query.callback || defaultRedirectUrl;
   res.redirect(callbackUrl);
   ```

4. **Handle OAuth errors:**
   ```javascript
   // On OAuth failure
   res.redirect(`${callbackUrl}?error=access_denied&error_description=User%20cancelled`);
   ```

## Testing

### Test on Mobile Devices
1. Open the app on a mobile device (iOS Safari, Chrome mobile)
2. Click "Sign in with Discord"
3. Authorize the Discord app
4. Verify you're redirected back and authenticated
5. Verify you stay authenticated after refreshing

### Test Error Handling
1. Decline Discord authorization
2. Verify error message is shown
3. Verify redirect back to sign-in page

### Test Desktop (Regression)
1. Verify desktop OAuth flow still works
2. Verify no breaking changes to existing flow

## Monitoring

Watch for:
- 401/403 errors on `/api/user/me` endpoint (auth check)
- Users stuck on `/auth/callback` page
- Reports of "Authentication failed" messages
- Issues with specific mobile browsers (especially iOS Safari)

## Future Improvements

1. **Add retry logic** in the callback handler for transient failures
2. **Better error categorization** (network vs. auth vs. backend errors)
3. **Analytics** to track OAuth success/failure rates by device type
4. **Fallback authentication method** for browsers with strict cookie policies
5. **Progress indicator** during the OAuth flow to improve UX
