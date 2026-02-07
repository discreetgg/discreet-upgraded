"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CircularLoaderProps {
	duration?: number;
	size?: number;
	strokeWidth?: number;
	color?: string;
	backgroundColor?: string;
	onComplete?: () => void;
	className?: string;
}

export default function CircularLoader({
	duration = 5000,
	size = 40,
	strokeWidth = 2,
	color = "rgb(99, 102, 241)",
	backgroundColor = "rgb(224, 231, 255)",
	onComplete,
	className = "",
}: CircularLoaderProps) {
	const [progress, setProgress] = useState(0);

	// Calculate circle properties
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference - (progress / 100) * circumference;

	useEffect(() => {
		const startTime = Date.now();

		const updateProgress = () => {
			const elapsed = Date.now() - startTime;
			const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);

			setProgress(newProgress);

			if (newProgress > 0) {
				requestAnimationFrame(updateProgress);
			} else {
				if (onComplete) onComplete();
			}
		};

		const animationId = requestAnimationFrame(updateProgress);

		return () => {
			cancelAnimationFrame(animationId);
		};
	}, [duration, onComplete]);

	return (
		<div
			className={`relative inline-flex items-center justify-center ${className}`}
		>
			{/* biome-ignore lint/a11y/useFocusableInteractive: <explanation> */}
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-label="Loading indicator"
				// biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: <explanation>
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(progress)}
			>
				{/* Background circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					stroke={backgroundColor}
					fill="none"
				/>

				{/* Progress circle */}
				<motion.circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					strokeWidth={strokeWidth}
					stroke={color}
					strokeLinecap="round"
					fill="none"
					transform={`rotate(-90 ${size / 2} ${size / 2})`}
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					initial={{ strokeDashoffset: 0 }}
					animate={{ strokeDashoffset }}
					transition={{ duration: 0.1, ease: "linear" }}
				/>
			</svg>
		</div>
	);
}
