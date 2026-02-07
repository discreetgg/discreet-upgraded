import Link from "next/link";
import { Button } from "./ui/button";

interface Props {
	title?: string;
	description?: string;
	actionText?: string;
	url?: string;
	setShowBanner: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GetFullExperienceCard = ({
	title,
	description,
	actionText,
	url,
	setShowBanner,
}: Props) => {
	return (
		<div className="bg-[#1E1E21] rounded-[16px] px-[18px] py-[23px] space-y-6 w-full">
			<div className="space-y-4">
				<h3 className="text-white text-xl font-semibold">{title}</h3>
				<p className="text-[#8A8C95] text-[15px]">{description}</p>
			</div>
			<div className="flex items-center gap-x-2">
				<Link
					href={url ?? "/auth"}
					className="rounded flex items-center w-max gap-2.5 border hover:bg-transparent active:bg-transparent h-auto px-10 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8]"
				>
					{actionText}
				</Link>
				{url === "/auth" ? (
					<Link
						href={url}
						className="rounded flex items-center w-max gap-2.5 border hover:bg-neutral-100 active:bg-transparent h-auto px-10 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-off-white shadow-[2px_2px_0_0_#FF007F] text-primary"
					>
						Login
					</Link>
				) : (
					<Button
						onClick={() => {
							setShowBanner(false);
							localStorage.setItem("showBanner", "false");
						}}
						variant="outline"
						className="text-accent-color bg-transparent border-none"
					>
						Not interested
					</Button>
				)}
			</div>
		</div>
	);
};
