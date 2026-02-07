import Image from "next/image";
import { Icon } from "../ui/icons";

interface Props {
	displayName: string;
	age: string;
	cost: string;
	time: string;
	src: string;
}

export default function CamCard({ displayName, age, cost, time, src }: Props) {
	return (
		<div className="w-full max-w-[300px] h-[225px] rounded-xl border border-accent-color p-2 relative overflow-hidden flex items-end group ">
			<div className="absolute inset-0 bg-gradient-to-t from-black/60  via-transparent via-20% to-transparent z-[9]" />
			<Image
				src={src}
				alt="cam"
				width={300}
				height={225}
				className="w-full h-full object-cover absolute inset-0 group-hover:scale-110 transition-all group-hover:duration-200 duration-500 ease-in-out"
			/>
			<div className="flex w-full items-center justify-between relative z-10">
				<div className="flex items-center gap-x-1">
					<p className="font-inter text-sm font-medium">{displayName}</p>
					<p className="flex items-center gap-x-1 text-sm">
						23 <span className="size-2.5 block bg-green-600 rounded-full" />{" "}
					</p>
				</div>

				<div className="flex items-center font-inter text-xs gap-x-1 rounded-2xl bg-black/70 p-1">
					<Icon.videoCall className="size-3.5 text-accent-color" />
					<span className="text-accent-color font-medium">$23</span>
					<span>/ 1min</span>
				</div>
			</div>
		</div>
	);
}
