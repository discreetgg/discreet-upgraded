"use client";

import type { UserType } from "@/types/global";
import ViewImageModal from "./miscellaneous/view-image-modal";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Icon } from "./ui/icons";
interface Props {
	user: UserType;
}
export const PublicProfileBannerImage = ({ user }: Props) => {
	return (
		<Avatar className="rounded-none md:rounded-t-[10px]  bg-[#1E1E21] overflow-hidden aspect-3/1 size-full max-h-[100px] md:max-h-[205px] p-0 flex items-center justify-center relative  group">
			{user?.profileBanner?.url ? (
				<ViewImageModal
					isBanner
					image={user?.profileBanner?.url}
					imageClassName="object-contaixn  md:object-cover size-full"
				/>
			) : (
				<AvatarFallback className="!rounded-none bg-[#1E1E21]">
					<Icon.selectPicture className="opacity-0" />
				</AvatarFallback>
			)}
		</Avatar>
	);
};
