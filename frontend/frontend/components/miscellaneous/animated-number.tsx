"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

export type AnimationType = "flip" | "slide" | "fade" | "scale-bounce";

interface AnimatedNumberDisplayProps {
	value: number;
	animationType?: AnimationType;
	className?: string;
	duration?: number;
}

export function AnimatedNumber({
	value,
	animationType = "flip",
	className = "",
	duration = 0.4,
}: AnimatedNumberDisplayProps) {
	// Memoize animation variants to prevent recreation on every render
	const animationVariants = useMemo(() => {
		const baseConfig = {
			transition: {
				duration,
				ease: "easeOut",
			},
		};

		const variants = {
			flip: {
				initial: { rotateX: 90, opacity: 0 },
				animate: { rotateX: 0, opacity: 1 },
				exit: { rotateX: -90, opacity: 0 },
				transition: { ...baseConfig.transition, ease: "easeInOut" },
			},
			slide: {
				initial: { y: 20, opacity: 0 },
				animate: { y: 0, opacity: 1 },
				exit: { y: -20, opacity: 0 },
				transition: baseConfig.transition,
			},
			fade: {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { ...baseConfig.transition, duration: duration * 0.6 },
			},
			"scale-bounce": {
				initial: { scale: 0.5, opacity: 0 },
				animate: { scale: 1, opacity: 1 },
				exit: { scale: 0.8, opacity: 0 },
				transition: {
					...baseConfig.transition,
					type: "spring",
					stiffness: 200,
					damping: 15,
				},
			},
		};

		return variants[animationType];
	}, [animationType, duration]);

	// Use key to force AnimatePresence to treat each number as a new element
	const key = `number-${value}`;

	return (
		<div className={`relative overflow-hidden ${className}`}>
			<AnimatePresence mode="wait">
				<motion.div
					key={key}
					initial="initial"
					animate="animate"
					exit="exit"
					variants={animationVariants}
					// GPU acceleration: use transform instead of position changes
					style={{
						perspective: 1000,
						transformStyle: "preserve-3d",
					}}
				>
					{value}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}

/**
 * Advanced animated number display with digit-by-digit animation
 * Useful for displaying multi-digit numbers with staggered animations
 */
export function AnimatedNumberAdvanced({
	value: initialValue,
	animationType = "slide",
	className = "",
	duration = 0.4,
	staggerDelay = 0.05,
}: AnimatedNumberDisplayProps & { staggerDelay?: number }) {
	const digits = String(initialValue).split("");

	const animationVariants = useMemo(() => {
		const baseConfig = {
			transition: {
				duration,
				ease: "easeOut",
			},
		};

		const variants = {
			flip: {
				initial: { rotateX: 90, opacity: 0 },
				animate: { rotateX: 0, opacity: 1 },
				exit: { rotateX: -90, opacity: 0 },
				transition: { ...baseConfig.transition, ease: "easeInOut" },
			},
			slide: {
				initial: { y: 20, opacity: 0 },
				animate: { y: 0, opacity: 1 },
				exit: { y: -20, opacity: 0 },
				transition: baseConfig.transition,
			},
			fade: {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { ...baseConfig.transition, duration: duration * 0.6 },
			},
			"scale-bounce": {
				initial: { scale: 0.5, opacity: 0 },
				animate: { scale: 1, opacity: 1 },
				exit: { scale: 0.8, opacity: 0 },
				transition: {
					...baseConfig.transition,
					type: "spring",
					stiffness: 200,
					damping: 15,
				},
			},
		};

		return variants[animationType];
	}, [animationType, duration]);

	return (
		<div className={`flex ${className}`}>
			<AnimatePresence mode="wait">
				{digits.map((digit, index) => (
					<motion.div
						key={`${initialValue}-${index}`}
						initial="initial"
						animate="animate"
						exit="exit"
						variants={animationVariants}
						transition={{
							...animationVariants.transition,
							delay: index * staggerDelay,
						}}
						style={{
							perspective: 1000,
							transformStyle: "preserve-3d",
						}}
					>
						{digit}
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}

/**
 * Lightweight counter component with smooth number transitions
 * Optimized for frequent updates with minimal re-renders
 */
export function SmoothCounter({
	value,
	animationType = "slide",
	className = "",
	showDelta = false,
}: AnimatedNumberDisplayProps & { showDelta?: boolean }) {
	return (
		<motion.div
			className={className}
			layout
			transition={{ type: "spring", stiffness: 300, damping: 30 }}
		>
			<AnimatedNumber
				value={value}
				animationType={animationType}
				className="font-medium"
			/>
		</motion.div>
	);
}
