const { readFileSync } = require("node:fs");
const { stripVTControlCharacters } = require("node:util");

const teamsByPath = {
	software: "@spacecubics/software",
	fpga: "@spacecubics/logic",
	product: "@spacecubics/hardware",
	"dev-board": "@spacecubics/hardware",
	hardware: "@spacecubics/hardware",
	"ai-engine": "@spacecubics/software",
	"safety-processor": "@spacecubics/logic",
	ROOT: "@spacecubics/software",
};

const escapeMarkdown = (text) =>
	stripVTControlCharacters(String(text)).replace(/[\\`*_{}\[\]<>#|]/g, "\\$&");

function summarizeLinks() {
	let report;
	try {
		report = JSON.parse(
			readFileSync("test-results/external-links.json", "utf8"),
		);
	} catch {
		return "Link check results are unavailable. Check the failed steps and workflow logs below.";
	}

	const failures = [];
	const teams = new Set();
	function visit(suite) {
		for (const spec of suite.specs ?? []) {
			for (const test of spec.tests) {
				// A retry that passed is flaky, not a failed link.
				if (test.status !== "unexpected") continue;
				const result = test.results.at(-1);
				const reason = (
					result?.error?.message ??
					result?.status ??
					"Unknown error"
				)
					.split("\nLinked from:")[0]
					.split("\n")[0];
				const sources = [
					...new Set(
						(test.annotations ?? [])
							.filter((annotation) => annotation.type === "source")
							.map((annotation) => annotation.description),
					),
				];
				for (const source of sources) {
					// Antora omits ROOT in <component>/<version>/<page>.html.
					const parts = (source ?? "").split("/");
					if (parts.length === 3 && parts[2].endsWith(".html")) {
						teams.add(teamsByPath.ROOT);
					}
					for (const segment of (source ?? "").split("/")) {
						if (Object.hasOwn(teamsByPath, segment)) {
							teams.add(teamsByPath[segment]);
						}
					}
				}
				failures.push(
					[
						`### ${escapeMarkdown(spec.title)}`,
						"",
						`**Error:** ${escapeMarkdown(reason.slice(0, 1000))}`,
						"",
						"**Linked from:**",
						...(sources.length
							? sources.map((source) => `- ${escapeMarkdown(source)}`)
							: [
								"- Unavailable (the test may have failed before opening the URL).",
							]),
						"",
					].join("\n"),
				);
			}
		}
		for (const child of suite.suites ?? []) visit(child);
	}
	for (const suite of report.suites ?? []) visit(suite);

	let summary = failures.length
		? `## Failed links (${failures.length})\n\n`
		: "No individual URL failures were recorded. Check the failed steps and workflow logs below.\n";
	if (teams.size) {
		summary += `**Teams:** ${[...teams].sort().join(" ")}\n\n`;
	}
	for (const [index, failure] of failures.entries()) {
		// Leave room for links and step results within GitHub's issue body limit.
		if (summary.length + failure.length > 45000) {
			summary += `\n${failures.length - index} more failed links are listed in the Playwright report.\n`;
			break;
		}
		summary += failure + "\n";
	}
	if (report.errors?.length) {
		summary += "\n**Test runner errors:**\n";
		for (const error of report.errors.slice(0, 5)) {
			summary += `- ${escapeMarkdown((error.message ?? "Unknown error").split("\n")[0].slice(0, 1000))}\n`;
		}
	}
	return summary;
}

module.exports = async ({ github, context }) => {
	const marker = "<!-- sc-docs:external-link-check -->";
	const title = "External link check failed";
	const runUrl = `${process.env.GITHUB_SERVER_URL}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}/attempts/${process.env.GITHUB_RUN_ATTEMPT}`;
	const steps = JSON.parse(process.env.STEP_RESULTS);
	const results = Object.entries(steps)
		.map(([name, result]) => `| ${name} | ${result.outcome} |`)
		.join("\n");
	const body = [
		marker,
		"The weekly/manual external link check failed.",
		"",
		summarizeLinks(),
		"",
		"## Run details",
		"",
		`[Workflow run and logs](${runUrl})`,
		process.env.REPORT_URL
			? `[Download Playwright report](${process.env.REPORT_URL}) (retained for 14 days)`
			: "No report artifact is available; see the workflow logs.",
		"",
		"| Step | Result |",
		"| --- | --- |",
		results,
		"",
		"The report includes failed URLs, source pages, screenshots, and traces. A failure may indicate a broken link, an access/network error, or a build/setup problem. Review the logs before changing links.",
		"Close this issue after resolving the failures. Later failures are appended here while it remains open.",
	].join("\n");
	const issues = await github.paginate(github.rest.issues.listForRepo, {
		...context.repo,
		state: "open",
		creator: "github-actions[bot]",
		per_page: 100,
	});
	const existing = issues.find(
		(issue) => !issue.pull_request && issue.body?.includes(marker),
	);
	if (existing) {
		await github.rest.issues.createComment({
			...context.repo,
			issue_number: existing.number,
			body,
		});
	} else {
		await github.rest.issues.create({ ...context.repo, title, body });
	}
};
