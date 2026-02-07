"use client";

import { PROFILE_CAMS } from "@/constants/mock-data";
import { useState } from "react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CamCard from "../cards/cam-card";
import { ProfilePostsContainer } from "../profile-posts-container";

const MEDIA_TABS = ["feed", "cams"];

export const LikedProfileContent = () => {
	const [currTab, setCurrTab] = useState("feed");

	return (
		<div className="flex flex-col w-full gap-y-5">
			<Tabs defaultValue="feed" value={currTab} onValueChange={setCurrTab}>
				<TabsList className="flex items-center gap-x-4 bg-transparent">
					{MEDIA_TABS.map((tab) => (
						<TabsTrigger key={tab} value={tab} asChild>
							<Button
								key={tab}
								data-state={currTab === tab ? "active" : "inactive"}
								className="px-4 w-fit text-sm text-accent-text capitalize  py-1 rounded-2xl dark:data-[state=active]:border-none border border-gray-bg font-inter font-normal  data-[state=active]:text-off-white"
								variant={"ghost"}
								size={"ghost"}
							>
								{tab}
								{tab === "cams" && (
									<span
										data-cam={currTab === "cams"}
										className="bg-accent-color size-2 -ml-0.5 data-[cam=true]:animate-pulse rounded-full"
									/>
								)}
							</Button>
						</TabsTrigger>
					))}
				</TabsList>
				<TabsContent value="feed">
					<ProfilePostsContainer />
				</TabsContent>
				<TabsContent value="cams">
					<div className="grid md:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] w-full gap-2">
						{PROFILE_CAMS.map((cam) => (
							<CamCard key={cam.id} {...cam} />
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};
