import {
	SubscribeDialog,
	SubscribeDialogContent,
	SubscribeDialogDescription,
	SubscribeDialogFooter,
	SubscribeDialogHeader,
	SubscribeDialogTitle,
} from "@/components/ui/subscribe-dialog";
import { Dispatch, SetStateAction, useState } from "react";
import { AlertCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { formatBalance } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Button } from "../ui/button";

interface Props {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	userWalletBalance: number;
}

export default function DeleteAccountModal({
	isOpen,
	setIsOpen,
	userWalletBalance,
}: Props) {
	const [confirmations, setConfirmations] = useState({
		dataLoss: false,
		walletLoss: false,
		finalConfirm: false,
	});
	const [confirmText, setConfirmText] = useState("");

	// Delete account mutation
	const deleteAccountMutation = useMutation({
		mutationFn: async () => {
			const res = await api.delete("/user/me");
			return res.data;
		},
		onSuccess: (data) => {
			toast.success(
				data.message ||
					"Account scheduled for deletion. You can restore within 30 days.",
			);

			setTimeout(() => {
				window.location.href = "/";
			}, 2000);
		},
		onError: () => {
			toast.error(
				"Error deleting account. Please try again or contact support.",
			);
		},
	});

	// Reset confirmations when dialog closes
	const handleDialogClose = () => {
		setIsOpen(false);
		setConfirmations({
			dataLoss: false,
			walletLoss: false,
			finalConfirm: false,
		});
		setConfirmText("");
	};

	// Check if all confirmations are complete
	const allConfirmed =
		confirmations.dataLoss &&
		confirmations.walletLoss &&
		confirmations.finalConfirm &&
		confirmText.trim().toLowerCase() ===
			"DELETE MY ACCOUNT".trim().toLowerCase();

	// Handle actual account deletion
	const handleDelete = async () => {
		deleteAccountMutation.mutate();
	};

	return (
		<SubscribeDialog open={isOpen} onOpenChange={setIsOpen}>
			<SubscribeDialogContent className="bg-dark-charcoal md:px-8 px-2 sm:max-w-[542px] pb-4  md:rounded-3xl">
				<SubscribeDialogHeader>
					<SubscribeDialogTitle className="text-2xl text-red-500 flex items-center gap-2">
						<AlertCircle className="w-6 h-6" />
						Delete Account - Final Warning
					</SubscribeDialogTitle>
					<SubscribeDialogDescription className=" space-y-4 pt-4">
						<p className="text-base font-semibold">
							This action is PERMANENT and IRREVERSIBLE. Please read carefully:
						</p>

						<div className="space-y-4 bg-secondary p-4 rounded-lg">
							<label className="flex items-start gap-3 cursor-pointer group">
								<input
									type="checkbox"
									checked={confirmations.dataLoss}
									onChange={(e) =>
										setConfirmations((prev) => ({
											...prev,
											dataLoss: e.target.checked,
										}))
									}
									className="mt-1 w-5 h-5 rounded border-2 border-red-500 bg-transparent checked:bg-red-600 checked:border-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer appearance-none checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDMuNUw0LjUgN0wxMSAxIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-center bg-no-repeat"
								/>
								<div className="flex-1">
									<p className="text-white font-medium group-hover:text-red-500 transition-colors">
										I understand all my data will be permanently deleted
									</p>
									<p className="text-sm  mt-1">
										Including all images, documents, logs, and account
										information
									</p>
								</div>
							</label>

							{/* Wallet Loss Confirmation */}
							<label className="flex items-start gap-3 cursor-pointer group">
								<input
									type="checkbox"
									checked={confirmations.walletLoss}
									onChange={(e) =>
										setConfirmations((prev) => ({
											...prev,
											walletLoss: e.target.checked,
										}))
									}
									className="mt-1 w-5 h-5 rounded border-2 border-red-500 bg-transparent checked:bg-red-600 checked:border-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer appearance-none checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDMuNUw0LjUgN0wxMSAxIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-center bg-no-repeat"
								/>
								<div className="flex-1">
									<p className="text-white font-medium group-hover:text-red-500 transition-colors">
										I understand I will lose all wallet funds ($
										{formatBalance(userWalletBalance)})
									</p>
									<p className="text-sm  mt-1">
										Any balance in your wallet cannot be recovered or withdrawn
										after deletion
									</p>
								</div>
							</label>

							{/* Final Confirmation */}
							<label className="flex items-start gap-3 cursor-pointer group">
								<input
									type="checkbox"
									checked={confirmations.finalConfirm}
									onChange={(e) =>
										setConfirmations((prev) => ({
											...prev,
											finalConfirm: e.target.checked,
										}))
									}
									className="mt-1 w-5 h-5 rounded border-2 border-red-500 bg-transparent checked:bg-red-600 checked:border-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer appearance-none checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDMuNUw0LjUgN0wxMSAxIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-center bg-no-repeat"
								/>
								<div className="flex-1">
									<p className="text-white font-medium group-hover:text-red-500 transition-colors">
										I understand this action cannot be undone
									</p>
									<p className="text-sm  mt-1">
										There is no recovery process once deletion is complete
									</p>
								</div>
							</label>
						</div>

						{/* Text Confirmation */}
						<div className="space-y-2 pt-2">
							<label className="block text-white font-medium">
								Type{" "}
								<span className="text-red-500 font-bold">
									DELETE MY ACCOUNT
								</span>{" "}
								below to confirm:
							</label>
							<input
								type="text"
								value={confirmText}
								onChange={(e) => setConfirmText(e.target.value)}
								placeholder="DELETE MY ACCOUNT"
								className="w-full px-4 md:py-4 py-2 bg-secondary border border-charcoal rounded-lg text-white  focus:outline-none focus:ring focus:ring-red-500 focus:border-transparent"
							/>
						</div>

						{/* Legal Notice */}
						<div className="bg-secondary border border-slate-800 rounded-lg p-3 flex items-start gap-2">
							<Lock className="w-4 h-4  mt-0.5 flex-shrink-0" />
							<p className="text-xs ">
								For legal and security reasons, all data including images, logs,
								and personal information will be permanently erased from our
								systems within 30 days in compliance with data protection
								regulations.
							</p>
						</div>
					</SubscribeDialogDescription>
				</SubscribeDialogHeader>

				<SubscribeDialogFooter className="mt-5 flex flex-col gap-y-5">
					<Button
						type="button"
						onClick={handleDelete}
						disabled={!allConfirmed || deleteAccountMutation.isPending}
						className="rounded flex items-center w-full gap-2.5 border  active:bg-transparent h-auto px-10 py-2 text-[15px] font-medium whitespace-nowrap border-accent-color bg-transparent shadow-[2px_3px_0_0_#FF007F] text-accent-color"
					>
						{deleteAccountMutation.isPending ? (
							<span className="flex items-center gap-2">
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								Deleting...
							</span>
						) : (
							"Delete My Account Permanently"
						)}
					</Button>
					<button onClick={handleDialogClose} className=" text-accent-text">
						Cancel
					</button>
				</SubscribeDialogFooter>
			</SubscribeDialogContent>
		</SubscribeDialog>
	);
}
