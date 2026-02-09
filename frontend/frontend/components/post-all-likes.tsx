"use client";

import { Icon } from "./ui/icons";

export const PostAllLikes = ({
	likeCount = 0,
	onClose,
}: {
	likeCount?: number;
	onClose: () => void;
}) => {
	return (
		<div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
			<button
				type="button"
				className="absolute inset-0 bg-black/60"
				onClick={onClose}
				aria-label="Close likes dialog"
			/>

			<div
				role="dialog"
				aria-modal="true"
				aria-label="Post likes"
				className="relative z-10 w-full max-w-sm rounded-xl border border-[#1E1E21] bg-[#111316] p-4 shadow-[4px_4px_0_0_#1E1E21]"
			>
				<div className="mb-3 flex items-center justify-between">
					<h3 className="text-base font-medium text-[#F8F8F8]">Likes</h3>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1 text-[#8A8C95] hover:bg-[#1A1C1F] hover:text-[#F8F8F8]"
						aria-label="Close likes"
					>
						<Icon.close className="size-4" />
					</button>
				</div>
				<p className="text-sm text-[#8A8C95]">
					{likeCount > 0
						? `${likeCount} like${likeCount === 1 ? "" : "s"}`
						: "No likes yet."}
				</p>
			</div>
		</div>
	);
};
