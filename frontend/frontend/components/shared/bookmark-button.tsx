"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGlobal } from "@/context/global-context-provider";
import { useBookmarkMutation } from "@/hooks/mutations/use-bookmark-mutation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { inDevEnvironment } from "@/lib/utils";

export default function BookmarkButton({
	postId,
	initialBookmarked = false,
	isBookmarkPage = false,
	skipInitialFetch = false,
	deferStatusFetch = true,
	autoResolveOnVisible = true,
}: {
	postId: string;
	initialBookmarked?: boolean;
	isBookmarkPage?: boolean;
	skipInitialFetch?: boolean;
	deferStatusFetch?: boolean;
	autoResolveOnVisible?: boolean;
}) {
	const { user } = useGlobal();
	const discordId = user?.discordId;

	const [isBookmarked, setIsBookmarked] = useState<boolean>(initialBookmarked);
	const [isStatusEnabled, setIsStatusEnabled] = useState(
		!deferStatusFetch || skipInitialFetch
	);
	const [isResolvingInitialStatus, setIsResolvingInitialStatus] =
		useState(false);
	const [pendingToggle, setPendingToggle] = useState(false);
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const queryClient = useQueryClient();
	const mutation = useBookmarkMutation();

	useEffect(() => {
		let mounted = true;
		if (!discordId || !postId) return;
		if (skipInitialFetch) return;
		if (!isStatusEnabled) return;

		setIsResolvingInitialStatus(true);

		queryClient
			.fetchQuery({
				queryKey: ["bookmarks", discordId, "has-bookmarked", postId],
				queryFn: async ({ signal }) => {
					const res = await api.get(
						`/post/bookmark/${discordId}/${postId}/has-bookmarked`,
						{ signal },
					);
					if (res.data && typeof res.data.bookmarked === "boolean") {
						return res.data.bookmarked;
					}
					return !!res.data;
				},
				staleTime: 5 * 60 * 1000,
				gcTime: 10 * 60 * 1000,
			})
			.then((res: boolean) => {
				if (!mounted) return;
				setIsBookmarked(Boolean(res));
			})
			.catch(() => {})
			.finally(() => {
				if (mounted) {
					setIsResolvingInitialStatus(false);
				}
			});

		return () => {
			mounted = false;
		};
	}, [discordId, postId, skipInitialFetch, isStatusEnabled, queryClient]);

	useEffect(() => {
		if (
			!deferStatusFetch ||
			!autoResolveOnVisible ||
			isStatusEnabled ||
			skipInitialFetch
		) {
			return;
		}

		const target = buttonRef.current;
		if (!target || typeof IntersectionObserver === "undefined") {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry?.isIntersecting) return;
				setIsStatusEnabled(true);
				observer.disconnect();
			},
				{
					root: null,
					threshold: 0.2,
					rootMargin: "120px 0px",
				}
			);

		observer.observe(target);

		return () => {
			observer.disconnect();
		};
	}, [
		deferStatusFetch,
		autoResolveOnVisible,
		isStatusEnabled,
		skipInitialFetch,
	]);

	const performToggle = useCallback(() => {
		if (!postId) return;
		if (!discordId) return;

		const currentlyBookmarked = isBookmarked;

		setIsBookmarked((prev) => !prev);
		if (isBookmarkPage) {
			mutation.mutate(
				{ discordId, postId, isBookmarked: currentlyBookmarked },
				{
					onError: () => {
						// rollback local state on error
						setIsBookmarked((prev) => !prev);
					},
				}
			);
			return;
		}
		if (currentlyBookmarked) {
			toast.success("Removed from bookmarks");

			api
				.delete(`/post/bookmark/${discordId}/${postId}`)
				.then((res) => {
					inDevEnvironment && console.log("DELETE BM", res.data);
					if (!res.data.message.includes("Bookmark removed")) {
						setIsBookmarked((prev) => !prev);
					}
				})
				.catch(() => {
					setIsBookmarked((prev) => !prev);
				});
		} else {
			toast.success("Added to bookmarks");
			api.post(`/post/bookmark/${discordId}`, { postId }).catch(() => {
				setIsBookmarked((prev) => !prev);
			});
		}

		queryClient.invalidateQueries({
			queryKey: ["bookmarks", discordId, "has-bookmarked", postId],
		});
	}, [discordId, isBookmarked, isBookmarkPage, mutation, postId, queryClient]);

	useEffect(() => {
		if (!pendingToggle || isResolvingInitialStatus || !isStatusEnabled) {
			return;
		}

		performToggle();
		setPendingToggle(false);
	}, [
		pendingToggle,
		isResolvingInitialStatus,
		isStatusEnabled,
		performToggle,
	]);

	const handleToggle = () => {
		if (!postId || !discordId) return;

		if (!isStatusEnabled && !skipInitialFetch) {
			setIsStatusEnabled(true);
			setPendingToggle(true);
			return;
		}

		performToggle();
	};

	return (
		<button
			ref={buttonRef}
			onClick={handleToggle}
			disabled={mutation.isPending || (pendingToggle && isResolvingInitialStatus)}
			className="relative group
					 transition-all duration-300 "
			aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
			aria-pressed={isBookmarked}
		>
			<div className="relative size-5">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
					className={`absolute inset-0 transition-all duration-500 ease-out
					${isBookmarked ? "opacity-0 scale-50" : "opacity-100 "}`}
					style={{
						transformOrigin: "center",
						pointerEvents: "none",
					}}
				>
					<title>Bookmark outline</title>
					<path
						d="M11.7998 8.33325H12.2915"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-accent-text"
					/>
					<path
						d="M7.70801 8.33325H9.708"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-accent-text"
					/>
					<path
						d="M2.91653 9.16675V15.2501C2.91653 17.4667 4.1332 17.9917 5.6082 16.4084L5.61654 16.4001C6.29987 15.6751 7.34154 15.7334 7.9332 16.5251L8.77486 17.6501C9.44986 18.5417 10.5415 18.5417 11.2165 17.6501L12.0582 16.5251C12.6582 15.7251 13.6999 15.6667 14.3832 16.4001C15.8665 17.9834 17.0749 17.4584 17.0749 15.2417V5.86675C17.0749 2.50842 16.2915 1.66675 13.1415 1.66675H6.84154C3.69154 1.66675 2.9082 2.50842 2.9082 5.86675"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="text-accent-text"
					/>
				</svg>

				{/* CHECKED STATE - Filled Bookmark */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					className={`absolute inset-0 transition-all duration-500 ease-out
					${isBookmarked ? "opacity-100 scale-100 " : "opacity-0 scale-50 "}`}
					style={{
						transformOrigin: "center",
						pointerEvents: "none",
					}}
				>
					<g clipPath="url(#clip0_4418_169722)">
						<path
							d="M15.78 2H8.22C4.44 2 3.5 3.01 3.5 7.04V18.3C3.5 20.96 4.96 21.59 6.73 19.69L6.74 19.68C7.56 18.81 8.81 18.88 9.52 19.83L10.53 21.18C11.34 22.25 12.65 22.25 13.46 21.18L14.47 19.83C15.19 18.87 16.44 18.8 17.26 19.68C19.04 21.58 20.49 20.95 20.49 18.29V7.04C20.5 3.01 19.56 2 15.78 2ZM14.75 10.75H9.25C8.84 10.75 8.5 10.41 8.5 10C8.5 9.59 8.84 9.25 9.25 9.25H14.75C15.16 9.25 15.5 9.59 15.5 10C15.5 10.41 15.16 10.75 14.75 10.75Z"
							className="fill-accent-text"
						/>
					</g>
					<defs>
						<clipPath id="clip0_4418_169722">
							<rect width="24" height="24" fill="white" />
						</clipPath>
					</defs>
				</svg>
			</div>
		</button>
	);
}
