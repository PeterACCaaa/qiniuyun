import { useRef, type FormEvent } from "react";
import {
	useHeroPanelAnimation,
	useScanStatusAnimation,
} from "../lib/use-gsap-animations";
import type { AnalyzeStatus } from "../types/review";

type PrInputPanelProps = {
	value: string;
	loading: boolean;
	status: AnalyzeStatus;
	showChinese: boolean;
	onLanguageChange: (value: boolean) => void;
	onChange: (value: string) => void;
	onSubmit: () => void;
};

const STEPS = [
	{ zh: "解析 PR", en: "Parse PR" },
	{ zh: "拉取 Diff", en: "Fetch Diff" },
	{ zh: "规则扫描", en: "Scan Rules" },
	{ zh: "风险地图", en: "Risk Map" },
];

export function PrInputPanel({
	value,
	loading,
	status,
	showChinese,
	onLanguageChange,
	onChange,
	onSubmit,
}: PrInputPanelProps) {
	const panelRef = useRef<HTMLElement | null>(null);

	useHeroPanelAnimation(panelRef);
	useScanStatusAnimation(panelRef, status);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		onSubmit();
	}

	return (
		<section className="hero-console" ref={panelRef}>
			<div className="hero-copy">
				<p className="eyebrow">AI PR Review Assistant</p>
				<h1>
					{showChinese
						? "把 Pull Request 变成风险地图"
						: "Turn pull requests into a risk map"}
				</h1>
				<p className="lead">
					{showChinese
						? "先用确定性规则定位高风险文件和证据，再把上下文交给 AI 做深度 Review。"
						: "Scan the diff first, surface high-risk evidence, then hand the focused context to AI."}
				</p>
				<div className="hero-points" aria-label="Review workflow">
					<span>{showChinese ? "确定性规则" : "Rule-first"}</span>
					<span>{showChinese ? "真实 PR 数据" : "Live PR data"}</span>
					<span>{showChinese ? "AI 深度复核" : "AI follow-up"}</span>
				</div>
			</div>

			<form className="scan-panel" onSubmit={handleSubmit}>
				<div className="scan-panel-head">
					<div>
						<label htmlFor="pr-url">
							{showChinese ? "GitHub PR 链接" : "GitHub PR URL"}
						</label>
						<p>{showChinese ? "粘贴链接后直接生成审查工作台" : "Paste a pull request link to open the review workspace."}</p>
					</div>
					<label className="toggle-row">
						<input
							type="checkbox"
							checked={showChinese}
							onChange={(event) => onLanguageChange(event.target.checked)}
						/>
						<span>{showChinese ? "中文展示" : "Chinese"}</span>
					</label>
				</div>
				<div className="field-row">
					<input
						id="pr-url"
						type="url"
						value={value}
						onChange={(event) => onChange(event.target.value)}
						placeholder="https://github.com/owner/repo/pull/123"
						disabled={loading}
					/>
					<button type="submit" disabled={loading || !value.trim()}>
						{loading
							? showChinese
								? "分析中..."
								: "Analyzing..."
							: showChinese
								? "开始分析"
								: "Analyze"}
					</button>
				</div>
				<div className={`scan-steps scan-${status}`} aria-label="Scan progress">
					{STEPS.map((step, index) => (
						<div className="scan-step" key={step.en}>
							<span>{index + 1}</span>
							<p>{showChinese ? step.zh : step.en}</p>
						</div>
					))}
				</div>
			</form>
		</section>
	);
}
