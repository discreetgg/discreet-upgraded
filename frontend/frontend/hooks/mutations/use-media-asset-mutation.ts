import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createMediaAssetService } from "@/lib/services";
import { toastPresets } from "@/lib/toast-presets";

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
			toast.success("Bundle sent successfully.", {
				...toastPresets.success,
			});

			// Invalidate relevant queries if needed
			queryClient.invalidateQueries({
				queryKey: ["chat", "conversations"],
			});
		},

		onError: (error: any) => {
			if (error?.status === 401) {
				toast.error("Please sign in to send bundles.", {
					...toastPresets.error,
				});
			} else if (error?.status === 400) {
				toast.error(
					error.message || "We couldn't send the bundle. Check your details and try again.",
					{
						...toastPresets.error,
					}
				);
			} else if (error?.status === 404) {
				toast.error("Recipient not found.", {
					...toastPresets.error,
				});
			} else {
				toast.error(
					error?.message || "Bundle couldn't be sent right now. Please try again.",
					{
						...toastPresets.error,
					}
				);
			}
		},
	});
};
