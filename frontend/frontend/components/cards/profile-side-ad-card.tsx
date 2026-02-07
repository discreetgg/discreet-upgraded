import { Button } from "../ui/button";
import { AddMenuItem } from "../add-menu-item";
import { UserType } from "@/types/global";
import { ImageWithFallback } from "../miscellaneous/image-with-fallback";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Icon } from "../ui/icons";
import {
	AnimatedNumber,
	AnimatedNumberAdvanced,
} from "../miscellaneous/animated-number";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { buyMenuItem, deleteMenuItem } from "@/actions/menu-item";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context-provider";
import {
	SubscribeDialog,
	SubscribeDialogClose,
	SubscribeDialogContent,
	SubscribeDialogDescription,
	SubscribeDialogTitle,
} from "@/components/ui/subscribe-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft } from "lucide-react";
import { DeleteMenuItemDialog } from "../delete-menu-item-dialog";
import { useRouter } from "@bprogress/next/app";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getConversationBetweenUsersService } from "@/lib/services";
import { useMessage } from "@/context/message-context";
import { useWallet } from "@/context/wallet-context-provider";

export default function ProfileSideAdCard({
	description,
	canBeUpdated,
	title,
	category,
	collectionType,
	coverImage,
	discount,
	itemCount,
	itemSold,
	media,
	noteToBuyer,
	priceToView,
	defaultValues,
	currentUser,
	author,
	_id,
}: MenuItemType & { defaultValues: MenuItemType; currentUser: UserType }) {
	const queryClient = useQueryClient();
	const { isAuthenticated } = useAuth();
	const { setIsFundWalletDialogOpen } = useWallet();

	const [openSuccessModal, setOpenSuccessModal] = useState(false);
	const [confirmPurchase, setConfirmPurchase] = useState(false);
	const [deleteMenu, setDeleteMenu] = useState(false);
	const [errorImage, setErrorImage] = useState(false);

	const [quantity, setQuantity] = useState(1);
	const isCurrentUser = currentUser.discordId === author.discordId;
	const mediaCount = media.length;
	const mediaLeft = mediaCount - itemSold;
	const isSingle = collectionType === "single";
	const isFullStack = mediaCount === mediaLeft;
	const isSoldOut = itemCount === itemSold || mediaLeft <= 0;
	const isOptimistic = _id.startsWith("temp_");

	const { mutateAsync: buyItem, isPending } = useMutation({
		mutationKey: ["buy_menu_item", currentUser.discordId],
		mutationFn: async (payload: BuyMenuItemPayload) => {
			await buyMenuItem(payload);
		},
		onSuccess: () => {
			toast.success("Menu item purchased successfully!");
			const cacheKey = ["menu_item", author?.discordId];

			queryClient.setQueryData<MenuItemType[] | undefined>(cacheKey, (old) => {
				if (!Array.isArray(old)) return old;
				return old.map((it) =>
					it._id === _id
						? {
								...it,
								itemSold: (it.itemSold ?? 0) + quantity,
								updatedAt: new Date().toISOString(),
							}
						: it,
				);
			});
			setOpenSuccessModal(true);
		},
		onError: (error) => {
			console.error("Error buying menu item:", error);
			toast.error("Failed to buy menu item. Please try again.");
			if (error?.response?.data?.message === "Insufficient funds") {
				toast.error("Not enough balance");
				setIsFundWalletDialogOpen(true);
			}
		},
	});
	const { mutateAsync: deleteMenuMutation, isPending: isDeleting } =
		useMutation({
			mutationKey: ["delete_menu_item", currentUser.discordId],
			mutationFn: async () => {
				await deleteMenuItem(_id);
			},
			onMutate: async () => {
				await queryClient.cancelQueries({
					queryKey: ["menu_item", author.discordId],
				});

				const previous = queryClient.getQueryData<MenuItemType[] | undefined>([
					"menu_item",
					author.discordId,
				]);

				if (Array.isArray(previous)) {
					queryClient.setQueryData(
						["menu_item", author.discordId],
						previous.filter((item) => item._id !== _id),
					);
				}
				setDeleteMenu(false);

				return { previous };
			},
			onError: (error, _variables, context) => {
				if (context?.previous) {
					queryClient.setQueryData(
						["menu_item", author.discordId],
						context.previous,
					);
				}
				console.error("Error deleting menu item:", error);
				toast.error("Failed to delete menu item. Please try again.");
			},

			onSettled: () => {
				setDeleteMenu(false);
			},
		});

	const handleBuyItem = () => {
		setConfirmPurchase(false);

		if (isSoldOut) {
			toast.error("This item is sold out.");
			return;
		}
		if (!isAuthenticated) {
			toast.error("Please log in to purchase item.");
			return;
		}
		buyItem({
			itemCount: quantity,
			menuId: _id,
			sellerId: author.discordId,
			buyerId: currentUser.discordId,
		});
	};

	const { data: conversationBetweenUsers, isFetching: isFetchingConversation } =
		useQuery({
			queryKey: [
				"conversation-between-users",
				author.discordId,
				currentUser.discordId,
			],
			queryFn: () =>
				getConversationBetweenUsersService([
					author.discordId,
					currentUser.discordId,
				]),
			enabled:
				openSuccessModal &&
				Boolean(author?.discordId) &&
				Boolean(currentUser?.discordId),
			staleTime: 1000 * 60,
		});

	const conversationId = useMemo(() => {
		if (!conversationBetweenUsers) return undefined;

		const candidate =
			(conversationBetweenUsers as { conversationId?: string })
				.conversationId ??
			(
				conversationBetweenUsers as {
					conversation?: { id?: string; _id?: string };
				}
			).conversation?.id ??
			(
				conversationBetweenUsers as {
					conversation?: { id?: string; _id?: string };
				}
			).conversation?._id ??
			(conversationBetweenUsers as { _id?: string })._id ??
			(conversationBetweenUsers as { id?: string }).id;

		return typeof candidate === "string" && candidate.length > 0
			? candidate
			: undefined;
	}, [conversationBetweenUsers]);

	return (
		<>
			<DeleteMenuItemDialog
				isOpen={deleteMenu}
				onOpenChange={setDeleteMenu}
				onConfirm={async () => await deleteMenuMutation()}
			/>
			<ConfirmPurchaseDialog
				isOpen={confirmPurchase}
				onOpenChange={setConfirmPurchase}
				onConfirm={handleBuyItem}
			/>
			<SuccessMenuDialog
				open={openSuccessModal}
				setOpen={setOpenSuccessModal}
				title={title}
				coverImage={coverImage.url}
				discordId={author.discordId}
				receiver={author}
				conversationId={conversationId}
				isLoadingConversation={isFetchingConversation}
			/>
			<div
				data-empty={isSoldOut}
				data-delete={isDeleting}
				className="flex w-full max-w-[370px] isolate sm:max-w-[405px] data-[delete=true]:blur-[2px] data-[delete=true]:opacity-50 h-[166px] border border-accent-gray/30 rounded-xl pl-2 py-2 border-r-4 border-b-4 data-[empty=false]:hover:border-b-[6px] data-[empty=false]:hover:border-r-[6px] transition-all duration-150 justify-between overflow-hidden gap-x-4 relative"
			>
				{isSoldOut && !isCurrentUser && (
					<div className="absolute size-full inset-0 flex items-center justify-center rounded-xl z-20 bg-black/70 ">
						<div className="flex justify-center items-center uppercase text-xl md:text-3xl bg-black/30 backdrop-blur-xl size-full ">
							SOLD OUT!
						</div>
					</div>
				)}
				{isSoldOut && isCurrentUser && (
					<div className="uppercase font-inter font-bold px-4 w-[166px] top-10 bg-black text-accent-color absolute z-[99] -right-10 rotate-45 text-center">
						sold out!
					</div>
				)}
				<div className="flex flex-col gap-y-2 h-full justify-between relative">
					<div className="flex flex-col gap-y-2">
						<p className="text-sm  font-inter">{title}</p>
						<p className="text-xs text-accent-text/80 overflow-y-auto">
							{description}
						</p>
					</div>
					<div className="flex flex-col gap-y-3">
						<div className="flex items-center gap-x-1 font-inter font-light">
							<p className="text-xs  text-off-white ">
								{" "}
								{formatSubAmount(priceToView)}
							</p>
							<span className="bg-accent-gray w-px h-2" />
							{mediaCount > 1 ? (
								<>
									<span className="text-[10px] text-off-white">
										{isNaN(mediaLeft) ? "..." : mediaLeft}/{mediaCount}
									</span>
									<span className="text-[10px] text-accent-text">
										Item{mediaLeft > 1 && "s"} left
									</span>
								</>
							) : (
								<>
									<span className="text-[10px] text-off-white">
										{isNaN(mediaLeft) ? "..." : mediaLeft}
									</span>
									<span className="text-[10px] text-accent-text">
										Item{mediaLeft > 1 && "s"}
									</span>
								</>
							)}
						</div>
						{isCurrentUser ? (
							<div className="flex items-center gap-x-2">
								{isFullStack || isOptimistic ? (
									<AddMenuItem defaultValues={defaultValues} isUpdating>
										<Button
											disabled={!isFullStack || isDeleting}
											className="px-4 w-fit text-[10px]  py-1 rounded-2xl border-none text-white bg-accent-gray"
											size={"ghost"}
										>
											{isOptimistic ? (
												<span>Uploading</span>
											) : (
												<span>Update</span>
											)}
										</Button>
									</AddMenuItem>
								) : (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												className="px-4 w-fit text-[10px]  py-1 rounded-2xl border-none text-white bg-accent-gray opacity-50"
												size={"ghost"}
											>
												Locked
											</Button>
										</TooltipTrigger>
										<TooltipContent className="max-w-[150px] px-1 text-center">
											{isSoldOut ? (
												<p>
													This Menu item can&apos;t be updated because its sold
													out!
												</p>
											) : (
												<p>
													This Menu item can&apos;t be updated because one or
													more items as been bought
												</p>
											)}
										</TooltipContent>
									</Tooltip>
								)}
								<Button
									disabled={isDeleting || isOptimistic}
									onClick={() => setDeleteMenu(true)}
									className="px-4 w-fit text-[10px]  py-1 rounded-2xl  text-red-400 bg-red-600/10 border border-red-700 "
									size={"ghost"}
								>
									Delete
								</Button>
							</div>
						) : isSingle ? (
							<Button
								onClick={() => setConfirmPurchase(true)}
								className="px-4 md:px-8 w-fit text-[10px]  py-1 rounded-md border-none text-primary bg-off-white relative"
								variant={"ghost"}
								size={"ghost"}
							>
								<span
									data-hidden={isPending}
									className="block payment_loader absolute  w-full data-[hidden=false]:opacity-0 transition-opacity duration-200 ease-in-out data-[hidden=true]:opacity-100"
								/>

								<span
									data-hidden={isPending}
									className="data-[hidden=true]:opacity-0 transition-opacity duration-200 ease-in-out data-[hidden=false]:opacity-100"
								>
									Buy
								</span>
							</Button>
						) : (
							<div className="flex items-center gap-2 h-6">
								<div className="flex items-stretch  gap-x-0.5 h-full">
									<Button
										onClick={() => setQuantity(Math.max(1, quantity - 1))}
										data-disabled={quantity === 1}
										variant={"ghost"}
										size={"ghost"}
										className="px-2  data-[disabled=true]:bg-charcoal disabled:opacity-100 rounded-none rounded-tl-md rounded-bl-md data-[disabled=true]:text-muted-foreground text-black hover:text-foreground transition-colors bg-off-white "
									>
										−
									</Button>
									<div className="bg-charcoal w-7 justify-center flex items-center font-medium text-off-white  text-xs ">
										{mediaCount > 9 ? (
											<AnimatedNumberAdvanced
												value={quantity}
												animationType="fade"
												duration={0.3}
												className="w-full text-center flex justify-center"
											/>
										) : (
											<AnimatedNumber
												value={quantity}
												animationType="slide"
												duration={0.2}
												className="w-full text-center flex justify-center"
											/>
										)}
									</div>
									<Button
										onClick={() =>
											setQuantity(Math.min(mediaLeft, quantity + 1))
										}
										disabled={mediaLeft === quantity}
										variant={"ghost"}
										size={"ghost"}
										className="px-2 bg-off-white disabled:bg-charcoal disabled:opacity-100 rounded-none rounded-tr-md rounded-br-md disabled:text-muted-foreground text-black hover:text-foreground transition-colors "
									>
										<Icon.add />
									</Button>
								</div>
								<Button
									onClick={() => setConfirmPurchase(true)}
									className="px-4 md:px-8 w-fit text-[10px]  py-1 rounded-md border-none text-primary bg-off-white relative"
									variant={"ghost"}
									size={"ghost"}
								>
									<span
										data-hidden={isPending}
										className="block payment_loader absolute  w-full data-[hidden=false]:opacity-0 transition-opacity duration-200 ease-in-out data-[hidden=true]:opacity-100"
									/>

									<span
										data-hidden={isPending}
										className="data-[hidden=true]:opacity-0 transition-opacity duration-200 ease-in-out data-[hidden=false]:opacity-100"
									>
										Buy
									</span>
								</Button>
							</div>
						)}
					</div>
				</div>
				<div className="w-[140] sm:w-[154px] h-full flex-shrink-0  overflow-hiddenx   relative pr-1 isolate">
					<div
						data-bundle={!isSingle}
						className="absolute data-[bundle=true]:bottom-1 data-[bundle=true]:-left-0.5 p-1 px-1.5 z-20 bg-black/50 backdrop-blur-xl rounded-md bottom-1 left-1 flex items-center text-off-white gap-x-1.5 text-xs font-inter"
					>
						{!isSingle ? (
							<Icon.bundle className=" size-4 text-accent-color" />
						) : (
							<Icon.single className=" size-4 " />
						)}
						{isSingle ? <span>Single</span> : <span>Bundle</span>}
					</div>
					{!isSingle && !errorImage ? (
						<div className="relative size-full">
							{[1, 2, 3].map((item) => (
								<ImageWithFallback
									key={item}
									src={coverImage.url}
									alt={title}
									width={200}
									height={300}
									data-index={item}
									className="size-full object-cover object-center rounded-md absolute inset-0 z-[8] "
									containerClassName={cn(
										"absolute rounded-md shadow-[3px_4px_4px_0px_#00000040]  ",
										{
											"-translate-x-2 z-10": item === 1,
											"-translate-x-1 sh z-[9]": item === 2,
										},
									)}
									priority
									setErrorImage={setErrorImage}
								/>
							))}
						</div>
					) : (
						<ImageWithFallback
							src={coverImage.url}
							alt={title}
							width={200}
							height={300}
							className="size-full object-cover object-center rounded-md "
							priority
							setErrorImage={setErrorImage}
						/>
					)}
				</div>
			</div>
		</>
	);
}

interface ConfirmPurchaseDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

function ConfirmPurchaseDialog({
	isOpen,
	onOpenChange,
	onConfirm,
}: ConfirmPurchaseDialogProps) {
	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent className="bg-gradient-to-r from-primary/80 to-rose-900/10 backdrop-blur-xl">
				<AlertDialogHeader>
					<AlertDialogTitle>Confirm Purchase?</AlertDialogTitle>
					<AlertDialogDescription>
						Confirm to proceed with the purchase.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-red-500 hover:bg-red-600"
					>
						Proceed
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

interface Props {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	title: string;
	coverImage: string;
	discordId: string;
	conversationId?: string;
	isLoadingConversation?: boolean;
	receiver: AuthorType | UserType | null;
}
const SuccessMenuDialog = ({
	open,
	setOpen,
	title,
	coverImage,
	discordId,
	conversationId,
	isLoadingConversation = false,
	receiver,
}: Props) => {
	const router = useRouter();
	const { setReceiver } = useMessage();

	const handleCheckItOut = () => {
		if (isLoadingConversation && !conversationId) {
			return;
		}
		setReceiver(receiver);
		setOpen(false);
		if (conversationId) {
			router.push(`/messages/${conversationId}`);
		} else {
			router.push("/messages?chat=new");
			toast.success(`Opening new chat`);
		}
	};
	return (
		<SubscribeDialog open={open} onOpenChange={setOpen}>
			<SubscribeDialogContent
				showCloseButton={false}
				tabIndex={-1}
				className="flex flex-col bg-medium-charcoal border-none w-full !ring-0 !outline-none justify-start  overflow-hidden p-0"
			>
				<div className="absolute w-full top-0 left-0">
					<ImageWithFallback
						src={coverImage}
						width={1000}
						height={300}
						alt={title}
						className="w-full h-full object-cover object-center rounded-md "
					/>
				</div>
				<div className="flex flex-col gap-y-10 bg-medium-charcoal/95 relative z-10 py-10 px-6 sm:px-24  gap-8 overflow-hidden rounded-xl size-full scale-[1.01]">
					<SubscribeDialogClose className=" absolute top-6 left-6 flex items-center gap-x-2 cursor-pointer hover:underline text-accent-text text-xs font-inter">
						<span className="size-3 bg-accent-text text-black flex items-center justify-center rounded-[2px]">
							<ChevronLeft />
						</span>
						Back to profile
					</SubscribeDialogClose>
					<SubscribeDialogDescription className="sr-only">
						{" "}
						Purchase Successful
					</SubscribeDialogDescription>
					<div className="flex flex-col gap-y-8 items-center font-inter pb-5 pt-10 z-10 relative">
						<SubscribeDialogTitle className="capitalize text-center md:text-3xl font-inter text-2xl font-medium ">
							Purchase Successful
						</SubscribeDialogTitle>
						<p className="text-accent-text text-center text-2xl">
							Thank you for purchasing{" "}
							<span className="text-accent-color capitalize">{title}</span> from
							my Menu
						</p>
					</div>

					<Button
						type="button"
						onClick={handleCheckItOut}
						className="rounded relative flex items-center  border hover:bg-transparent active:bg-transparent h-auto mt-5 py-2 text-[15px] font-medium cursor-pointer whitespace-nowrap border-[#FF007F] bg-[#0A0A0B] shadow-[2px_2px_0_0_#FF007F] text-[#F8F8F8] text-lg px-3 gap-3 "
						disabled={isLoadingConversation && !conversationId}
					>
						{isLoadingConversation && !conversationId
							? "Loading chat..."
							: "Check it out!"}
					</Button>
				</div>
			</SubscribeDialogContent>
		</SubscribeDialog>
	);
};
function formatSubAmount(amount: string) {
	const intAmount = Number(amount);
	const formatter = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});
	return formatter.format(intAmount);
}
