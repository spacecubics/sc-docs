import { test } from "@playwright/test";
import { resolve } from "node:path";
import { collectLinks } from "./collect.mjs";
import { checkLink } from "./check.mjs";

const directory = resolve(process.env.LINK_CHECK_SITE_DIR ?? "build/site");
for (const [url, sources] of collectLinks(directory)) {
	test(url, async ({ page }, testInfo) => {
		testInfo.annotations.push(
			...[...sources].map((source) => ({
				type: "source",
				description: source,
			})),
		);
		await testInfo.attach("link-sources", {
			body: JSON.stringify({ url, sources: [...sources] }, null, 2),
			contentType: "application/json",
		});
		try {
			await checkLink(page, url);
		} catch (error) {
			throw new Error(
				`${error.message}\nLinked from:\n${[...sources].join("\n")}`,
				{ cause: error },
			);
		}
	});
}
