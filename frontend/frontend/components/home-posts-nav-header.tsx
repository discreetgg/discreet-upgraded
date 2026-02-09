"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/auth-context-provider";
import { useGlobal } from "@/context/global-context-provider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Switch } from "./ui/switch";
import { GlobalSearch } from "./search/global-search";
import Image from "next/image";

export const HomePostsNavHeader = () => {
	const { isAuthenticated } = useAuth();
	const { showExplicitContent, setShowExplicitContent } = useGlobal();

	const router = useRouter();
	const pathname = usePathname();

	return (
		<header className="flex md:flex-row flex-col shrink-0 transition-[width,height] z-50 gap-6 ease-linear sticky top-0 md:py-5 py-2  bg-background mt-2 lg:mt-2">
			<div className="md:hidden flex items-center justify-between w-full">
				<button
					onClick={() => router.push("/")}
					type="button"
					className="flex gap-[6px] items-center justify-start data-[home=false]:cursor-pointer"
				>
					<Image src="/logo.png" height={41} width={41} alt="logo" />
					<p className="truncate font-medium text-[15px]">DISCREET</p>
				</button>
				<GlobalSearch />
			</div>
			<div className="flex max-w-[560px] xl:max-w-full w-full items-center gap-4">
				<div className="flex items-center gap-[6px] md:justify-start justify-between w-full">
					<Link
						href="/"
						className={cn(
							"rounded-[54px] border hover:bg-transparent active:bg-transparent text-[#F8F8F8] h-auto px-4 py-2.5 text-[15px] font-medium whitespace-nowrap md:w-max w-full flex items-center justify-center",
							pathname === "/" ? "bg-[#2E2E32]" : "border-[#1E2227]",
							"hover:-translate-y-1 transition-transform duration-150 ease-out"
						)}
					>
						Feed
					</Link>
					<Link
						href="/sellers"
						className={cn(
							"rounded-[54px] border hover:bg-transparent active:bg-transparent text-[#F8F8F8] h-auto px-4 py-2.5 text-[15px] font-medium whitespace-nowrap md:w-max w-full flex items-center justify-center",
							pathname === "/sellers" ? "bg-[#2E2E32]" : "border-[#1E2227]",
							"hover:-translate-y-1 transition-transform duration-150 ease-out"
						)}
					>
						Sellers
					</Link>
					<Link
						href="/cams"
						className={cn(
							"rounded-[54px] relative border hover:bg-transparent active:bg-transparent text-[#F8F8F8] h-auto px-4 py-2.5 text-[15px] font-medium whitespace-nowrap md:w-max w-full flex items-center justify-center",
							pathname === "/cams" ? "bg-[#2E2E32]" : "border-[#1E2227]",
							"hover:-translate-y-1 transition-transform duration-150 ease-out"
						)}
					>
						<span className="flex items-center gap-1">
							Cams
							<div className="size-[8px] rounded-full bg-[#FE4346]" />
						</span>
					</Link>
					<Link
						href="/servers"
						className={cn(
							"rounded-[54px] border hover:bg-transparent active:bg-transparent text-[#F8F8F8] h-auto px-4 py-2.5 text-[15px] font-medium whitespace-nowrap md:w-max w-full md:block flex items-center justify-center",
							pathname === "/servers" ? "bg-[#2E2E32]" : "border-[#1E2227]",
							"hover:-translate-y-1 transition-transform duration-150 ease-out"
						)}
					>
						Servers
					</Link>
				</div>
				{/* <form
					onSubmit={(e) => {
						e.preventDefault();
						const search = buildSearchUrl(searchValue);
						router.replace(search);
						}}
						className="relative w-full"
				>
				<Icon.search className="absolute -translate-y-1/2 top-1/2 left-4" />
					<Input
					placeholder="Search"
						className="pl-10 py-2 h-auto text-sm w-full rounded-[54px]"
						value={searchValue}
						onChange={(e) => setSearchValue(e.target.value)}
						/>
						</form> */}
			</div>

			<GlobalSearch className="hidden md:block" />

			{/* {isAuthenticated ? (
        <GlobalSearch />
      ) : (
        <div className="flex items-center justify-center max-w-[200px] lg:max-w-[300px] lg:static w-full  gap-2 fixed top-2 right-2">
          <Tooltip>
            <TooltipTrigger className="flex items-center justify-between py-2 px-3 rounded-[8px] border border-[#FF0065] bg-[#0A0A0A] gap-2 w-full">
              <span className="text-sm text-[#8A8C95] ">
                Hide Explicit Content
              </span>
              <Switch
                checked={showExplicitContent}
                onCheckedChange={(checked) => {
                  setShowExplicitContent?.(checked);
                }}
              />
            </TooltipTrigger>
            <TooltipContent className="p-2.5 bg-[#0A0A0A] border border-[#FF0065] max-w-[256px]">
              <p className="text-xs text-[#F8F8F8] ">
                Turn this off to reveal content with strong language, nudity, or
                adult themes. Viewer discretion advised.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      )} */}
		</header>
	);
};

