"use client";

import { Search, User, Loader2, X, TrendingUp, Clock } from "lucide-react";

import { useState, useEffect, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { UserType } from "@/types/global";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Image from "next/image";
import { useRouter } from "@bprogress/next/app";
import useWindowWidth from "@/hooks/use-window-width";

interface GlobalSearchProps {
	placeholder?: string;
	className?: string;
	onResultSelect?: (result: UserType) => void;
}

export function BackUpGlobalSearch({
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

	const winWidth = useWindowWidth();

	const router = useRouter();
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
		setQuery(value);

		// Clear previous timeout
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// Set new timeout
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

	// Get result icon
	const getResultIcon = (result: UserType) => {
		if (!result) return <User className="h-4 w-4" />;
		return <User className="h-4 w-4" />;
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="ghost"
					aria-expanded={open}
					className="p-2.5 text-left px-3 bg-transparent rounded-full"
				>
					<span className="hidden sm:block">Search</span>
					<Search className="size-5" />
				</Button>
			</PopoverTrigger>

			<PopoverContent
				className="w-[300px] md:w-[600px] p-0 bg-primary z-[999]"
				align={winWidth < 768 ? "start" : "center"}
			>
				<div className="border-b">
					<Input
						placeholder={placeholder}
						value={query}
						onChange={(e) => handleInputChange(e.target.value)}
						className="border-0 p-0 h-12 pl-2 text-sm focus-visible:ring-1 shadow-xl"
					/>

					<div className="max-h-96 overflow-y-auto">
						{loading && (
							<div className="flex items-center justify-center p-4">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								<span className="text-muted-foreground text-sm">
									Searching...
								</span>
							</div>
						)}

						{!loading && query.length === 0 && recentSearches.length > 0 && (
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
										<div className="text-muted-foreground mb-2 px-2 text-xs font-medium">
											User{results.length > 1 && "s"}
										</div>
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
													className="hover:bg-muted/50 flex cursor-pointer items-center space-x-3 rounded-sm p-2"
												>
													<div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
														<Avatar
															color="#1E1E21"
															className={cn(
																"size-[48px] relative group",
																className
															)}
														>
															<AvatarImage src={userImage} />
															<AvatarFallback>
																<Image
																	src="/user.svg"
																	height={48}
																	width={48}
																	className="rounded-full"
																	alt=""
																/>
															</AvatarFallback>
														</Avatar>
													</div>
													<div className="min-w-0 flex-1">
														<div className="flex items-center gap-2">
															<span className="truncate text-sm font-medium">
																{user.displayName}
															</span>
															{user.isAgeVerified && (
																<Badge variant="outline" className="text-xs">
																	Verified
																</Badge>
															)}
														</div>
														<div className="text-muted-foreground truncate text-xs">
															@{user.username}
														</div>
													</div>
													{getResultIcon(user)}
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
										No results found for "{query}"
									</p>
									<p className="text-muted-foreground mt-1 text-xs">
										Try different keywords or check spelling
									</p>
								</div>
							)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
