"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

interface Props {
	title: string;
	description: string;
	onRefresh?: () => void;
	disabled?: boolean;
}

const EXTENDED_WAIT_TIME = 20000; // 20 seconds
const AUTO_REFRESH_TIME = 40000; // 40 seconds

export default function LoadingState({
	title,
	description,
	onRefresh,
	disabled = false,
}: Props) {
	const [loadingState, setLoadingState] = useState<
		"initial" | "extended" | "auto-refresh"
	>("initial");
	const [isRefreshing, setIsRefreshing] = useState(false);
	const extendedTimerRef = useRef<NodeJS.Timeout | null>(null);
	const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
	const mountTimeRef = useRef<number>(Date.now());

	const resetState = useCallback(() => {
		setLoadingState("initial");
		setIsRefreshing(false);
		mountTimeRef.current = Date.now();
	}, []);

	const clearAllTimers = useCallback(() => {
		if (extendedTimerRef.current) {
			clearTimeout(extendedTimerRef.current);
			extendedTimerRef.current = null;
		}
		if (autoRefreshTimerRef.current) {
			clearTimeout(autoRefreshTimerRef.current);
			autoRefreshTimerRef.current = null;
		}
	}, []);

	const handleRefresh = useCallback(async () => {
		if (disabled || isRefreshing) return;

		setIsRefreshing(true);
		clearAllTimers();

		try {
			if (onRefresh) {
				await onRefresh();
			} else {
				window.location.reload();
			}
		} catch (error) {
			console.error("Refresh failed:", error);

			resetState();
		}
	}, [disabled, isRefreshing, onRefresh, clearAllTimers, resetState]);

	const handleAutoRefresh = useCallback(() => {
		if (disabled) return;

		setLoadingState("auto-refresh");

		setTimeout(() => {
			handleRefresh();
		}, 1000);
	}, [disabled, handleRefresh]);

	useEffect(() => {
		if (disabled) {
			clearAllTimers();
			return;
		}

		clearAllTimers();

		extendedTimerRef.current = setTimeout(() => {
			setLoadingState("extended");
		}, EXTENDED_WAIT_TIME);

		autoRefreshTimerRef.current = setTimeout(() => {
			handleAutoRefresh();
		}, AUTO_REFRESH_TIME);

		return () => {
			clearAllTimers();
		};
	}, [disabled, handleAutoRefresh, clearAllTimers]);

	useEffect(() => {
		return () => {
			clearAllTimers();
		};
	}, [clearAllTimers]);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				clearAllTimers();
			} else if (!disabled && loadingState === "initial") {
				const elapsedTime = Date.now() - mountTimeRef.current;
				const extendedTimeRemaining = Math.max(
					0,
					EXTENDED_WAIT_TIME - elapsedTime
				);
				const autoRefreshTimeRemaining = Math.max(
					0,
					AUTO_REFRESH_TIME - elapsedTime
				);

				if (extendedTimeRemaining > 0) {
					extendedTimerRef.current = setTimeout(() => {
						setLoadingState("extended");
					}, extendedTimeRemaining);
				} else if (autoRefreshTimeRemaining > 0) {
					setLoadingState("extended");
				}

				if (autoRefreshTimeRemaining > 0) {
					autoRefreshTimerRef.current = setTimeout(() => {
						handleAutoRefresh();
					}, autoRefreshTimeRemaining);
				} else {
					handleAutoRefresh();
				}
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [disabled, loadingState, handleAutoRefresh, clearAllTimers]);

	const renderExtendedMessage = () => {
		if (loadingState === "extended") {
			return (
				<div className="mt-4 p-4  bg-accent-color/10 border border-accent-color/30 rounded-xl pl-2 py-2 border-r-4 border-b-4">
					<div className="flex flex-col items-center gap-3 md:flex-row md:items-start">
						<div className="flex-1">
							<p className="text-sm text-accent-color ">
								This is taking longer than usual. Please be patient or try
								refreshing the page.
							</p>
						</div>
						<Button
							onClick={handleRefresh}
							disabled={isRefreshing}
							className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Refresh page"
						>
							<RefreshCw
								className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
							/>
							{isRefreshing ? "Refreshing..." : "Refresh"}
						</Button>
					</div>
				</div>
			);
		}

		if (loadingState === "auto-refresh") {
			return (
				<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
					<div className="flex items-center gap-3">
						<RefreshCw className="size-4 animate-spin text-red-600" />
						<p className="text-sm text-red-800">
							The page is about to automatically refresh.
						</p>
					</div>
				</div>
			);
		}

		return null;
	};

	return (
		<div className="flex flex-1 items-center justify-center px-8 py-4">
			<div className="flex w-full max-w-md flex-col items-center justify-center gap-y-6 rounded-lg bg-black p-10 shadow-sm ">
				<Loader2 className="text-accent-color size-6 animate-spin" />
				<div className="flex flex-col gap-y-2 text-center">
					<h6 className="text-lg font-medium">{title}</h6>
					<p className="text-muted-foreground text-sm">{description}</p>
				</div>
				{renderExtendedMessage()}
			</div>
		</div>
	);
}
