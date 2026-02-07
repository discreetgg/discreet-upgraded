import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { baseURL } from './data';
import { discordSigninService } from './services';

let isRefreshing = false;
const failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
}[] = [];

const api = setupCache(
  axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  }),
  {
    ttl: 1000 * 60 * 10, // 10 minutes - increased from 5 minutes
    interpretHeader: true,
    methods: ['get'],
    cachePredicate: (response) => {
      const url = response.config?.url || '';
      if (url.includes('/creator/server') && !url.includes('/has-liked/')) {
        return false;
      }
      return response.status >= 200 && response.status < 300;
    },
  }
);

const refreshToken = async () => {
  return axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
};

// Add token to all requests from localStorage
api.interceptors.request.use(
  (config) => {
    // Read token from localStorage (set during login)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if user has an existing session by checking localStorage
    // Only attempt token refresh if user was previously authenticated
    const hasAuthSession =
      typeof window !== 'undefined' &&
      (localStorage.getItem('root:auth') ||
        localStorage.getItem('root:global') ||
        localStorage.getItem('auth_token'));

    let wasAuthenticated = false;
    if (typeof window !== 'undefined') {
      wasAuthenticated = !!localStorage.getItem('auth_token') ||
        !!localStorage.getItem('root:auth') ||
        !!localStorage.getItem('root:global');
    }

    // Skip token refresh for logout requests - let logout complete without redirecting
    const isLogoutRequest = originalRequest?.url?.includes('/auth/logout');

    if (
      (error.response?.status === 403 || error.response?.status === 401) &&
      !originalRequest._retry &&
      wasAuthenticated && // Only retry if user was previously authenticated
      !isLogoutRequest // Don't refresh token on logout requests
    ) {
      originalRequest._retry = true;

      // For guest users, we might not have a refresh token mechanism via cookies on localhost
      // If we are on localhost and the backend is remote, refreshToken() will fail
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)),
            reject: (err) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        await refreshToken();

        // Retry queued requests after refresh
        // biome-ignore lint/complexity/noForEach: <explanation>
        failedQueue.forEach((p) => p.resolve());
        failedQueue.length = 0;

        return api(originalRequest);
      } catch (err) {
        // Reject queued requests if refresh fails
        // biome-ignore lint/complexity/noForEach: <explanation>
        failedQueue.forEach((p) => p.reject(err));
        failedQueue.length = 0;

        // For guest users, don't automatically redirect to Discord
        // Instead, just clear local auth state if refresh fails
        if (typeof window !== 'undefined') {
          // Check if it's a guest session (no discordId or similar)
          const globalData = localStorage.getItem('root:global');
          let isGuest = true;
          if (globalData) {
            try {
              const parsed = JSON.parse(globalData);
              if (parsed.user?.discordId && !parsed.user?.discordId.startsWith('guest_')) {
                isGuest = false;
              }
            } catch (e) { }
          }

          if (!isGuest) {
            await discordSigninService();
          } else {
            // Just clear token and redirect to /auth
            localStorage.removeItem('auth_token');
            localStorage.removeItem('root:auth');
            // Dispatch event to notify context providers
            window.dispatchEvent(new Event('storage'));
          }
        }

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 400 Bad Request errors - often backend configuration issues
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || errorData?.error || 'Bad Request';
      const errorString = JSON.stringify(errorData).toLowerCase();
      
      // Log backend errors for debugging, but don't expose internal details to users
      if (process.env.NODE_ENV === 'development') {
        console.error('Backend error (400):', {
          message: errorMessage,
          error: errorData?.error,
          statusCode: errorData?.statusCode,
          url: originalRequest?.url,
        });
      }
      
      // Check for Anchor/Solana IDL errors
      const isAnchorError = 
        errorMessage.includes('Account size calculation failed') ||
        errorMessage.includes('Cannot read properties') ||
        errorMessage.includes('IDL') ||
        errorMessage.includes('Anchor') ||
        errorMessage.includes('createProgram') ||
        errorString.includes('anchor') ||
        errorString.includes('idl') ||
        errorString.includes('createprogram');
      
      // Enhance error with more context
      const enhancedError = {
        ...error,
        response: {
          ...error.response,
          data: {
            ...errorData,
            userMessage: isAnchorError
              ? 'The payment service is currently misconfigured. Please contact support or try again later.'
              : errorMessage.includes('databaseName') || 
                errorMessage.includes('Cannot read properties')
              ? 'Server configuration error. Please contact support if this persists.'
              : errorMessage,
          },
        },
      };
      
      return Promise.reject(enhancedError);
    }

    // For guest users (not authenticated), just pass through the error
    return Promise.reject(error);
  }
);

export default api;
