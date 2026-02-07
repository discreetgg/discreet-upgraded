import { isServer, QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// Increase staleTime to 5 minutes to reduce unnecessary refetches
				staleTime: 10 * 60 * 1000, // 10 minutes - instant navigation
				// Garbage collection time - keep unused data for 10 minutes
				gcTime: 15 * 60 * 1000, // 15 minutes
				// Retry failed queries 3 times with exponential backoff
				retry: 3,
				retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
				// Don't refetch on window focus by default (can be overridden per query)
				refetchOnWindowFocus: false,
				// Refetch on reconnect for important data
				refetchOnReconnect: true,
				// Don't refetch on mount if data is fresh
				refetchOnMount: false,
			},
			mutations: {
				// Retry failed mutations once
				retry: 1,
			},
		},
	});
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
	if (isServer) {
		// Server: always make a new query client
		return makeQueryClient();
	} else {
		// Browser: make a new query client if we don't already have one
		// This is very important, so we don't re-make a new client if React
		// suspends during the initial render. This may not be needed if we
		// have a suspense boundary BELOW the creation of the query client
		if (!browserQueryClient) browserQueryClient = makeQueryClient();
		return browserQueryClient;
	}
}
