// Match error titles/headings, not arbitrary prose or code samples about errors.
const errorHeading =
	/^(?:(?:error\s*)?(?:404|410)(?:\s|$)|(?:(?:page|content|document)\s+)?not found\b|(?:page|content|document) (?:is )?(?:unavailable|not available)\b|access denied\b|forbidden\b|just a moment\b|ページが見つかりません)/i;
const htmlType = /\b(?:text\/html|application\/xhtml\+xml)\b/i;

export async function checkLink(
	page,
	url,
	{ settleMs = 5_000, renderTimeout = 25_000 } = {},
) {
	let documentResponse;
	const capture = (response) => {
		if (
			response.request().isNavigationRequest() &&
			response.frame() === page.mainFrame()
		) {
			documentResponse = response;
		}
	};
	page.on("response", capture);
	try {
		let response;
		try {
			response = await page.goto(url, { waitUntil: "domcontentloaded" });
		} catch (error) {
			// Chromium aborts navigation when a response starts a file download.
			// Headless Chromium also downloads inline PDFs without Content-Disposition.
			const headers = documentResponse?.headers() ?? {};
			const fileResponse =
				/attachment/i.test(headers["content-disposition"] ?? "") ||
				(headers["content-type"] && !htmlType.test(headers["content-type"]));
			if (
				!/download|ERR_ABORTED/i.test(error.message) ||
				!documentResponse?.ok() ||
				!fileResponse
			)
				throw error;
			return;
		}
		if (!response || !response.ok())
			throw new Error(
				`HTTP ${response?.status() ?? "no response"}: ${page.url()}`,
			);
		if (!htmlType.test(response.headers()["content-type"] ?? "")) return;

		if (new URL(page.url()).hostname === "docs.amd.com") {
			// AMD initially serves an empty application shell, including for missing docs.
			// Wait for its document-specific title; a shell that never loads must fail.
			await page.waitForFunction(
				() =>
					document.title.trim() &&
					document.title.trim() !== "AMD Technical Information Portal",
				null,
				{ timeout: renderTimeout },
			);
		}
		// Other sites can also replace their initial HTML asynchronously. This bounded
		// observation window deliberately avoids networkidle (analytics may never stop).
		await page.waitForTimeout(settleMs);
		// JavaScript or meta refresh may navigate after the initial response.
		response = documentResponse ?? response;
		if (!response.ok())
			throw new Error(`HTTP ${response.status()}: ${response.url()}`);
		if (!htmlType.test(response.headers()["content-type"] ?? "")) return;
		const title = await page.title();
		const headings = await page
			.locator('h1:visible, h2:visible, h3:visible, [role="heading"]:visible')
			.allTextContents();
		const error = [title, ...headings]
			.map((text) => text.replace(/\s+/g, " ").trim())
			.find((text) => errorHeading.test(text));
		if (error)
			throw new Error(
				`Error page (HTTP ${response.status()}): ${error} — ${page.url()}`,
			);
		const body = await page.locator("body").innerText();
		if (!body.trim()) throw new Error(`Empty HTML page: ${page.url()}`);
	} finally {
		page.off("response", capture);
	}
}
