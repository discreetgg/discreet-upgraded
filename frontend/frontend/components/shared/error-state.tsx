"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { AlertCircleIcon } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
	title: string;
	description: string;
	resetErrorBoundary: (...args: any[]) => void;
}

export default function ErrorState({
	title,
	description,
	resetErrorBoundary,
}: Props) {
	return (
		<div className="flex h-full flex-1 items-center justify-center px-8 py-4">
			<div className="flex w-full max-w-md flex-col items-center justify-center gap-y-6 rounded-lg bg-black p-10 shadow-sm ">
				<AlertCircleIcon className="size-6 text-red-500 md:size-8" />
				<div className="flex w-full flex-col gap-y-2 text-center">
					<h6 className="text-lg font-medium">{title}</h6>
					<p className="text-sm">{description}</p>
					<Button
						onClick={resetErrorBoundary}
						className="rounded px-4 py-2 text-white transition hover:bg-accent-color/80"
					>
						Retry
					</Button>
				</div>
			</div>
		</div>
	);
}
