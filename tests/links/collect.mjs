import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "parse5";

export function collectLinks(directory) {
	const links = new Map();
	let pages = 0;

	function visitDirectory(path) {
		for (const entry of readdirSync(path, { withFileTypes: true }).sort(
			(a, b) => a.name.localeCompare(b.name),
		)) {
			const file = join(path, entry.name);
			if (entry.isDirectory())
				visitDirectory(file);
			else if (entry.isFile() && entry.name.endsWith(".html")) {
				pages++;
				visitNode(parse(readFileSync(file, "utf8")), relative(directory, file));
			}
		}
	}

	function visitNode(node, source, inDocument = false) {
		const attrs = Object.fromEntries(
			(node.attrs ?? []).map(({ name, value }) => [name, value]),
		);
		inDocument ||=
			node.tagName === "article" &&
			(attrs.class ?? "").split(/\s+/).includes("doc");
		if (
			inDocument &&
			node.tagName === "a" &&
			/^(https?:\/\/|\/\/)/i.test(attrs.href ?? "")
		) {
			const url = new URL(attrs.href, "https://local.invalid");
			// Check document availability once; fragment targets are out of scope.
			url.hash = "";
			const key = url.href;
			if (!links.has(key)) links.set(key, new Set());
			links.get(key).add(source);
		}
		for (const child of node.childNodes ?? [])
			visitNode(child, source, inDocument);
	}

	visitDirectory(directory);
	if (!pages || !links.size)
		throw new Error(
			`No external documentation links found in ${directory}. Run npm run build first.`,
		);
	return links;
}
