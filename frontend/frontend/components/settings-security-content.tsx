"use client";

import { useGlobal } from "@/context/global-context-provider";
import { SettingsChangePinDialog } from "./settings-change-pin-dialog";
import { SettingsCreatePinDialog } from "./settings-create-pin-dialog";
import { SettingsEnterPasswordDialog } from "./settings-enter-password-dialog";

import { SettingsRemoveAuthenticatorAppDialog } from "./setting-remove-authenticator-app-dialog";
import { SettingsRemovePinDialog } from "./setting-remove-pin-dialog";
import { SettingsViewBackupCodesDialog } from "./settings-view-backup-code-dialog";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import DeleteAccountModal from "./modals/delete-account-modal";
import { useWallet } from "@/context/wallet-context-provider";
import { useState } from "react";

export const SettingsSecurityContent = () => {
	const { user } = useGlobal();
	const { wallet, setWallet } = useWallet();

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	// Mock user data - replace with real data
	const userWalletBalance = wallet?.balance ?? 0;

	return (
		<div className="px-8 py-6 w-full rounded-lg border border-[#1E1E21] shadow-[4px_4px_0_0_#1E1E21] space-y-10">
			{user?.hasAuthPin ? (
				<>
					<div className="space-y-4 max-w-[492px]">
						<h1 className="text-[#D4D4D8] text-lg font-medium">
							Transaction Pin
						</h1>
						<p className="text-[#8A8C95] font-medium text-[15px]">
							Setting up an authenticator app is an effective way to enhance the
							security of your Discord account, ensuring that only you can
							access it.
						</p>
						<div className="flex items-center gap-4">
							<SettingsChangePinDialog />
							<SettingsRemovePinDialog />
						</div>
					</div>
					<Separator />
				</>
			) : (
				<>
					<div className="space-y-4 max-w-[492px]">
						<h1 className="text-[#D4D4D8] text-lg font-medium">
							Transaction Pin
						</h1>
						<p className="text-[#8A8C95] font-medium text-[15px]">
							Your PIN helps prevent unauthorized access to your funds and
							secures your account from potential breaches
						</p>

						<SettingsCreatePinDialog />
					</div>
					<Separator />
				</>
			)}

			{user?._2FAEnabled && user._2FAVerified ? (
				<div className="space-y-4 max-w-[492px]">
					<h1 className="text-[#D4D4D8] text-lg font-medium">
						Authenticator App
					</h1>
					<p className="text-[#8A8C95] font-medium text-[15px]">
						Setting up an authenticator app is an effective way to enhance the
						security of your Discord account, ensuring that only you can access
						it.
					</p>
					<div className="flex items-center gap-4">
						<SettingsViewBackupCodesDialog />
						<SettingsRemoveAuthenticatorAppDialog />
					</div>
				</div>
			) : (
				<div className="space-y-4 max-w-[492px]">
					<h1 className="text-[#D4D4D8] text-lg font-medium">
						Authenticator App
					</h1>
					<p className="text-[#8A8C95] font-medium text-[15px]">
						Setting up an authenticator app is an effective way to enhance the
						security of your Discord account, ensuring that only you can access
						it.
					</p>
					<div>
						<SettingsEnterPasswordDialog />
					</div>
				</div>
			)}
			<Separator />
			<Button
				onClick={() => setIsDeleteModalOpen(true)}
				className="rounded  flex items-center w-max gap-2.5 border hover:bg-secondary active:bg-transparent h-auto px-10 py-2 text-[15px] font-medium whitespace-nowrap border-[#FF007F] bg-primary shadow-[2px_2px_0_0_#FF007F] text-white"
			>
				Delete Account
			</Button>

			{/* Delete Account Modal */}
			<DeleteAccountModal
				isOpen={isDeleteModalOpen}
				setIsOpen={setIsDeleteModalOpen}
				userWalletBalance={userWalletBalance}
			/>
		</div>
	);
};
