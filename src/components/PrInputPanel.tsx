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

const STEPS = ["解析 PR", "拉取 Diff", "规则扫描", "生成风险地图"];

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
				<h1>把 Pull Request 变成风险地图</h1>
				<p className="lead">
					先用确定性规则定位高风险文件和证据，再把上下文交给 AI 做深度 Review。
					目标不是替代 reviewer，而是让 reviewer 更快知道先看哪里。
				</p>
			</div>

			<form className="scan-panel" onSubmit={handleSubmit}>
				<div className="scan-panel-head">
					<label htmlFor="pr-url">
						{showChinese ? "GitHub PR 链接" : "GitHub PR URL"}
					</label>
					<label className="toggle-row">
						<input
							type="checkbox"
							checked={showChinese}
							onChange={(event) => onLanguageChange(event.target.checked)}
						/>
						<span>中文展示</span>
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
						{loading ? "分析中..." : "开始分析"}
					</button>
				</div>
				<div className={`scan-steps scan-${status}`}>
					{STEPS.map((step, index) => (
						<div className="scan-step" key={step}>
							<span>{index + 1}</span>
							<p>{step}</p>
						</div>
					))}
				</div>
			</form>
		</section>
	);
}
