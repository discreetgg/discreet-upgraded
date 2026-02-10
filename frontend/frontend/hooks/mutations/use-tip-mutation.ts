import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tipService } from "@/lib/services";
import type { TipPayload } from "@/types/global";
import { toastPresets } from "@/lib/toast-presets";

export const useTipMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: TipPayload) => {
			return await tipService(payload);
		},

		onSuccess: (data, variables) => {
			toast.success(`Tip of $${variables.amount} sent successfully!`, {
				...toastPresets.success,
			});
			
			queryClient.invalidateQueries({
				queryKey: ["wallet", variables.tipperId],
			});
			
			queryClient.invalidateQueries({
				queryKey: ["wallet", variables.receiverId],
			});
		},

		onError: (error: any) => {
			if (error?.status === 401) {
				toast.error("You must be logged in to send tips.", {
					...toastPresets.error,
				});
			} else if (error?.status === 400) {
				toast.error(error.message || "Invalid tip amount or insufficient funds.", {
					...toastPresets.error,
				});
			} else if (error?.status === 404) {
				toast.error("User not found.", {
					...toastPresets.error,
				});
			} else {
				toast.error(error?.message || "Failed to send tip. Please try again.", {
					...toastPresets.error,
				});
			}
		},
	});
};
