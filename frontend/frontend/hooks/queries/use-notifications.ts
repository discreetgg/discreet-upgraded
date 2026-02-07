"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotificationsService } from "@/lib/services";
import { useSocket } from "@/context/socket-context";

import type { NotificationsResponseType } from "@/types/global";

type UseNotificationsParams = {
	userId: string;
	page?: number;
	enabled?: boolean;
};

export const useNotifications = ({
	userId,
	page = 1,
	enabled = true,
}: UseNotificationsParams) => {
	const { newNotifications } = useSocket();
	const queryClient = useQueryClient();

	const fetchNotifications = useQuery({
		queryKey: ["notifications", userId, page],
		queryFn: async (): Promise<NotificationsResponseType> => {
			return await getNotificationsService({ userId, page });
		},
		enabled: enabled && Boolean(userId),
		staleTime: 2 * 60 * 1000, // 2 minutes - notifications can be cached briefly
		gcTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: true, // Refetch notifications on focus
		retry: 2,
	});

	// Update query data when new notification arrives via socket
	useEffect(() => {
		if (!newNotifications) return;

		// Ensure notification has an ID before processing
		if (!newNotifications._id) {
			console.warn("Received notification without ID:", newNotifications);
			return;
		}

		queryClient.setQueryData(
			["notifications", userId, page],
			(old: NotificationsResponseType | undefined) => {
				if (!old) return old;

				// Check if notification already exists using the latest data
				const exists = old.notifications.some(
					(notification) => notification._id === newNotifications._id
				);

				if (exists) return old;

				return {
					...old,
					notifications: [newNotifications, ...old.notifications],
					unreadCount: old.unreadCount + 1,
				};
			}
		);
	}, [newNotifications, userId, page, queryClient]);

	return fetchNotifications;
};
