import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { Icon } from "./ui/icons";
import { Button } from "./ui/button";

interface DeleteMediaDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function DeleteMenuItemDialog({
	isOpen,
	onOpenChange,
	onConfirm,
}: DeleteMediaDialogProps) {
	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent className="bg-[#0A0A0B] border-[#2E2E32] rounded-[32px] p-8 max-w-[400px] shadow-2xl overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EF4444] to-transparent opacity-50" />

				<AlertDialogHeader className="space-y-4 pt-4">
					<div className="mx-auto size-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center border border-[#EF4444]/20 mb-2">
						<Icon.deleteContent className="size-8 text-[#EF4444]" />
					</div>
					<AlertDialogTitle className="text-2xl font-bold text-center text-white">
						Delete Menu Item
					</AlertDialogTitle>
					<AlertDialogDescription className="text-[#8A8C95] text-center text-base">
						This menu item will be permanently removed. This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter className="mt-8 flex flex-col sm:flex-col gap-3">
					<Button
						onClick={onConfirm}
						className="h-12 w-full rounded-2xl bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-bold text-base shadow-[0_4px_12px_rgba(239,68,68,0.3)] transition-all active:scale-[0.98]"
					>
						Yes, Delete Item
					</Button>
					<AlertDialogCancel className="h-12 w-full border-none bg-transparent hover:bg-white/5 text-[#8A8C95] hover:text-white rounded-2xl transition-colors m-0">
						Cancel
					</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
