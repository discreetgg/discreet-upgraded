"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@bprogress/next/app";
import { cn, formatTimeAgo } from "@/lib/utils";
import { Icon } from "./ui/icons";
import { LoadingPostsCardStack } from "./ui/loading-posts-card-stack";
import { useGlobal } from "@/context/global-context-provider";
import { useNotifications } from "@/hooks/queries/use-notifications";
import usePostOperations from "@/hooks/use-post-operations";
import { readNotificationService } from "@/lib/services";
import { useQueryClient } from "@tanstack/react-query";
import type { NotificationType, PostType } from "@/types/global";
import { ImageWithFallback } from "./miscellaneous/image-with-fallback";

const NotificationIcon = ({
	type,
}: {
	type: NotificationType["entityType"];
}) => {
	switch (type) {
		case "Like":
			return <Icon.likeFilled />;
		case "Comment":
			return <Icon.messagesFilled width={16} height={16} />;
		case "Tip":
			return <Icon.fundFilled />;
		case "Follow":
			return <Icon.profileFilled />;
		default:
			return null;
	}
};

const NotificationDetails = () => {
	const { user } = useGlobal();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab") || "all";

	const { fetchPost } = usePostOperations();
	const [postCache, setPostCache] = useState<Record<string, PostType>>({});
	const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(
		new Set()
	);
	const notificationRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const processedNotificationIds = useRef<Set<string>>(new Set());

	const userId = user?.discordId || "";
	const { data, isLoading } = useNotifications({
		userId,
		page: 1,
		enabled: Boolean(user?.discordId),
	});

	const notifications = data?.notifications ?? [];

	// Filter out invalid notifications
	const validNotifications = useMemo(() => {
		return notifications.filter((n) => n._id);
	}, [notifications]);

	const filteredNotifications = useMemo(() => {
		if (!validNotifications.length) return [];

		if (tab === "all") {
			return validNotifications;
		}

		const typeMap: Record<string, NotificationType["entityType"]> = {
			likes: "Like",
			comments: "Comment",
			tips: "Tip",
			followers: "Follow",
			menu: "MenuPurchase",
		};

		const notificationType = typeMap[tab];
		if (!notificationType) {
			return validNotifications;
		}

		return validNotifications.filter(
			(notification) => notification.entityType === notificationType
		);
	}, [validNotifications, tab]);

	useEffect(() => {
		const entityIds = filteredNotifications
			.filter(
				(notification) =>
					(notification.entityType === "Like" ||
						notification.entityType === "Comment") &&
					Boolean(notification.entityId)
			)
			.map((notification) => notification.entityId as string)
			.filter((entityId) => entityId && !postCache[entityId]);

		if (!entityIds.length) return;

		let isMounted = true;

		(async () => {
			await Promise.all(
				entityIds.map(async (entityId) => {
					try {
						const post = await fetchPost(entityId);
						if (post && isMounted) {
							setPostCache((prev) => ({
								...prev,
								[entityId]: post,
							}));
						}
					} catch (error) {
						console.error(
							"Failed to fetch post for notification",
							entityId,
							error
						);
					}
				})
			);
		})();

		return () => {
			isMounted = false;
		};
	}, [filteredNotifications, fetchPost, postCache]);

	const observerRefs = useRef<Map<string, IntersectionObserver>>(new Map());
	const userIdRef = useRef(userId);
	const queryClientRef = useRef(queryClient);
	const readNotificationIdsRef = useRef(readNotificationIds);

	useEffect(() => {
		userIdRef.current = userId;
		queryClientRef.current = queryClient;
		readNotificationIdsRef.current = readNotificationIds;
	}, [userId, queryClient, readNotificationIds]);

	const setupObserver = useCallback(
		(notification: NotificationType, element: HTMLDivElement) => {
			if (!notification._id || notification.isRead) {
				return;
			}

			const existingObserver = observerRefs.current.get(notification._id);
			if (existingObserver) {
				return;
			}

			const observer = new IntersectionObserver(
				(entries) => {
					const [entry] = entries;
					if (entry.isIntersecting) {
						if (readNotificationIdsRef.current.has(notification._id)) {
							observer.disconnect();
							observerRefs.current.delete(notification._id);
							return;
						}

						if (processedNotificationIds.current.has(notification._id)) {
							return;
						}

						processedNotificationIds.current.add(notification._id);

						setReadNotificationIds((prev) => {
							const newSet = new Set(prev);
							newSet.add(notification._id);
							return newSet;
						});

						readNotificationService({
							discordId: userIdRef.current,
							notificationId: notification._id,
						})
							.then(() => {
								queryClientRef.current.setQueryData(
									["notifications", userIdRef.current, 1],
									(old: any) => {
										if (!old) return old;
										return {
											...old,
											notifications: old.notifications.map(
												(n: NotificationType) =>
													n._id === notification._id
														? { ...n, isRead: true }
														: n
											),
											unreadCount: Math.max(0, (old.unreadCount || 0) - 1),
										};
									}
								);
							})
							.catch((error) => {
								console.error("Failed to mark notification as read:", error);
								setReadNotificationIds((prev) => {
									const newSet = new Set(prev);
									newSet.delete(notification._id);
									return newSet;
								});
								processedNotificationIds.current.delete(notification._id);
							});

						observer.disconnect();
						observerRefs.current.delete(notification._id);
					}
				},
				{
					threshold: 0.1,
					rootMargin: "0px",
				}
			);

			observer.observe(element);
			observerRefs.current.set(notification._id, observer);
		},
		[]
	);

	useEffect(() => {
		const setupObserversForVisible = () => {
			filteredNotifications.forEach((notification) => {
				if (notification.isRead) return;

				const element = notificationRefs.current.get(notification._id);
				if (element && !observerRefs.current.has(notification._id)) {
					setupObserver(notification, element);
				}
			});
		};

		const timeoutId = setTimeout(setupObserversForVisible, 50);
		const timeoutId2 = setTimeout(setupObserversForVisible, 200);

		return () => {
			clearTimeout(timeoutId);
			clearTimeout(timeoutId2);
			observerRefs.current.forEach((observer) => observer.disconnect());
			observerRefs.current.clear();
		};
	}, [filteredNotifications, setupObserver]);

	const markNotificationAsRead = useCallback(
		(notification: NotificationType) => {
			// Skip if already read
			if (notification.isRead) {
				return;
			}

			// Skip if already being processed or marked as read
			if (
				readNotificationIds.has(notification._id) ||
				processedNotificationIds.current.has(notification._id)
			) {
				return;
			}

			// Mark as processed
			processedNotificationIds.current.add(notification._id);

			// Update local state
			setReadNotificationIds((prev) => {
				const newSet = new Set(prev);
				newSet.add(notification._id);
				return newSet;
			});

			// Disconnect observer if it exists
			const observer = observerRefs.current.get(notification._id);
			if (observer) {
				observer.disconnect();
				observerRefs.current.delete(notification._id);
			}

			// Mark as read via API
			readNotificationService({
				discordId: userId,
				notificationId: notification._id,
			})
				.then(() => {
					queryClient.setQueryData(["notifications", userId, 1], (old: any) => {
						if (!old) return old;
						return {
							...old,
							notifications: old.notifications.map((n: NotificationType) =>
								n._id === notification._id ? { ...n, isRead: true } : n
							),
							unreadCount: Math.max(0, (old.unreadCount || 0) - 1),
						};
					});
				})
				.catch((error) => {
					console.error("Failed to mark notification as read:", error);
					setReadNotificationIds((prev) => {
						const newSet = new Set(prev);
						newSet.delete(notification._id);
						return newSet;
					});
					processedNotificationIds.current.delete(notification._id);
				});
		},
		[userId, queryClient, readNotificationIds]
	);

	const renderNotificationContent = (notification: NotificationType) => {
		switch (notification.entityType) {
			case "Like":
				return "liked your post";
			case "Comment":
				return "commented on your post";
			case "Tip":
				return "tipped you";
			case "Follow":
				return "started following you";
			case "MenuPurchase":
				return "bought your menu";
			default:
				return notification.entityType;
		}
	};

	const getPostSnippet = (entityId?: string | null) => {
		if (!entityId) return null;
		const post = postCache[entityId];
		if (!post) return null;

		if (post.title) return post.title;
		if (post.content) return post.content.slice(0, 120);
		return null;
	};

	const handleProfileClick = (
		e: React.MouseEvent,
		username: string | undefined
	) => {
		e.stopPropagation();
		if (username) {
			router.push(`/${username}`);
		}
	};

	const handleNotificationClick = (notification: NotificationType) => {
		// Mark as read if unread
		if (!notification.isRead) {
			markNotificationAsRead(notification);
		}

		// Navigate to post for Like/Comment notifications
		if (
			(notification.entityType === "Like" ||
				notification.entityType === "Comment") &&
			notification.entityId
		) {
			router.push(`/feed/${notification.entityId}`);
		}
	};

	if (isLoading && !notifications.length) {
		return (
			<LoadingPostsCardStack
				title="Loading notifications..."
				className="mt-10"
			/>
		);
	}

	if (!filteredNotifications.length) {
		return (
			<LoadingPostsCardStack title="No notifications found" className="mt-10" />
		);
	}

	return (
		<div className="flex flex-col border-t border-[#1E1E21] rounded-lg mt-[17px]">
			{filteredNotifications.map((notification, index) => (
				<div
					key={notification._id}
					ref={(el) => {
						if (el) {
							notificationRefs.current.set(notification._id, el);
							setupObserver(notification, el);
						} else {
							notificationRefs.current.delete(notification._id);
							const observer = observerRefs.current.get(notification._id);
							if (observer) {
								observer.disconnect();
								observerRefs.current.delete(notification._id);
							}
						}
					}}
					className={cn(
						"py-3.5 px-4 border-b flex flex-col gap-2 border-[#1E1E21]",
						(notification.entityType === "Like" ||
							notification.entityType === "Comment") &&
							notification.entityId &&
							"cursor-pointer hover:bg-[#0A0A0B] transition-colors"
					)}
					onClick={() => handleNotificationClick(notification)}
				>
					<div className="flex items-center gap-2 justify-between w-full">
						<div className="flex gap-5 pt-1.5 w-full">
							<div
								className="relative min-w-[48px] min-h-[48px] rounded-full cursor-pointer "
								onClick={(e) =>
									handleProfileClick(e, notification?.sender?.username)
								}
							>
								<ImageWithFallback
									src={
										`https://cdn.discordapp.com/avatars/${notification?.sender?.discordId}/${notification?.sender?.discordAvatar}.png` ||
										"/user.svg"
									}
									alt={notification?.sender?.username ?? "User"}
									width={48}
									height={48}
									fallbackSrc="/user.svg"
									className="rounded-full shrink-0"
									containerClassName="rounded-full size-[48px] shrink-0"
									showErrorText={false}
								/>

								{notification?.entityType !== "MenuPurchase" && (
									<div className="absolute -right-1.5 -top-[5.5px] w-[21px] h-[21px] bg-[#111316] rounded-full flex items-center justify-center">
										<NotificationIcon type={notification?.entityType} />
									</div>
								)}
							</div>
							<div className="flex flex-col gap-[11.5px] pb-[15.5px] w-full">
								<div className="flex items-center justify-between w-full">
									<div className="flex gap-[7px] items-center">
										<p
											className="text-[15px] font-bold leading-[100%] hover:underline cursor-pointer capitalize"
											onClick={(e) =>
												handleProfileClick(e, notification?.sender?.username)
											}
										>
											{notification?.sender?.username ?? "Unknown user"}
										</p>
										<span className="text-white font-bold text-[15px]">•</span>
										<p
											className={cn(
												"text-[15px] text-[#D4D4D8] font-light",
												notification.entityType === "MenuPurchase" &&
													"text-[#FF007F]"
											)}
										>
											{notification.entityType === "MenuPurchase" && (
												<span className="text-[#D4D4D8] mr-1">
													Bought your menu
												</span>
											)}{" "}
											{renderNotificationContent(notification)}
										</p>
									</div>
									<p className="text-[15px] text-[#8A8C95] font-light whitespace-nowrap">
										{formatTimeAgo(notification?.createdAt)}
									</p>
								</div>

								{(notification.entityType === "Like" ||
									notification.entityType === "Comment") && (
									<div className="flex items-center gap-2">
										<p className="text-[15px] text-[#8A8C95] leading-[20px] tracking-[0.5px]">
											{getPostSnippet(notification.entityId) ?? "View post"}
										</p>
									</div>
								)}

								{notification.entityType === "Tip" && (
									<div className="flex items-center rounded-[10px] gap-2 relative max-w-[437px]x max-w-full min-h-[138px] mx-auto justify-center w-full h-full overflow-hidden">
										<Image
											src="/notification-tip-card.png"
											alt="tip"
											width={437}
											height={138}
											className="object-cover w-full h-full absolute top-0 left-0"
										/>
										<div className="absolute top-0 left-0 lg:w-[419px] w-full blur-[173px] mx-auto aspect-square bg-[#FF007F] -bottom-[60%]" />

										<p
											data-text={
												notification?.metadata?.amount &&
												notification?.metadata?.amount?.toString().length > 6
													? "true"
													: "false"
											}
											className="text-[82px] data-[text=true]:text-7xl text-white z-10 leading-[20px] tracking-[0.5px] text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
										>
											$
											{notification?.metadata?.amount!.toLocaleString(
												undefined,
												{
													minimumFractionDigits: 0,
													maximumFractionDigits: 0,
												}
											)}
										</p>
										<p
											data-text={
												notification?.metadata?.amount &&
												notification?.metadata?.amount?.toString().length > 4
													? "true"
													: "false"
											}
											className="text-[82px] data-[text=true]:text-7xl text-white  z-[9] leading-[20px] tracking-[0.5px] text-center blur-[2.8px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
										>
											$
											{notification?.metadata?.amount!.toLocaleString(
												undefined,
												{
													minimumFractionDigits: 0,
													maximumFractionDigits: 0,
												}
											)}
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default NotificationDetails;
