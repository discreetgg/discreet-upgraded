"use client";

import { GetFullExperienceCard } from "@/components/get-full-experience-card";
import { HomePostsNavHeaderLoader } from "@/components/home-posts-nav-header-loader";
import { NotificationNav } from "@/components/notification-nav";
import { useAuth } from "@/context/auth-context-provider";
import { useGlobal } from "@/context/global-context-provider";
import { cn, inDevEnvironment } from "@/lib/utils";
import Link from "next/link";
import { Suspense, useLayoutEffect, useState } from "react";
import dynamic from "next/dynamic";

// Lazy load heavy components to improve initial page load
const TopCreators = dynamic(() => import('@/components/top-creators').then(mod => ({ default: mod.TopCreators })), {
  ssr: true,
  loading: () => <div className="h-[400px] animate-pulse bg-muted rounded-lg" />,
});

const Layout = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated } = useAuth();
	const { user } = useGlobal();
	const [showBanner, setShowBanner] = useState(false);

	useLayoutEffect(() => {
		const savedBanner = localStorage.getItem("showBanner");
		if (!savedBanner) {
			setShowBanner(true);
		}
	}, []);

	return (
		<main className="">
			<Suspense fallback={<HomePostsNavHeaderLoader />}>
			<NotificationNav />
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
				<div className="max-w-[560px] w-full space-y-6 bg-[#111316] ">{children}</div>
				<section
					className={cn(
						"w-full hidden lg:block max-w-[376px] space-y-6 sticky top-7 h-max transition-[width] duration-300 ease-linear overflow-hidden",
						isAuthenticated && user?.role === "seller" ? "w-0x" : "w-full"
					)}
				>
					{/* <Link
						href={""}
						className="rounded hidden items-center w-max gap-2.5 border hover:bg-neutral-100 active:bg-transparent h-auto px-10 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-off-white shadow-[2px_2px_0_0_#FF007F] text-primary"
					>
						Sign in as Guest
					</Link> */}

					{!isAuthenticated && (
						<GetFullExperienceCard
							title="Want the full experience?"
							description="Log in to unlock all features save content, follow creators, and view your activity."
							actionText="Get started"
							url="/auth"
							setShowBanner={setShowBanner}
						/>
					)}
					{showBanner && (
						<>
							{(isAuthenticated && user?.role === "buyer") ||
								(inDevEnvironment && (
									<GetFullExperienceCard
										title="Want to make more money?"
										description="Become a seller, share your content, and start earning from your audience."
										actionText="Become a Seller"
										url="/verify-age"
										setShowBanner={setShowBanner}
									/>
								))}
						</>
					)}
					<TopCreators />
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
			</div>
		</main>
	);
};

export default Layout;
