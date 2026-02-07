"use client";

import { Search, Loader2, X, TrendingUp, Clock } from "lucide-react";

import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { UserType } from "@/types/global";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Image from "next/image";
import { useRouter } from "@bprogress/next/app";
import { Icon } from "../ui/icons";
import { ImageWithFallback } from "../miscellaneous/image-with-fallback";

interface GlobalSearchProps {
	placeholder?: string;
	className?: string;
	onResultSelect?: (result: UserType) => void;
}

export function GlobalSearch({
	placeholder = "Search creators, cams, servers...",
	className,
	onResultSelect,
}: GlobalSearchProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<UserType[]>([]);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [recentSearches, setRecentSearches] = useState<string[]>([]);

	const router = useRouter();
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const searchContainerRef = useRef<HTMLDivElement>(null);
	const mobileOverlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Handle click outside for desktop dropdown only
		// Mobile uses full-screen overlay, so click outside doesn't apply
		function handleClickOutside(event: MouseEvent) {
			if (!searchContainerRef.current) return;

			const target = event.target as Node;

			// Don't close if clicking inside mobile overlay
			if (mobileOverlayRef.current?.contains(target)) {
				return;
			}

			// Only close if clicking outside the desktop search container
			if (!searchContainerRef.current.contains(target)) {
				setOpen(false);
			}
		}

		// Only attach click outside handler for desktop (searchContainerRef is only visible on desktop)
		// Mobile overlay closes via close button only
		if (open && searchContainerRef.current) {
			// Check if desktop search container is actually visible
			const rect = searchContainerRef.current.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				// Only attach if container is visible (desktop)
				document.addEventListener("mousedown", handleClickOutside);
			}
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [open]);

	// Load recent searches from localStorage
	useEffect(() => {
		const saved = localStorage.getItem("discreet-recent-searches");
		if (saved) {
			try {
				setRecentSearches(JSON.parse(saved).slice(0, 5));
			} catch (error) {
				console.error("Failed to load recent searches:", error);
			}
		}
	}, []);

	useEffect(() => {
		if (query.length > 0) return;

		setResults([]);
		setSuggestions([]);
	}, [query]);
	// Save recent search
	const saveRecentSearch = (searchQuery: string) => {
		const updated = [
			searchQuery,
			...recentSearches.filter((s) => s !== searchQuery),
		].slice(0, 5);

		setRecentSearches(updated);
		localStorage.setItem("discreet-recent-searches", JSON.stringify(updated));
	};

	// Debounced search function
	const performSearch = async (searchQuery: string) => {
		if (!results.length && searchQuery.length < 2) {
			setResults([]);
			setSuggestions([]);
			return;
		}
		if (searchQuery.length < 2) return;
		setLoading(true);

		try {
			const searchResponse = await fetch(
				`/api/search?q=${encodeURIComponent(searchQuery)}`
			);

			if (searchResponse.ok) {
				const data = await searchResponse.json();

				setResults(data.data || []);
				setSuggestions([]);
			}
		} catch (error) {
			console.error("Search error:", error);
		} finally {
			setLoading(false);
		}
	};

	// Handle input change with debouncing
	const handleInputChange = (value: string) => {
		// Always update the query state
		setQuery(value);

		// Clear previous timeout
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// Clear results if input is empty
		if (!value.trim().length) {
			setResults([]);
			setSuggestions([]);
			return;
		}

		// Set new timeout for search
		debounceTimeoutRef.current = setTimeout(() => {
			performSearch(value);
		}, 300);
	};

	// Handle result selection
	const handleResultSelect = (result: UserType) => {
		saveRecentSearch(query);
		setOpen(false);
		setTimeout(() => setQuery(""), 500);

		if (onResultSelect) {
			onResultSelect(result);
			return;
		}

		router.push(`/${result.username}`);
	};

	// Handle suggestion selection
	const handleSuggestionSelect = (suggestion: string) => {
		setQuery(suggestion);
		performSearch(suggestion);
	};

	// Handle recent search selection
	const handleRecentSearchSelect = (recentQuery: string) => {
		setQuery(recentQuery);
		performSearch(recentQuery);
	};

	// Clear recent searches
	const clearRecentSearches = () => {
		setRecentSearches([]);
		localStorage.removeItem("discreet-recent-searches");
	};

	const showPlaceholder =
		!query.length &&
		!results.length &&
		!suggestions.length &&
		!recentSearches.length;

	return (
		<>
			{/* Mobile: Button to trigger search */}
			{!open && (
				<button
					onClick={() => setOpen(true)}
					className={cn(
						"  md:hidden! flex items-center justify-center w-8 h-8 rounded-lg border border-border hover:bg-muted/50 transition-colors",
						className
					)}
					aria-label="Search"
				>
					<Icon.search className="md:size-4 size-6 text-muted-foreground " />
				</button>
			)}

			{/* Desktop: Always visible search bar */}
			<div
				ref={searchContainerRef}
				className={cn(
					"hidden md:block relative  w-full transition-all duration-300",
					"md:max-w-[380px]",
					className
				)}
			>
				<div className="relative">
					<Icon.search className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-muted-foreground z-10" />
					<Input
						placeholder={placeholder}
						value={query}
						onFocus={() => setOpen(true)}
						onChange={(e) => handleInputChange(e.target.value)}
						className="border border-border px-8 h-12 rounded-full text-sm focus-visible:ring-1"
					/>
					<Button
						data-clear={query.length > 0}
						className="absolute right-0 hidden data-[clear=true]:flex top-1/2 -translate-y-1/2 text-accent-text"
						onClick={() => setQuery("")}
						variant="ghost"
					>
						<Icon.close />
					</Button>
				</div>

				{open && (
					<div className="h-96 lg:h-[588px] overflow-y-auto absolute bg-primary w-full mt-2 rounded-xl border shadow-2xl z-[9999]">
						{showPlaceholder && (
							<div className="size-full items-center justify-center flex text-accent-text">
								Search results appears here
							</div>
						)}

						{recentSearches.length > 0 && (
							<div className="p-2">
								<div className="text-muted-foreground mb-2 px-2 text-xs font-medium">
									Recent Searches
								</div>
								{recentSearches.map((recentQuery, index) => (
									<div
										key={index}
										onClick={() => handleRecentSearchSelect(recentQuery)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleRecentSearchSelect(recentQuery);
											}
										}}
										className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-sm p-2"
									>
										<Clock className="text-muted-foreground h-4 w-4" />
										<span className="text-sm">{recentQuery}</span>
									</div>
								))}
								<Button
									variant="ghost"
									size="sm"
									onClick={clearRecentSearches}
									className="text-muted-foreground mt-2 w-full justify-start"
								>
									<X className="mr-2 h-4 w-4" />
									Clear recent searches
								</Button>
							</div>
						)}
						{loading && (
							<div className="flex items-center justify-center p-4">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								<span className="text-muted-foreground text-sm">
									Searching...
								</span>
							</div>
						)}
						{!loading && query.length >= 2 && suggestions.length > 0 && (
							<div className="p-2">
								<div className="text-muted-foreground mb-2 px-2 text-xs font-medium">
									Suggestions
								</div>
								{suggestions.map((suggestion, index) => (
									<div
										key={index}
										onClick={() => handleSuggestionSelect(suggestion)}
										onKeyDown={(e) =>
											e.key === "Enter" && handleSuggestionSelect(suggestion)
										}
										className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-sm p-2"
									>
										<TrendingUp className="text-muted-foreground h-4 w-4" />
										<span className="text-sm">{suggestion}</span>
									</div>
								))}
							</div>
						)}

						{!loading && (
							<>
								{query.length > 0 && results.length > 0 && (
									<div className="p-2">
										<p className="text-muted-foreground mb-2 px-2 text-xs font-inter ">
											People
										</p>
										{results.map((user) => {
											const userImage =
												user.profileImage?.url ??
												`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`;
											return (
												<div
													key={user.discordId}
													onClick={() => handleResultSelect(user)}
													onKeyDown={(e) =>
														e.key === "Enter" && handleResultSelect(user)
													}
													className="hover:bg-muted/50 flex cursor-pointer items-center gap-x-4  p-2 bg-primary borderx rounded-xl"
												>
													<div className="bg-primary/10 flex size-12 overflow-hidden rounded-full items-center justify-center shrink-0 ml-2">
														<ImageWithFallback
															src={userImage}
															width={48}
															height={48}
															alt={user.discordDisplayName}
															className="object-cover size-12 rounded-full"
															containerClassName="size-full"
														/>
													</div>
													<div className="w-full">
														<div className="flex items-center  font-inter">
															<span className="truncate text-[15px] font-medium">
																{user.displayName}
															</span>
														</div>
														<div className=" truncate text-sm text-accent-text">
															@{user.username}
														</div>
													</div>
												</div>
											);
										})}
									</div>
								)}
								{results.length > 10 && (
									<div className="border-t p-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												router.push(`/search?q=${encodeURIComponent(query)}`);
												setOpen(false);
											}}
											className="w-full justify-start"
										>
											<Search className="mr-2 h-4 w-4" />
											See all results for "{query}"
										</Button>
									</div>
								)}
							</>
						)}

						{!loading &&
							query.length >= 2 &&
							results.length === 0 &&
							suggestions.length === 0 && (
								<div className="p-4 text-center">
									<Search className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
									<p className="text-muted-foreground text-sm">
										No results found for "
										<span className="text-off-white">{query}</span>"
									</p>
									<p className="text-muted-foreground mt-1 text-xs">
										Try different keywords or check spelling
									</p>
								</div>
							)}
					</div>
				)}
			</div>

			{/* Mobile: Full-screen search overlay */}
			{open && (
				<div
					ref={mobileOverlayRef}
					className="md:hidden fixed inset-0 z-[9999] bg-background"
				>
					<div className="flex flex-col h-full">
						{/* Search bar */}
						<div className="p-4 border-b border-border">
							<div className="relative flex items-center gap-2">
								<Input
									placeholder={placeholder}
									value={query}
									autoFocus
									onChange={(e) => handleInputChange(e.target.value)}
									className="flex-1 border border-border px-4 py-3 h-12 rounded-lg text-sm focus-visible:ring-1"
								/>
								<Button
									onClick={() => {
										setOpen(false);
										setQuery("");
									}}
									variant="ghost"
									className="text-muted-foreground"
								>
									<Icon.close className="h-5 w-5" />
								</Button>
							</div>
						</div>

						{/* Results */}
						<div className="flex-1 overflow-y-auto">
							<div className="p-4">
								{showPlaceholder && !query && (
									<div className="flex items-center justify-center h-full text-muted-foreground">
										Search results appears here
									</div>
								)}

								{recentSearches.length > 0 && !query && (
									<div className="mb-4">
										<div className="text-muted-foreground mb-2 text-xs font-medium">
											Recent Searches
										</div>
										{recentSearches.map((recentQuery, index) => (
											<div
												key={index}
												onClick={() => handleRecentSearchSelect(recentQuery)}
												className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-sm p-2"
											>
												<Clock className="text-muted-foreground h-4 w-4" />
												<span className="text-sm">{recentQuery}</span>
											</div>
										))}
										<Button
											variant="ghost"
											size="sm"
											onClick={clearRecentSearches}
											className="text-muted-foreground mt-2 w-full justify-start"
										>
											<X className="mr-2 h-4 w-4" />
											Clear recent searches
										</Button>
									</div>
								)}

								{loading && (
									<div className="flex items-center justify-center p-4">
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										<span className="text-muted-foreground text-sm">
											Searching...
										</span>
									</div>
								)}

								{!loading && query.length >= 2 && suggestions.length > 0 && (
									<div className="mb-4">
										<div className="text-muted-foreground mb-2 text-xs font-medium">
											Suggestions
										</div>
										{suggestions.map((suggestion, index) => (
											<div
												key={index}
												onClick={() => handleSuggestionSelect(suggestion)}
												className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-sm p-2"
											>
												<TrendingUp className="text-muted-foreground h-4 w-4" />
												<span className="text-sm">{suggestion}</span>
											</div>
										))}
									</div>
								)}

								{!loading && query.length > 0 && results.length > 0 && (
									<div>
										<p className="text-muted-foreground mb-2 text-xs font-medium">
											People
										</p>
										{results.map((user) => {
											const userImage =
												user.profileImage?.url ??
												`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`;
											return (
												<div
													key={user.discordId}
													onClick={() => handleResultSelect(user)}
													className="hover:bg-muted/50 flex cursor-pointer items-center gap-x-4 p-3 rounded-lg mb-2"
												>
													<div className="flex size-12 overflow-hidden rounded-full items-center justify-center shrink-0">
														<ImageWithFallback
															src={userImage}
															width={48}
															height={48}
															alt={user.discordDisplayName}
															className="object-cover size-12 rounded-full"
															containerClassName="size-full"
														/>
													</div>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-[15px] truncate">
															{user.displayName}
														</div>
														<div className="truncate text-sm text-muted-foreground">
															@{user.username}
														</div>
													</div>
												</div>
											);
										})}
									</div>
								)}

								{results.length > 10 && (
									<div className="border-t pt-4 mt-4">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												router.push(`/search?q=${encodeURIComponent(query)}`);
												setOpen(false);
											}}
											className="w-full justify-start"
										>
											<Search className="mr-2 h-4 w-4" />
											See all results for "{query}"
										</Button>
									</div>
								)}

								{!loading &&
									query.length >= 2 &&
									results.length === 0 &&
									suggestions.length === 0 && (
										<div className="p-4 text-center">
											<Search className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
											<p className="text-muted-foreground text-sm">
												No results found for "
												<span className="text-foreground">{query}</span>"
											</p>
											<p className="text-muted-foreground mt-1 text-xs">
												Try different keywords or check spelling
											</p>
										</div>
									)}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
