import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getNotificationsService, getConversationsService } from '@/lib/services';

/**
 * Prefetch data for all common pages in the background
 * This makes navigation feel instant like Discord
 */
export function usePrefetchPages(userId: string | undefined) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) return;

        // Prefetch notifications
        queryClient.prefetchQuery({
            queryKey: ['notifications', userId, 1],
            queryFn: () => getNotificationsService({ userId, page: 1 }),
            staleTime: 5 * 60 * 1000, // 5 minutes
        });

        // Prefetch conversations
        queryClient.prefetchQuery({
            queryKey: ['conversations'],
            queryFn: () => getConversationsService(),
            staleTime: 30 * 1000, // 30 seconds
        });

        // Prefetch more pages as needed...
    }, [userId, queryClient]);
}
