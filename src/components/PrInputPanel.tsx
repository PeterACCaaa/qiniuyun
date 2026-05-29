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
					输入 GitHub PR 链接，后续将自动拉取变更、识别风险并生成 Review 建议。
					当前版本先搭好交互骨架，API 使用 mock 数据占位。
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
