import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createMediaAssetService } from "@/lib/services";

export interface MediaMetaItem {
	type: "image" | "video";
	caption?: string;
}

export interface CreateMediaAssetPayload {
	sender: string;
	receiver: string;
	title: string;
	description: string;
	priceToView: number;
	discount?: number;
	mediaMeta: MediaMetaItem[];
	files?: File[];
}

export const useMediaAssetMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: CreateMediaAssetPayload) => {
			const formData = new FormData();

			// Add basic form fields
			formData.append("sender", payload.sender);
			formData.append("reciever", payload.receiver); // Note: API uses "reciever" (typo)
			formData.append("title", payload.title);
			formData.append("description", payload.description);
			formData.append("priceToView", payload.priceToView.toString());

			if (payload.discount !== undefined) {
				formData.append("discount", payload.discount.toString());
			}

			// Add files if provided
			if (payload.files) {
				for (const file of payload.files) {
					formData.append("files", file);
				}
			}

			// Add mediaMeta as a JSON stringified array
			// Ensure it's always a valid array
			const mediaMetaArray = Array.isArray(payload.mediaMeta) 
				? payload.mediaMeta.filter((meta) => meta && typeof meta === 'object' && meta.type)
				: [];
			
			// Send as a single JSON string - backend should parse this
			formData.append("mediaMeta", JSON.stringify(mediaMetaArray));

			return await createMediaAssetService({ formData });
		},

		onSuccess: (data, variables) => {
			toast.success("Media asset created successfully!");

			// Invalidate relevant queries if needed
			queryClient.invalidateQueries({
				queryKey: ["chat", "conversations"],
			});
		},

		onError: (error: any) => {
			if (error?.status === 401) {
				toast.error("You must be logged in to create media assets.");
			} else if (error?.status === 400) {
				toast.error(
					error.message || "Invalid data. Please check your input."
				);
			} else if (error?.status === 404) {
				toast.error("User not found.");
			} else {
				toast.error(
					error?.message || "Failed to create media asset. Please try again."
				);
			}
		},
	});
};

