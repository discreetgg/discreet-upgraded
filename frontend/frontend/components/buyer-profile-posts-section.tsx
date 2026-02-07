import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfilePostsMediaContent } from "./profile-posts-media-content";
import { LikedProfileContent } from "./public-profile/liked-profile-content";
import { ProfileSubscriptionsContent } from "./public-profile/profile-subscriptions-content";
import { UserType } from "@/types/global";
import { Icon } from "./ui/icons";

const LOCAL_TABS = [
	// {
	// 	value: "subscriptions",
	// 	label: "Subscriptions",
	// },
	{
		value: "liked",
		label: "Liked",
	},
	{
		value: "media",
		label: "Media",
	},
];

interface Props {
	currentUser: UserType;
	user: UserType;
}

export const BuyerProfilePostsSection = ({ currentUser, user }: Props) => {
	const isOwnProfile = currentUser?.discordId === user.discordId;

	return (
		<Tabs defaultValue="subscriptions" className="min-h-[45%] mt-10  relative">
			<div className="border-b border-b-[#1E1E21] w-full justify-start rounded-none sticky top-0 z-10 bg-main-bg/80 backdrop-blur-md">
				<TabsList
					defaultValue={isOwnProfile ? "liked" : "media"}
					className="bg-transparent h-auto gap-[30px] pb-0 "
				>
					{LOCAL_TABS.map((tab) => (
						<TabsTrigger
							value={tab.value}
							key={tab.value}
							disabled={!isOwnProfile && tab.value === "liked"}
							className="py-[14px] px-[17px] h-auto overflow-hidden bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-base font-medium  border-none
		  after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-[60%] after:h-[3px] after:bg-[#FF007F] after:left-[20%] 
		  data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-0 after:translate-x-[150%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
						>
							{tab.label}
							{!isOwnProfile && tab.value === "liked" && (
								<Icon.lock className="size-4 inline-block text-accent-text" />
							)}
						</TabsTrigger>
					))}
				</TabsList>
			</div>
			<TabsContent
				value="subscriptions"
				className="h-full  flex pt-4 justify-center items-center"
			>
				<ProfileSubscriptionsContent />
			</TabsContent>
			<TabsContent value="liked" className="h-full flex  justify-center">
				<LikedProfileContent />
			</TabsContent>
			<TabsContent value="media" className="h-full flex  justify-center">
				<ProfilePostsMediaContent media={[]} />
			</TabsContent>
		</Tabs>
	);
};
