import type { FormEvent } from "react";

type PrInputPanelProps = {
	value: string;
	loading: boolean;
	onChange: (value: string) => void;
	onSubmit: () => void;
};

export function PrInputPanel({
	value,
	loading,
	onChange,
	onSubmit,
}: PrInputPanelProps) {
	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		onSubmit();
	}

	return (
		<section className="panel input-panel">
			<div>
				<p className="eyebrow">AI PR Review Assistant</p>
				<h1>把 Pull Request 变成可行动的 Review 报告</h1>
				<p className="lead">
					输入 GitHub PR 链接，系统会拉取真实变更文件并执行规则扫描，
					先给出确定性风险信号，再为后续 AI Review 提供上下文。
				</p>
			</div>

			<form className="pr-form" onSubmit={handleSubmit}>
				<label htmlFor="pr-url">GitHub PR URL</label>
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
			</form>
		</section>
	);
}
