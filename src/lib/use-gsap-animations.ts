import type { RefObject } from "react";
import { gsap, useGSAP } from "./gsap-client";
import type { AiReview, AnalyzeStatus, ReviewReport } from "../types/review";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function shouldReduceMotion() {
	return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function useShellIntroAnimation(scope: RefObject<HTMLElement | null>) {
	useGSAP(
		() => {
			if (shouldReduceMotion()) return;

			gsap
				.timeline({ defaults: { duration: 0.48, ease: "power2.out" } })
				.from(".hero-console", { autoAlpha: 0, y: 16 })
				.from(".status-row", { autoAlpha: 0, y: 8, duration: 0.3 }, "-=0.18");
		},
		{ scope },
	);
}

export function useHeroPanelAnimation(scope: RefObject<HTMLElement | null>) {
	useGSAP(
		() => {
			if (shouldReduceMotion()) return;

			gsap.from(".hero-copy > *, .scan-panel", {
				autoAlpha: 0,
				y: 12,
				duration: 0.44,
				ease: "power2.out",
				stagger: 0.07,
			});
		},
		{ scope },
	);
}

export function useScanStatusAnimation(
	scope: RefObject<HTMLElement | null>,
	status: AnalyzeStatus,
) {
	useGSAP(
		() => {
			const steps = gsap.utils.toArray<HTMLElement>(".scan-step");
			if (shouldReduceMotion() || !steps.length) return;

			if (status === "loading") {
				animateScanLoading(steps);
				return;
			}

			if (status === "success") {
				animateScanSuccess(steps);
				return;
			}

			if (status === "error") animateScanError();
		},
		{ dependencies: [status], scope },
	);
}

export function useReportRevealAnimation(
	scope: RefObject<HTMLDivElement | null>,
	report: ReviewReport | null,
) {
	useGSAP(
		() => {
			if (!report || shouldReduceMotion()) return;

			gsap
				.timeline({ defaults: { duration: 0.42, ease: "power2.out" } })
				.from(".reveal", { autoAlpha: 0, y: 14, stagger: 0.045 })
				.from(
					".change-bar span",
					{
						scaleX: 0,
						transformOrigin: "left center",
						duration: 0.5,
						stagger: 0.015,
					},
					"-=0.28",
				);
		},
		{ dependencies: [report], scope, revertOnUpdate: true },
	);
}

export function useAiReviewRevealAnimation(
	scope: RefObject<HTMLElement | null>,
	review: AiReview | null,
	loading: boolean,
) {
	useGSAP(
		() => {
			if (shouldReduceMotion() || !review || loading) return;

			gsap.from(".ai-result > *", {
				autoAlpha: 0,
				y: 12,
				duration: 0.36,
				ease: "power2.out",
				stagger: 0.05,
				overwrite: "auto",
			});
		},
		{ dependencies: [review, loading], scope, revertOnUpdate: true },
	);
}

export function useRiskDonutAnimation(
	scope: RefObject<HTMLDivElement | null>,
	values: number[],
) {
	useGSAP(
		() => {
			if (shouldReduceMotion()) return;

			gsap.fromTo(
				".risk-donut",
				{ autoAlpha: 0, scale: 0.9, rotation: -12 },
				{
					autoAlpha: 1,
					scale: 1,
					rotation: 0,
					duration: 0.5,
					ease: "back.out(1.5)",
					overwrite: "auto",
				},
			);
			gsap.from(".legend-item", {
				autoAlpha: 0,
				x: 8,
				duration: 0.3,
				ease: "power2.out",
				stagger: 0.05,
				overwrite: "auto",
			});
		},
		{ dependencies: values, scope },
	);
}

function animateScanLoading(steps: HTMLElement[]) {
	gsap.fromTo(
		steps,
		{ autoAlpha: 0.76, y: 6 },
		{
			autoAlpha: 1,
			y: 0,
			duration: 0.28,
			ease: "power2.out",
			stagger: 0.05,
			overwrite: "auto",
		},
	);
}

function animateScanSuccess(steps: HTMLElement[]) {
	gsap.fromTo(
		steps,
		{ scale: 0.97 },
		{
			scale: 1,
			duration: 0.38,
			ease: "back.out(1.4)",
			stagger: 0.04,
			overwrite: "auto",
		},
	);
}

function animateScanError() {
	gsap.fromTo(
		".scan-panel",
		{ x: -4 },
		{ x: 0, duration: 0.16, ease: "power1.out", overwrite: "auto" },
	);
}
