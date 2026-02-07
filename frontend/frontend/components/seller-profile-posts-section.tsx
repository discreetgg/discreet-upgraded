import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfilePostsMediaContent } from "./profile-posts-media-content";
import { ProfilePostsPostContent } from "./profile-posts-post-content";
import type { PostType, UserType } from "@/types/global";
import { InfiniteData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCreatorPost } from "@/actions/creator-post";
import { useCreatorMedia } from "@/hooks/queries/use-creator-media";

interface Props {
	user: UserType;
}

export const SellerProfilePostsSection = ({ user }: Props) => {
	const { totalPosts, hasData } = usePostCount(user.discordId);
	const { data, isPending } = useCreatorMedia(user.discordId);

	return (
		<Tabs defaultValue="posts" className="min-h-[45%] mt-10  relative">
			<div className="border-b border-b-[#1E1E21] w-full justify-start rounded-none sticky top-0 z-10 bg-main-bg/80 backdrop-blur-md">
				<TabsList className="bg-transparent h-auto gap-[30px] pb-0 ">
					<TabsTrigger
						value="posts"
						className="py-[14px] px-[17px] h-auto overflow-hidden bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-base font-medium max-w-[97px] border-none
		  after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-[60%] after:h-[3px] after:bg-[#FF007F] after:left-[20%] 
		  data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-0 after:translate-x-[150%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
					>
						{hasData ? `${totalPosts} Post` : "..."}
					</TabsTrigger>
					<TabsTrigger
						value="media"
						className="py-[14px] px-[17px] h-auto overflow-hidden bg-transparent data-[state=active]:!bg-transparent relative text-[#8A8C95] text-base font-medium max-w-[97px] border-none
		  after:content-[''] after:absolute after:bottom-0 after:rounded-t-[6px] after:right-1 after:w-[60%] after:h-[3px] after:bg-[#FF007F] after:left-[20%] 
		  data-[state=active]:after:transition-transform ease-out data-[state=active]:after:duration-300 data-[state=active]:after:translate-x-0 after:-translate-x-[150%] data-[state=active]:text-[#D4D4D8] data-[state=active]:border-0"
					>
						{isPending ? "..." : `${data?.length} Media`}
					</TabsTrigger>
				</TabsList>
			</div>
			<TabsContent value="posts" className="h-full  flex pt-4 justify-center">
				<ProfilePostsPostContent discordId={user.discordId} />
			</TabsContent>
			<TabsContent value="media" className="h-full flex  justify-center">
				<ProfilePostsMediaContent media={data} />
			</TabsContent>
		</Tabs>
	);
};

function usePostCount(discordId: string) {
	const queryClient = useQueryClient();

	const getPostCount = (): number => {
		const cachedData = queryClient.getQueryData<InfiniteData<PostType[]>>([
			"creatorPosts",
			discordId,
		]);

		return (
			cachedData?.pages?.reduce((total, page) => {
				return total + (page?.length || 0);
			}, 0) || 0
		);
	};

	const { data: infiniteData } = useQuery({
		queryKey: ["creatorPosts", discordId],
		enabled: false,
		queryFn: () => getCreatorPost({ discordId }),
		staleTime: Number.POSITIVE_INFINITY,
	});

	return {
		totalPosts: getPostCount(),
		hasData: !!infiniteData,
	};
}
