"use client";

import { useRouter } from "@bprogress/next/app";
import { Button } from "./ui/button";

export const FeedPostNotFound = () => {
	const router = useRouter();
	return (
		<div className="flex flex-col items-center justify-center min-h-screen space-y-6">
			<div className="text-center space-y-4">
				<h1 className="text-2xl font-bold text-[#F8F8F8]">Post Not Found</h1>
				<p className="text-[#8A8C95]">
					The post you are looking for does not exist.
				</p>
			</div>
			<Button
				onClick={() => router.push("/")}
				className="bg-[#FF007F] text-white hover:bg-[#FF007F]/80"
			>
				Return Home
			</Button>
		</div>
	);
};
