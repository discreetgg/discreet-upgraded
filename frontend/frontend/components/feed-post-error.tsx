"use client";

import { useRouter } from "@bprogress/next/app";
import { Button } from "./ui/button";
import { Icon } from "./ui/icons";

export const FeedPostError = ({ error }: { error?: string }) => {
	const router = useRouter();
	return (
		<div className="flex flex-col items-center justify-center min-h-screen space-y-6">
			<div className="text-center space-y-4">
				<div className="w-24 h-24 mx-auto rounded-full bg-[#1E1E21] flex items-center justify-center">
					<Icon.close className="w-12 h-12 text-[#8A8C95]" />
				</div>

				<div className="space-y-2">
					<h1 className="text-2xl font-bold text-[#F8F8F8]">
						{error === "Post not found"
							? "Post Not Found"
							: "Something went wrong"}
					</h1>
					<p className="text-[#8A8C95] max-w-md">
						{error === "Post not found"
							? "The post you are looking for does not exist or may have been deleted."
							: "We encountered an error while loading the post. Please try again."}
					</p>
				</div>
			</div>

			<div className="flex gap-4">
				<Button
					onClick={() => router.back()}
					variant="outline"
					className="border-[#1E1E21] bg-[#0A0A0B] text-[#8A8C95] hover:text-[#F8F8F8] hover:bg-[#1E1E21]"
				>
					<Icon.arrrowLeft className="w-4 h-4 mr-2" />
					Go Back
				</Button>

				<Button
					onClick={() => router.push("/")}
					className="bg-[#FF007F] text-white hover:bg-[#FF007F]/80"
				>
					<Icon.home className="w-4 h-4 mr-2" />
					Home
				</Button>
			</div>
		</div>
	);
};
