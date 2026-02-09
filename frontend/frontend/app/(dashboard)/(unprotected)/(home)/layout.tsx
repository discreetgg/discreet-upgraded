"use client";

import { GetFullExperienceCard } from "@/components/get-full-experience-card";
import { HomePostsNavHeader } from "@/components/home-posts-nav-header";
import { HomePostsNavHeaderLoader } from "@/components/home-posts-nav-header-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context-provider";
import { useGlobal } from "@/context/global-context-provider";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import dynamic from "next/dynamic";

// Lazy load heavy components to improve initial page load
const TopCreators = dynamic(
	() =>
		import("@/components/top-creators").then((mod) => ({
			default: mod.TopCreators,
		})),
	{
		ssr: true,
		loading: () => (
			<div className="h-[400px] animate-pulse bg-muted rounded-lg" />
		),
	}
);

const Layout = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated, loading } = useAuth();
	const pathname = usePathname();
	const isSellersPage = pathname === "/sellers";

	const { user } = useGlobal();
	const [showBanner, setShowBanner] = useState(false);
	const [isDesktopViewport, setIsDesktopViewport] = useState(false);
	const showLoginCard = !loading && !isAuthenticated;
	const showBecomeSellerCard =
		!loading && showBanner && isAuthenticated && user?.role === "buyer";
	const showTopCreators = !isSellersPage;
	const showRightRailLoading = loading && !isSellersPage;
	const hasRightRailContent =
		showRightRailLoading || showLoginCard || showBecomeSellerCard || showTopCreators;
	const shouldRenderRightRail = hasRightRailContent && isDesktopViewport;

	useEffect(() => {
		const updateViewport = () => {
			setIsDesktopViewport(window.innerWidth >= 1024);
		};

		updateViewport();
		window.addEventListener("resize", updateViewport);

		return () => {
			window.removeEventListener("resize", updateViewport);
		};
	}, []);

	useLayoutEffect(() => {
		const savedBanner = localStorage.getItem("showBanner");
		if (!savedBanner) {
			setShowBanner(true);
		}
	}, []);

	return (
		<main className="px-2 ">
			<Suspense fallback={<HomePostsNavHeaderLoader />}>
				<HomePostsNavHeader />
			</Suspense>
			<div className="flex gap-6 relative">
				{/* {isAuthenticated && user?.role === "seller" && (
					<section
						className={cn(
							"w-full max-w-[377px] py-[105px] sticky h-max top-7 space-y-6 transition-[width] duration-300 ease-linear overflow-hidden"
						)}
					>
						<WelcomeSteps />
						<WaysToMakeMoney />
					</section>
				)} */}
				<div
					className={cn(
						"w-full space-y-6",
						shouldRenderRightRail ? "max-w-[560px] xl:max-w-full" : "max-w-full"
					)}
				>
					{children}
				</div>
				{shouldRenderRightRail && (
					<section
						className="w-full max-w-[376px] xl:shrink-0 space-y-6 sticky top-7 h-max transition-[width] duration-300 ease-linear overflow-hidden"
					>
					{/* <Link
						href={""}
						className="rounded hidden items-center w-max gap-2.5 border hover:bg-neutral-100 active:bg-transparent h-auto px-10 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-off-white shadow-[2px_2px_0_0_#FF007F] text-primary"
					>
						Sign in as Guest
					</Link> */}

					{showLoginCard && (
						<GetFullExperienceCard
							title="Want the full experience?"
							description="Log in to unlock all features save content, follow creators, and view your activity."
							actionText="Get started"
							url="/auth"
							setShowBanner={setShowBanner}
						/>
					)}
					{showBecomeSellerCard && (
						<GetFullExperienceCard
							title="Want to make more money?"
							description="Become a seller, share your content, and start earning from your audience."
							actionText="Become a Seller"
							url="/verify-age"
							setShowBanner={setShowBanner}
						/>
					)}
					{showRightRailLoading ? (
						<>
							<Skeleton className="h-[72px] w-full rounded-lg" />
							<Skeleton className="h-[400px] w-full rounded-lg" />
						</>
					) : (
						showTopCreators && <TopCreators />
					)}
					{/* {isAuthenticated && inDevEnvironment && <PartnerDiscordServers />} */}
					{/* <div className="flex items-center gap-x-4 text-[#737682] text-[15px] justify-center">
            <Link href="/privacy-policy">
              <span className="hover:text-white transition-all duration-300">
                Policy
              </span>
            </Link>
            <span aria-hidden="true" className="h-4 w-0.5 bg-[#737682]/80" />
            <Link href="/terms-of-service">
              <span className="hover:text-white transition-all duration-300">
                Terms of Service
              </span>
            </Link>
            <span aria-hidden="true" className="h-4 w-0.5 bg-[#737682]/80" />
            <Link href="/contact-us">
              <span className="hover:text-white transition-all duration-300">
                Contact Us
              </span>
            </Link>
          </div> */}
					</section>
				)}
			</div>
		</main>
	);
};

export default Layout;
