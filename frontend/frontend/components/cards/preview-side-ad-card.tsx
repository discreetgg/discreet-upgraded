import Image from "next/image";
import { Button } from "../ui/button";

interface ProfileSideAdCardProps {
	title: string;
	description: string;
	priceToView: number;
	tag: string;
	image: string;
	isPlaceholder?: boolean;
	itemsCount: number;
}

export default function PreviewSideAdCard({
	description,
	image,
	priceToView,
	title,

	isPlaceholder = false,
	itemsCount,
}: ProfileSideAdCardProps) {
	return (
		<div className="flex w-full   h-[166px] border border-accent-gray/30 rounded-xl pl-2 py-2 border-r-4 border-b-4 hover:border-b-[6px] hover:border-r-[6px] transition-all duration-150 justify-between overflow-hidden gap-x-4  bg-main-bg">
			<div className="flex flex-col gap-y-2 h-full justify-between min-w-[120px] xl:min-w-[150px]">
				<div className="flex flex-col gap-y-2">
					<p className="text-sm  font-inter">
						{title.length > 0 ? title : "[Title preview]"}
					</p>
					<p className="text-xs text-accent-text/80 line-clamp-2">
						{description.length > 0 ? description : "[Description review]"}
					</p>
				</div>
				<div className="flex flex-col gap-y-3">
					<div className="flex items-center gap-x-1">
						<p className="text-xs  text-yellow-400 font-inter">
							{" "}
							${priceToView}
						</p>
						<span className="bg-accent-gray w-px h-2" />
						<span className="text-[10px] text-accent-text">
							{itemsCount} Item{itemsCount > 1 && "s"}
						</span>
					</div>

					<Button
						className="px-4 w-fit text-[10px]  py-1 rounded-2xl border-none bg-white text-black"
						size={"ghost"}
					>
						Buy
					</Button>
				</div>
			</div>
			<div className="xl:w-[124px] w-[100px] min-[1440px]:w-[150px] h-full flex-shrink-0 grid place-items-center  overflow-hidden bg-accent-gray/10 scale-y-[1.1] relative">
				{isPlaceholder && (
					<div className="w-full absolute z-20 text-accent-gray font-medium text-center uppercase">
						<p>cover Image</p>
					</div>
				)}
				<Image
					src={image}
					alt={title}
					width={300}
					height={300}
					className="object-cover size-full object-center  "
				/>
			</div>
		</div>
	);
}
