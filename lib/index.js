import { execFile, spawn } from "node:child_process";
import { lstat, mkdtemp, open, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import z from "@deepseek-ai/schemastery";
//#region src/git-parse.ts
function parsePorcelainV1(raw) {
	if (raw === "") return [];
	const tokens = raw.split("\0");
	const entries = [];
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token === void 0 || token.length < 4 || token[2] !== " ") continue;
		const x = token[0];
		const y = token[1];
		const path = token.slice(3);
		if (x === "R" || x === "C") {
			const origPath = tokens[i + 1];
			i += 1;
			entries.push({
				x,
				y,
				path,
				origPath: origPath === "" ? void 0 : origPath
			});
		} else entries.push({
			x,
			y,
			path
		});
	}
	return entries;
}
function parseNumstatZ(raw) {
	if (raw === "") return [];
	const tokens = raw.split("\0");
	const rows = [];
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token === void 0 || token === "") continue;
		const firstTab = token.indexOf("	");
		const secondTab = firstTab === -1 ? -1 : token.indexOf("	", firstTab + 1);
		if (secondTab === -1) continue;
		const added = token.slice(0, firstTab);
		const deleted = token.slice(firstTab + 1, secondTab);
		const rest = token.slice(secondTab + 1);
		const counts = {
			added: added === "-" ? null : Number(added),
			deleted: deleted === "-" ? null : Number(deleted)
		};
		if (rest === "") {
			const origPath = tokens[i + 1];
			const path = tokens[i + 2];
			i += 2;
			if (path !== void 0 && path !== "") rows.push({
				...counts,
				path,
				origPath: origPath === "" ? void 0 : origPath
			});
		} else rows.push({
			...counts,
			path: rest
		});
	}
	return rows;
}
function numstatIndex(rows) {
	const index = new Map();
	for (const row of rows) index.set(row.path, row);
	return index;
}
function countOccurrences(haystack, needle) {
	if (needle === "") return 0;
	const lower = haystack.toLowerCase();
	const q = needle.toLowerCase();
	let count = 0;
	let at = lower.indexOf(q);
	while (at !== -1) {
		count += 1;
		at = lower.indexOf(q, at + q.length);
	}
	return count;
}
function isPathologicalRegex(source) {
	const stripped = source.replace(/\\./g, "").replace(/\[([^\]\\]|\\.)*\]/g, "");
	return /\([^()]*[+*{][^()]*\)[+*?{]/.test(stripped) || /\([^()]*\|[^()]*\)[+*?{]/.test(stripped);
}
function countMatches(haystack, needle, options = {}) {
	if (needle === "") return 0;
	if (options.regex === true) {
		if (isPathologicalRegex(needle)) return countMatches(haystack, needle, {
			...options,
			regex: false
		});
		try {
			const re = new RegExp(needle, options.caseSensitive ? "g" : "gi");
			let count = 0;
			let match;
			while ((match = re.exec(haystack)) !== null) {
				count += 1;
				if (match.index === re.lastIndex) re.lastIndex += 1;
			}
			return count;
		} catch {
			return 0;
		}
	}
	if (options.caseSensitive) {
		let count = 0;
		let at = haystack.indexOf(needle);
		while (at !== -1) {
			count += 1;
			at = haystack.indexOf(needle, at + needle.length);
		}
		return count;
	}
	return countOccurrences(haystack, needle);
}
function normalizeBaseRef(value) {
	if (typeof value !== "string") return null;
	const ref = value.trim();
	if (ref === "" || ref.length > 256) return null;
	if (ref.startsWith("-") || ref.includes("..") || ref.includes("@{")) return null;
	if (/[\s~^:?*\[\\{}]/.test(ref)) return null;
	if (/[\0-\x1f\x7f]/.test(ref)) return null;
	return ref;
}
const EMPTY_TREE_ID = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
function refRange(baseCommit, targetCommit) {
	return baseCommit === "4b825dc642cb6eb9a060e54bf8d69288fbee4904" ? [baseCommit, targetCommit] : [baseCommit + "..." + targetCommit];
}
function mergeDiffRows(rows, numstat) {
	return rows.map((row) => {
		const stat = numstat.get(row.path);
		const added = stat?.added ?? 0;
		const deleted = stat?.deleted ?? 0;
		return {
			path: row.path,
			origPath: row.origPath,
			x: row.letter,
			y: " ",
			added: Number.isFinite(added) ? added : 0,
			deleted: Number.isFinite(deleted) ? deleted : 0,
			binary: stat !== void 0 && (stat.added === null || stat.deleted === null),
			untracked: false
		};
	});
}
function parseNameStatusZ(raw) {
	if (raw === "") return [];
	const tokens = raw.split("\0");
	const rows = [];
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token === void 0 || token === "") continue;
		const letter = token[0];
		const score = token.length > 1 ? token.slice(1) : void 0;
		const firstPath = tokens[i + 1];
		if (firstPath === void 0 || firstPath === "") continue;
		if (letter === "R" || letter === "C") {
			const newPath = tokens[i + 2];
			i += 2;
			if (newPath !== void 0 && newPath !== "") rows.push(score === void 0 ? {
				letter,
				path: newPath,
				origPath: firstPath
			} : {
				letter,
				score,
				path: newPath,
				origPath: firstPath
			});
		} else {
			i += 1;
			rows.push(score === void 0 ? {
				letter,
				path: firstPath
			} : {
				letter,
				score,
				path: firstPath
			});
		}
	}
	return rows;
}
function parseDecorations(raw) {
	const out = [];
	for (const piece of raw.split(",")) {
		const item = piece.trim();
		if (item === "") continue;
		if (item.startsWith("HEAD -> ")) {
			out.push({
				name: "HEAD",
				kind: "head"
			});
			out.push({
				name: item.slice(8),
				kind: "head"
			});
		} else if (item.startsWith("tag: ")) out.push({
			name: item.slice(5),
			kind: "tag"
		});
		else out.push({
			name: item,
			kind: "other"
		});
	}
	return out;
}
const HASH_RE = /^[0-9a-f]{40}$/;
function parseBlamePorcelain(raw) {
	const rows = [];
	const meta = new Map();
	const HEADER = /^([0-9a-f]{40}) (\d+) (\d+)(?: \d+)?$/;
	let current = null;
	const flush = () => {
		if (current === null) return;
		const cached = meta.get(current.hash) ?? {
			author: "",
			timestamp: 0,
			summary: ""
		};
		rows.push({
			hash: current.hash,
			origLine: current.origLine,
			finalLine: current.finalLine,
			author: cached.author,
			timestamp: cached.timestamp,
			summary: cached.summary
		});
		current = null;
	};
	for (const line of raw.split("\n")) {
		if (line === "") continue;
		if (line.startsWith("	")) {
			flush();
			continue;
		}
		const header = HEADER.exec(line);
		if (header !== null) {
			flush();
			current = {
				hash: header[1],
				origLine: Number(header[2]),
				finalLine: Number(header[3])
			};
			continue;
		}
		if (current === null) continue;
		const cached = meta.get(current.hash) ?? {
			author: "",
			timestamp: 0,
			summary: ""
		};
		if (line.startsWith("author ")) cached.author = line.slice(7);
		else if (line.startsWith("author-time ")) {
			const t = Number(line.slice(12));
			cached.timestamp = Number.isFinite(t) ? t : 0;
		} else if (line.startsWith("summary ")) cached.summary = line.slice(8);
		else continue;
		meta.set(current.hash, cached);
	}
	flush();
	return rows;
}
function parseLogLines(raw) {
	const out = [];
	for (const record of raw.split("")) {
		if (record.trim() === "") continue;
		const fields = record.split("");
		if (fields.length < 6) continue;
		const hash = fields[0].trim();
		if (!HASH_RE.test(hash)) continue;
		const parentField = fields[1].trim();
		const timestamp = Number(fields[3].trim());
		out.push({
			hash,
			parents: parentField === "" ? [] : parentField.split(" "),
			authorName: fields[2],
			timestamp: Number.isFinite(timestamp) ? timestamp : 0,
			refs: parseDecorations(fields[4]),
			subject: (fields[5] ?? "").trim(),
			body: fields.slice(6).join("").trim()
		});
	}
	return out;
}
function parseStashLines(raw) {
	const out = [];
	for (const record of raw.split("")) {
		if (record.trim() === "") continue;
		const fields = record.split("");
		if (fields.length < 3) continue;
		const selector = fields[0].trim();
		const match = /^stash@\{(\d+)\}$/.exec(selector);
		if (match === null) continue;
		const timestamp = Number(fields[1].trim());
		out.push({
			index: Number(match[1]),
			timestamp: Number.isFinite(timestamp) ? timestamp : 0,
			subject: fields.slice(2).join("").trim()
		});
	}
	return out;
}
function splitDiffSections(diffText) {
	const sections = [];
	let current = null;
	const flush = () => {
		if (current !== null) sections.push({
			path: current.path,
			body: current.body
		});
		current = null;
	};
	for (const line of diffText.split("\n")) {
		if (line.startsWith("diff --git ")) {
			flush();
			current = {
				path: null,
				body: "",
				started: false
			};
			continue;
		}
		if (current === null) continue;
		if (!current.started) {
			if (line.startsWith("+++ ")) {
				const field = line.slice(4).trim();
				if (field !== "/dev/null") current.path = field.startsWith("b/") ? field.slice(2) : field;
			} else if (line.startsWith("--- ") && current.path === null) {
				const field = line.slice(4).trim();
				if (field !== "/dev/null") current.path = field.startsWith("a/") ? field.slice(2) : field;
			} else if (line.startsWith("@@")) {
				current.started = true;
				current.body = line + "\n";
			}
			continue;
		}
		current.body += line + "\n";
	}
	flush();
	return sections;
}
function mergeStatus(entries, numstat, untrackedCounts = new Map()) {
	return entries.map((entry) => {
		const untracked = entry.x === "?";
		const row = numstat.get(entry.path);
		const counted = untrackedCounts.get(entry.path);
		const binary = untracked ? counted?.binary === true : row !== void 0 && (row.added === null || row.deleted === null);
		const added = untracked ? counted?.added ?? 0 : row?.added ?? 0;
		const deleted = untracked ? 0 : row?.deleted ?? 0;
		return {
			path: entry.path,
			origPath: entry.origPath,
			x: entry.x,
			y: entry.y,
			added: Number.isFinite(added) ? added : 0,
			deleted: Number.isFinite(deleted) ? deleted : 0,
			binary,
			untracked
		};
	});
}
function sniffPreviewMime(bytes) {
	const ascii = (at, text) => {
		if (at + text.length > bytes.length) return false;
		for (let k = 0; k < text.length; k++) if (bytes[at + k] !== text.charCodeAt(k)) return false;
		return true;
	};
	if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) return "image/png";
	if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
	if (bytes.length >= 6 && (ascii(0, "GIF87a") || ascii(0, "GIF89a"))) return "image/gif";
	if (bytes.length >= 12 && ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
	if (bytes.length >= 2 && bytes[0] === 66 && bytes[1] === 77) return "image/bmp";
	if (bytes.length >= 12 && ascii(4, "ftyp") && ascii(8, "avif")) return "image/avif";
	if (bytes.length >= 4 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) return "image/x-icon";
	if (bytes.length >= 5 && ascii(0, "%PDF-")) return "application/pdf";
	for (let n = 0; n < bytes.length; n++) if (bytes[n] === 0) return null;
	let at = 0;
	while (at < bytes.length && (bytes[at] === 32 || bytes[at] === 9 || bytes[at] === 10 || bytes[at] === 13)) at += 1;
	for (let prolog = 0; prolog < 16; prolog++) {
		if (ascii(at, "<!--")) {
			at += 4;
			while (at < bytes.length && !ascii(at, "-->")) at += 1;
			at = Math.min(bytes.length, at + 3);
		} else if (ascii(at, "<!") || ascii(at, "<?")) {
			while (at < bytes.length && bytes[at] !== 62) at += 1;
			at += 1;
		} else break;
		while (at < bytes.length && (bytes[at] === 32 || bytes[at] === 9 || bytes[at] === 10 || bytes[at] === 13)) at += 1;
	}
	if (ascii(at, "<svg") && (at + 4 >= bytes.length || [
		32,
		9,
		10,
		13,
		62,
		47
	].includes(bytes[at + 4]))) return "image/svg+xml";
	return null;
}
//#endregion
//#region src/settings-schema.ts
const SETTINGS_NAMESPACE = "dsh-git-review";
const ReviewSettingsSchema = z.object({
	viewMode: z.union(["split", "unified"]).default("split").loose(),
	searchScope: z.union([
		"diff",
		"content",
		"path"
	]).default("diff").loose(),
	graphCollapsed: z.boolean().default(false),
	searchCS: z.boolean().default(false),
	searchRegex: z.boolean().default(false),
	wsIgnore: z.boolean().default(false),
	syntaxHighlight: z.boolean().default(true)
});
function installSettings(ctx) {
	ctx.inject(["settings"], (sctx) => {
		sctx.settings.register(SETTINGS_NAMESPACE, ReviewSettingsSchema);
	});
}
//#endregion
//#region src/index.ts
const HASH_ONLY_RE = /^[0-9a-f]{40}$/;
const name = "dsh-git-review";
const inject = [];
const API_PREFIX = "/dsh-git-review/api";
const BODY_CAP = 65536;
const GIT_TIMEOUT_MS = 3e4;
const GIT_MAX_BUFFER = 67108864;
const DIFF_CAP = 2097152;
const STREAM_CAP = 8388608;
const READ_CAP = 524288;
const PREVIEW_CAP = 8388608;
const BLOB_HASH_CAP = 200;
const GIT_ENV_STRIP_EXACT = new Set([
	"GIT_DIR",
	"GIT_WORK_TREE",
	"GIT_INDEX_FILE",
	"GIT_OBJECT_DIRECTORY",
	"GIT_COMMON_DIR",
	"GIT_CONFIG_COUNT",
	"GIT_CONFIG_PARAMETERS",
	"GIT_PAGER",
	"GIT_SEQUENCE_EDITOR"
]);
const GIT_ENV_STRIP_PREFIX = "GIT_CONFIG_KEY_";
function gitEnv() {
	const env = {};
	for (const [key, value] of Object.entries(process.env)) {
		if (value === void 0 || GIT_ENV_STRIP_EXACT.has(key) || key.startsWith(GIT_ENV_STRIP_PREFIX)) continue;
		env[key] = value;
	}
	env["GIT_EDITOR"] = "true";
	env["GIT_SEQUENCE_EDITOR"] = "true";
	env["GIT_PAGER"] = "cat";
	return env;
}
function runGit(root, args) {
	return new Promise((resolvePromise, rejectPromise) => {
		execFile("git", [
			"-C",
			root,
			"--no-optional-locks",
			"-c",
			"core.quotepath=false",
			...args
		], {
			timeout: GIT_TIMEOUT_MS,
			maxBuffer: GIT_MAX_BUFFER,
			windowsHide: true,
			encoding: "utf8",
			env: gitEnv()
		}, (error, stdout, stderr) => {
			if (error !== null) {
				const detail = stderr.trim() || String(error.message ?? error);
				rejectPromise(new Error("git " + args[0] + " failed: " + detail));
			} else resolvePromise(stdout);
		});
	});
}
function inside(root, candidate) {
	const child = relative(root, candidate);
	return child === "" || child !== ".." && !child.startsWith("../") && !child.startsWith("..\\") && !isAbsolute(child);
}
async function resolveRepository(cwd) {
	let workspace;
	try {
		workspace = await realpath(cwd);
	} catch {
		return null;
	}
	try {
		return (await runGit(workspace, ["rev-parse", "--show-toplevel"])).trim() || null;
	} catch {
		return null;
	}
}
async function resolveRangeRef(repoRoot, ref) {
	if (ref === "4b825dc642cb6eb9a060e54bf8d69288fbee4904") return ref;
	try {
		const commit = (await runGit(repoRoot, [
			"rev-parse",
			"--verify",
			"--end-of-options",
			ref + "^{commit}"
		])).trim();
		return commit === "" ? null : commit;
	} catch {
		return null;
	}
}
function fenceRepoPath(repoRoot, requestedPath) {
	if (typeof requestedPath !== "string" || requestedPath === "") throw new Error("path is required");
	const candidate = resolve(repoRoot, requestedPath);
	if (!inside(repoRoot, candidate) || candidate === repoRoot) throw new Error("path is outside the repository");
	return candidate;
}
async function resolveWorkspace(cwd) {
	try {
		return await realpath(cwd);
	} catch {
		return null;
	}
}
function fenceWorkspacePath(workspaceRoot, requestedPath) {
	if (typeof requestedPath !== "string" || requestedPath === "") throw new Error("path is required");
	const candidate = resolve(workspaceRoot, requestedPath);
	if (!inside(workspaceRoot, candidate) || candidate === workspaceRoot) throw new Error("path is outside the workspace");
	return candidate;
}
function fenceWorkspaceDir(workspaceRoot, requestedPath) {
	const rel = typeof requestedPath === "string" && requestedPath !== "" ? requestedPath : ".";
	if (rel === "." || rel === "./") return workspaceRoot;
	const candidate = resolve(workspaceRoot, rel);
	if (!inside(workspaceRoot, candidate)) throw new Error("path is outside the workspace");
	return candidate;
}
async function diffBase(repoRoot) {
	try {
		return {
			base: (await runGit(repoRoot, [
				"rev-parse",
				"--verify",
				"HEAD"
			])).trim(),
			unbornHead: false
		};
	} catch {
		return {
			base: EMPTY_TREE_ID,
			unbornHead: true
		};
	}
}
async function readPrefix(absPath, maxBytes) {
	const handle = await open(absPath, "r");
	if (!(await handle.stat()).isFile()) {
		await handle.close();
		throw new Error("not a regular file");
	}
	try {
		const buf = Buffer.alloc(maxBytes);
		const { bytesRead } = await handle.read(buf, 0, maxBytes, 0);
		return {
			bytes: buf.subarray(0, bytesRead),
			truncated: bytesRead === maxBytes
		};
	} finally {
		await handle.close();
	}
}
const PROBE_EXACT_CAP = 8388608;
const PROBE_BUDGET_CAP = 33554432;
const PROBE_CHUNK = 65536;
async function scanLineCount(absPath, size, maxBytes) {
	const handle = await open(absPath, "r");
	if (!(await handle.stat()).isFile()) {
		await handle.close();
		throw new Error("not a regular file");
	}
	try {
		const buf = Buffer.alloc(PROBE_CHUNK);
		let pos = 0;
		let read = 0;
		let added = 0;
		let last = -1;
		let binary = false;
		while (pos < size && read < maxBytes) {
			const want = Math.min(buf.length, size - pos, maxBytes - read);
			const { bytesRead } = await handle.read(buf, 0, want, pos);
			if (bytesRead === 0) break;
			const slice = buf.subarray(0, bytesRead);
			if (slice.includes(0)) {
				binary = true;
				read += bytesRead;
				break;
			}
			for (let i = 0; i < bytesRead; i++) if (slice[i] === 10) added += 1;
			last = slice[bytesRead - 1];
			pos += bytesRead;
			read += bytesRead;
		}
		if (!binary && pos >= size && size > 0 && last !== 10) added += 1;
		return {
			added: binary ? 0 : added,
			binary,
			scanned: read
		};
	} finally {
		await handle.close();
	}
}
async function probeUntracked(repoRoot, relPath, budget) {
	const absPath = resolve(repoRoot, relPath);
	if (!inside(repoRoot, absPath)) return null;
	let size;
	try {
		const stat = await lstat(absPath);
		if (!stat.isFile()) return null;
		size = stat.size;
	} catch {
		return null;
	}
	try {
		if (size <= READ_CAP) {
			const { bytes } = await readPrefix(absPath, READ_CAP);
			if (bytes.includes(0)) return {
				added: 0,
				binary: true
			};
			let added = 0;
			for (let at = bytes.indexOf(10); at !== -1; at = bytes.indexOf(10, at + 1)) added += 1;
			if (bytes.length > 0 && bytes[bytes.length - 1] !== 10) added += 1;
			return {
				added,
				binary: false
			};
		}
		const allowance = Math.min(size, PROBE_EXACT_CAP, budget.remaining);
		if (allowance <= READ_CAP) {
			const { bytes } = await readPrefix(absPath, READ_CAP);
			if (bytes.includes(0)) return {
				added: 0,
				binary: true
			};
			let added = 0;
			for (let at = bytes.indexOf(10); at !== -1; at = bytes.indexOf(10, at + 1)) added += 1;
			if (bytes.length > 0 && bytes[bytes.length - 1] !== 10) added += 1;
			return {
				added,
				binary: false
			};
		}
		const counted = await scanLineCount(absPath, size, allowance);
		budget.remaining -= counted.scanned;
		return {
			added: counted.added,
			binary: counted.binary
		};
	} catch {
		return null;
	}
}
async function untrackedPseudoDiff(repoRoot, relPath) {
	const absPath = resolve(repoRoot, relPath);
	if (!inside(repoRoot, absPath)) return null;
	let size;
	try {
		const stat = await lstat(absPath);
		if (!stat.isFile()) return null;
		size = stat.size;
	} catch {
		return null;
	}
	let bytes;
	try {
		bytes = (await readPrefix(absPath, READ_CAP)).bytes;
	} catch {
		return null;
	}
	if (bytes.includes(0)) return {
		ok: true,
		binary: true,
		diff: "",
		truncated: false,
		size
	};
	let text = bytes.toString("utf8");
	const truncated = text.length > 0 && size > READ_CAP;
	const lines = text.split("\n");
	if (lines[lines.length - 1] === "") lines.pop();
	const header = [
		"diff --git a/" + relPath + " b/" + relPath,
		"--- /dev/null",
		"+++ b/" + relPath
	];
	if (lines.length === 0) return {
		ok: true,
		binary: false,
		diff: header.join("\n"),
		truncated: false
	};
	header.push("@@ -0,0 +1," + lines.length + " @@");
	text = header.concat(lines.map((line) => "+" + line)).join("\n");
	return {
		ok: true,
		binary: false,
		diff: text,
		truncated
	};
}
function diffSaysBinary(diffText) {
	const head = diffText.slice(0, diffText.indexOf("@@") === -1 ? diffText.length : diffText.indexOf("@@"));
	return head.includes("\nBinary files ") || head.startsWith("Binary files ") || head.includes("\nGIT binary patch");
}
function cutZ(out, cut) {
	if (!cut) return out;
	const at = out.lastIndexOf("\0");
	return at === -1 ? "" : out.slice(0, at + 1);
}
function capDiff(diffText) {
	if (diffText.length <= DIFF_CAP) return {
		diff: diffText,
		truncated: false
	};
	const cut = diffText.lastIndexOf("\n", DIFF_CAP);
	return {
		diff: cut === -1 ? diffText.slice(0, DIFF_CAP) : diffText.slice(0, cut),
		truncated: true
	};
}
async function mapLimit(items, limit, fn) {
	const out = new Array(items.length);
	let next = 0;
	const workers = new Array(Math.min(Math.max(limit, 1), items.length)).fill(null).map(async () => {
		for (;;) {
			const i = next++;
			if (i >= items.length) return;
			out[i] = await fn(items[i], i);
		}
	});
	await Promise.all(workers);
	return out;
}
async function detectInProgress(repoRoot) {
	return (await Promise.all([
		["merge", "MERGE_HEAD"],
		["rebase", "REBASE_HEAD"],
		["cherry-pick", "CHERRY_PICK_HEAD"],
		["revert", "REVERT_HEAD"]
	].map(async ([kind, marker]) => {
		try {
			await runGit(repoRoot, [
				"rev-parse",
				"-q",
				"--verify",
				marker
			]);
			return kind;
		} catch {
			return null;
		}
	}))).find((kind) => kind !== null) ?? null;
}
const WS_FLAG = ["--ignore-all-space"];
async function gitStatus(cwd, base, target, ws) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) {
		const workspaceRoot = await resolveWorkspace(cwd);
		return {
			ok: false,
			isRepository: false,
			error: "not a git repository (or git is unavailable)",
			...workspaceRoot !== null ? { cwdRoot: workspaceRoot } : {}
		};
	}
	const baseRef = normalizeBaseRef(base);
	const targetRef = normalizeBaseRef(target);
	if (targetRef !== null) {
		const startRef = baseRef ?? "HEAD";
		const [branchRaw, baseCommit, targetCommit] = await Promise.all([
			runGit(repoRoot, [
				"rev-parse",
				"--abbrev-ref",
				"HEAD"
			]).catch(() => ""),
			resolveRangeRef(repoRoot, startRef),
			resolveRangeRef(repoRoot, targetRef)
		]);
		if (baseCommit === null || targetCommit === null) return {
			ok: false,
			isRepository: true,
			error: "cannot resolve diff range: " + startRef + "..." + targetRef
		};
		const range = refRange(baseCommit, targetCommit);
		const wsFlags = ws === true ? WS_FLAG : [];
		const [numstatRaw, nameStatusRaw] = await Promise.all([runGit(repoRoot, [
			"diff",
			"--numstat",
			"-z",
			"--no-color",
			"-M",
			...wsFlags,
			...range
		]), runGit(repoRoot, [
			"diff",
			"--name-status",
			"-z",
			"--no-color",
			"-M",
			...wsFlags,
			...range
		])]);
		const files = mergeDiffRows(parseNameStatusZ(nameStatusRaw), numstatIndex(parseNumstatZ(numstatRaw)));
		let added = 0;
		let deleted = 0;
		for (const file of files) {
			added += file.added;
			deleted += file.deleted;
		}
		const branch = branchRaw.trim();
		return {
			ok: true,
			root: repoRoot,
			branch: branch === "" ? null : branch,
			base: baseCommit,
			unbornHead: false,
			baseRef: startRef,
			files,
			totals: {
				added,
				deleted
			}
		};
	}
	const { base: headCommit, unbornHead } = await diffBase(repoRoot);
	const overrideCommit = baseRef === null ? null : await resolveRangeRef(repoRoot, baseRef).then((commit) => commit !== null && commit !== headCommit && commit !== "4b825dc642cb6eb9a060e54bf8d69288fbee4904" ? commit : null);
	const wsFlags = ws === true ? WS_FLAG : [];
	const [branchRaw, porcelainOut, numstatOut, nameStatusRaw, inProgress] = await Promise.all([
		runGit(repoRoot, [
			"rev-parse",
			"--abbrev-ref",
			"HEAD"
		]).catch(() => ""),
		runGitStreamed(repoRoot, [
			"status",
			"--porcelain=v1",
			"-z",
			"--untracked-files=all"
		]),
		overrideCommit !== null ? runGitStreamed(repoRoot, [
			"diff",
			"--numstat",
			"-z",
			"--no-color",
			"-M",
			...wsFlags,
			overrideCommit
		]) : runGitStreamed(repoRoot, [
			"diff",
			"--numstat",
			"-z",
			"--no-color",
			"-M",
			...wsFlags,
			unbornHead ? EMPTY_TREE_ID : "HEAD"
		]),
		overrideCommit !== null ? runGit(repoRoot, [
			"diff",
			"--name-status",
			"-z",
			"--no-color",
			"-M",
			...wsFlags,
			overrideCommit
		]) : Promise.resolve(""),
		detectInProgress(repoRoot)
	]);
	if (porcelainOut.code !== 0) throw new Error("git status failed: " + (porcelainOut.stderr.trim() || porcelainOut.stdout.trim()));
	if (numstatOut.code !== 0) throw new Error("git diff --numstat failed: " + (numstatOut.stderr.trim() || numstatOut.stdout.trim()));
	const statusCut = porcelainOut.truncated || numstatOut.truncated;
	const porcelainRaw = cutZ(porcelainOut.stdout, porcelainOut.truncated);
	const numstatRaw = cutZ(numstatOut.stdout, numstatOut.truncated);
	const porcelainEntries = parsePorcelainV1(porcelainRaw);
	const numstat = numstatIndex(parseNumstatZ(numstatRaw));
	const finalEntries = overrideCommit !== null ? [...parseNameStatusZ(nameStatusRaw).map((row) => ({
		x: row.letter,
		y: " ",
		path: row.path,
		origPath: row.origPath
	})), ...porcelainEntries.filter((entry) => entry.x === "?")] : porcelainEntries;
	const untrackedCounts = new Map();
	const untrackedBudget = { remaining: PROBE_BUDGET_CAP };
	await mapLimit(finalEntries.filter((entry) => entry.x === "?").map((entry) => entry.path), 8, async (relPath) => {
		const probe = await probeUntracked(repoRoot, relPath, untrackedBudget);
		if (probe !== null) untrackedCounts.set(relPath, probe);
	});
	const files = mergeStatus(finalEntries, numstat, untrackedCounts);
	const hashable = [];
	let hashArgBytes = 0;
	for (const entry of finalEntries) {
		if (hashable.length >= BLOB_HASH_CAP) break;
		if (entry.x === "D" || entry.y === "D") continue;
		hashArgBytes += Buffer.byteLength(entry.path, "utf8") + 1;
		if (hashArgBytes > 16384) break;
		hashable.push(entry.path);
	}
	if (hashable.length > 0) try {
		const hashes = (await runGit(repoRoot, [
			"hash-object",
			"--",
			...hashable
		])).split("\n").filter((line) => line !== "");
		const blobByPath = new Map();
		for (let i = 0; i < hashable.length && i < hashes.length; i++) if (HASH_ONLY_RE.test(hashes[i])) blobByPath.set(hashable[i], hashes[i]);
		for (const file of files) {
			const blob = blobByPath.get(file.path);
			if (blob !== void 0) file.blob = blob;
		}
	} catch {}
	let added = 0;
	let deleted = 0;
	for (const file of files) {
		added += file.added;
		deleted += file.deleted;
	}
	const branch = branchRaw.trim();
	let ahead;
	let behind;
	if (!unbornHead) try {
		const counts = (await runGit(repoRoot, [
			"rev-list",
			"--left-right",
			"--count",
			"HEAD...@{upstream}"
		])).trim().split(/\s+/);
		const parsedAhead = Number(counts[0]);
		const parsedBehind = Number(counts[1]);
		if (Number.isFinite(parsedAhead) && Number.isFinite(parsedBehind)) {
			ahead = parsedAhead;
			behind = parsedBehind;
		}
	} catch {}
	return {
		ok: true,
		root: repoRoot,
		branch: branch === "" ? null : branch,
		base: overrideCommit ?? headCommit,
		unbornHead,
		baseRef: overrideCommit !== null ? baseRef : null,
		files,
		totals: {
			added,
			deleted
		},
		ahead,
		behind,
		inProgress,
		truncated: statusCut
	};
}
function asScope(value) {
	return value === "staged" || value === "unstaged" ? value : "all";
}
async function gitFileDiff(cwd, path, untracked, full, origPath, scope, base, target, ws) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const absPath = fenceRepoPath(repoRoot, typeof path === "string" ? path : "");
	const relPath = relative(repoRoot, absPath).replaceAll("\\", "/");
	const pathspecs = [relPath];
	if (typeof origPath === "string" && origPath !== "") {
		const relOrig = relative(repoRoot, fenceRepoPath(repoRoot, origPath)).replaceAll("\\", "/");
		if (relOrig !== relPath) pathspecs.unshift(relOrig);
	}
	const context = full === true ? 1e5 : 3;
	const targetRef = normalizeBaseRef(target);
	const wsFlags = ws === true ? WS_FLAG : [];
	if (targetRef !== null) {
		const baseCommit = await resolveRangeRef(repoRoot, normalizeBaseRef(base) ?? "HEAD");
		const targetCommit = await resolveRangeRef(repoRoot, targetRef);
		if (baseCommit === null || targetCommit === null) throw new Error("cannot resolve diff range refs");
		const diffText = await runGit(repoRoot, [
			"diff",
			"--no-color",
			"-M",
			"--no-ext-diff",
			"--unified=" + String(context),
			...wsFlags,
			...refRange(baseCommit, targetCommit),
			"--",
			...pathspecs
		]);
		if (diffText === "") return {
			ok: true,
			binary: false,
			diff: "",
			truncated: false
		};
		if (diffSaysBinary(diffText)) {
			let size = 0;
			try {
				size = (await lstat(absPath)).size;
			} catch {}
			return {
				ok: true,
				binary: true,
				diff: "",
				truncated: false,
				size
			};
		}
		const capped = capDiff(diffText);
		return {
			ok: true,
			binary: false,
			diff: capped.diff,
			truncated: capped.truncated
		};
	}
	if (untracked === true) {
		if (!await runGit(repoRoot, [
			"ls-files",
			"--error-unmatch",
			"--",
			relPath
		]).then(() => true).catch(() => false)) {
			const pseudo = await untrackedPseudoDiff(repoRoot, relPath);
			if (pseudo !== null) return pseudo;
		}
	}
	const { base: headCommit } = await diffBase(repoRoot);
	const diffScope = asScope(scope);
	const baseRef = normalizeBaseRef(base);
	const requestedCommit = baseRef === null ? null : await resolveRangeRef(repoRoot, baseRef);
	const overrideCommit = requestedCommit !== null && requestedCommit !== headCommit ? requestedCommit : null;
	const usesRange = overrideCommit !== null || diffScope !== "unstaged";
	const rangeArg = overrideCommit ?? headCommit;
	const attempt = async (range) => {
		const streamed = await runGitStreamed(repoRoot, [
			"diff",
			...overrideCommit === null && diffScope === "staged" ? ["--cached"] : [],
			"--no-color",
			"-M",
			"--no-ext-diff",
			"--unified=" + String(context),
			...wsFlags,
			...usesRange ? [range] : [],
			"--",
			...pathspecs
		]);
		if (streamed.code !== 0) throw new Error("git diff failed: " + (streamed.stderr.trim() || streamed.stdout.trim()));
		return {
			text: streamed.stdout,
			streamedCut: streamed.truncated
		};
	};
	let diffText;
	let streamedCut = false;
	try {
		const first = await attempt(rangeArg);
		diffText = first.text;
		streamedCut = first.streamedCut;
	} catch (error) {
		if (!usesRange) throw error;
		if (typeof rangeArg !== "string" || !rangeArg.includes("4b825dc642cb6eb9a060e54bf8d69288fbee4904")) throw error;
		const fallback = await attempt("HEAD");
		diffText = fallback.text;
		streamedCut = fallback.streamedCut;
	}
	if (diffText === "") {
		if (diffScope !== "all" || overrideCommit !== null) return {
			ok: true,
			binary: false,
			diff: "",
			truncated: false
		};
		const pseudo = await untrackedPseudoDiff(repoRoot, relPath);
		if (pseudo !== null) return pseudo;
		return {
			ok: true,
			binary: false,
			diff: "",
			truncated: false
		};
	}
	if (diffSaysBinary(diffText)) {
		let size = 0;
		try {
			size = (await lstat(absPath)).size;
		} catch {}
		return {
			ok: true,
			binary: true,
			diff: "",
			truncated: false,
			size
		};
	}
	const capped = capDiff(diffText);
	return {
		ok: true,
		binary: false,
		diff: capped.diff,
		truncated: streamedCut || capped.truncated
	};
}
async function gitFileContent(cwd, path, ref) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) {
		if (typeof ref === "string" && ref !== "") throw new Error("not a git repository");
		const workspaceRoot = await resolveWorkspace(cwd);
		if (workspaceRoot === null) throw new Error("not a git repository");
		const absPath = fenceWorkspacePath(workspaceRoot, typeof path === "string" ? path : "");
		let size;
		try {
			const stat = await lstat(absPath);
			if (!stat.isFile()) throw new Error("not a regular file");
			size = stat.size;
		} catch (error) {
			throw new Error("cannot read file: " + String(error.message ?? error));
		}
		const { bytes } = await readPrefix(absPath, READ_CAP);
		const truncated = size > READ_CAP;
		if (bytes.includes(0)) return {
			ok: true,
			binary: true,
			content: "",
			truncated,
			size
		};
		return {
			ok: true,
			binary: false,
			content: bytes.toString("utf8"),
			truncated,
			size
		};
	}
	const absPath = fenceRepoPath(repoRoot, typeof path === "string" ? path : "");
	const relPath = relative(repoRoot, absPath).replaceAll("\\", "/");
	if (typeof ref === "string" && ref !== "") {
		const normalized = normalizeBaseRef(ref);
		if (normalized === null) throw new Error("invalid ref");
		const resolved = await resolveRangeRef(repoRoot, normalized);
		if (resolved === null || resolved === "4b825dc642cb6eb9a060e54bf8d69288fbee4904") throw new Error("cannot resolve ref");
		const spec = resolved + ":" + relPath;
		const size = Number((await runGit(repoRoot, [
			"cat-file",
			"-s",
			spec
		])).trim());
		if (!Number.isFinite(size)) throw new Error("cannot read file at ref");
		const streamed = await runGitBytes(repoRoot, [
			"cat-file",
			"-p",
			spec
		], READ_CAP);
		if (streamed.code !== 0) throw new Error("cannot read file at ref: " + (streamed.stderr.trim() || "git cat-file failed"));
		const truncated = size > READ_CAP || streamed.truncated;
		const bytes = streamed.data;
		if (bytes.includes(0)) return {
			ok: true,
			binary: true,
			content: "",
			truncated,
			size
		};
		return {
			ok: true,
			binary: false,
			content: bytes.toString("utf8"),
			truncated,
			size
		};
	}
	let size;
	try {
		const stat = await lstat(absPath);
		if (!stat.isFile()) throw new Error("not a regular file");
		size = stat.size;
	} catch (error) {
		throw new Error("cannot read file: " + String(error.message ?? error));
	}
	const { bytes } = await readPrefix(absPath, READ_CAP);
	const truncated = size > READ_CAP;
	if (bytes.includes(0)) return {
		ok: true,
		binary: true,
		content: "",
		truncated,
		size
	};
	return {
		ok: true,
		binary: false,
		content: bytes.toString("utf8"),
		truncated,
		size
	};
}
function runGitBytes(root, args, byteCap = PREVIEW_CAP, timeoutMs = GIT_TIMEOUT_MS) {
	return new Promise((resolvePromise) => {
		const child = spawn("git", [
			"-C",
			root,
			"--no-optional-locks",
			"-c",
			"core.quotepath=false",
			...args
		], {
			windowsHide: true,
			env: gitEnv(),
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		});
		const out = [];
		const err = [];
		let size = 0;
		let truncated = false;
		let timedOut = false;
		let settled = false;
		const timer = setTimeout(() => {
			if (!settled) {
				timedOut = true;
				truncated = true;
				try {
					child.kill();
				} catch {}
			}
		}, timeoutMs);
		child.stdout?.on("data", (chunk) => {
			size += chunk.length;
			if (size > byteCap && !truncated) {
				truncated = true;
				try {
					child.kill();
				} catch {}
				return;
			}
			if (!truncated) out.push(chunk);
		});
		child.stderr?.on("data", (chunk) => {
			if (err.length < 8) err.push(chunk);
		});
		child.once("error", () => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolvePromise({
				code: 1,
				data: Buffer.concat(out),
				stderr: Buffer.concat(err).toString("utf8"),
				truncated
			});
		});
		child.once("close", (code) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolvePromise({
				code: truncated && !timedOut ? 0 : code ?? 1,
				data: Buffer.concat(out),
				stderr: Buffer.concat(err).toString("utf8"),
				truncated
			});
		});
	});
}
function missingBytes() {
	return {
		data: Buffer.alloc(0),
		mime: null,
		size: 0,
		truncated: false,
		missing: true
	};
}
async function readPreviewBytes(cwd, path, ref, stage) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const wantIndex = stage === "index";
	const wantRef = typeof ref === "string" && ref !== "";
	if (wantIndex && wantRef) throw new Error("ref and stage are mutually exclusive");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) {
		if (wantRef || wantIndex) throw new Error("not a git repository");
		const workspaceRoot = await resolveWorkspace(cwd);
		if (workspaceRoot === null) throw new Error("not a git repository");
		const absPath = fenceWorkspacePath(workspaceRoot, typeof path === "string" ? path : "");
		let size;
		try {
			const stat = await lstat(absPath);
			if (!stat.isFile()) throw new Error("not a regular file");
			size = stat.size;
		} catch (error) {
			if (error.code === "ENOENT") return missingBytes();
			throw new Error("cannot read file: " + String(error.message ?? error));
		}
		const data = (await readPrefix(absPath, PREVIEW_CAP)).bytes;
		const truncated = size > PREVIEW_CAP;
		return {
			data,
			mime: sniffPreviewMime(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)),
			size,
			truncated,
			missing: false
		};
	}
	const absPath = fenceRepoPath(repoRoot, typeof path === "string" ? path : "");
	const relPath = relative(repoRoot, absPath).replaceAll("\\", "/");
	let data;
	let size;
	let truncated;
	if (wantIndex || wantRef) {
		let spec;
		if (wantIndex) spec = ":0:" + relPath;
		else {
			const normalized = normalizeBaseRef(ref);
			if (normalized === null) throw new Error("invalid ref");
			const resolved = await resolveRangeRef(repoRoot, normalized);
			if (resolved === null || resolved === "4b825dc642cb6eb9a060e54bf8d69288fbee4904") throw new Error("cannot resolve ref");
			spec = resolved + ":" + relPath;
		}
		if (!await runGit(repoRoot, [
			"cat-file",
			"-e",
			spec
		]).then(() => true).catch(() => false)) return missingBytes();
		size = Number((await runGit(repoRoot, [
			"cat-file",
			"-s",
			spec
		])).trim());
		if (!Number.isFinite(size)) throw new Error("cannot read file at ref");
		const streamed = await runGitBytes(repoRoot, [
			"cat-file",
			"-p",
			spec
		]);
		if (streamed.code !== 0) throw new Error("cannot read file at ref: " + (streamed.stderr.trim() || "git cat-file failed"));
		data = streamed.data;
		truncated = size > PREVIEW_CAP || streamed.truncated;
	} else {
		try {
			const stat = await lstat(absPath);
			if (!stat.isFile()) throw new Error("not a regular file");
			size = stat.size;
		} catch (error) {
			if (error.code === "ENOENT") return missingBytes();
			throw new Error("cannot read file: " + String(error.message ?? error));
		}
		data = (await readPrefix(absPath, PREVIEW_CAP)).bytes;
		truncated = size > PREVIEW_CAP;
	}
	const mime = sniffPreviewMime(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
	return {
		data,
		mime,
		size,
		truncated,
		missing: false
	};
}
async function gitFileBytes(cwd, path, ref, stage) {
	const { data, mime, size, truncated, missing } = await readPreviewBytes(cwd, path, ref, stage);
	if (missing) return {
		ok: true,
		base64: "",
		mime: "",
		size: 0,
		truncated: false,
		missing: true
	};
	if (mime === null) return {
		ok: false,
		error: "file is not previewable (unknown type)"
	};
	return {
		ok: true,
		base64: data.toString("base64"),
		mime,
		size,
		truncated,
		missing: false
	};
}
async function serveAsset(req, res) {
	if (req.method !== "GET") {
		respond(res, 405, {
			ok: false,
			error: "GET only"
		});
		return;
	}
	let params;
	try {
		params = new URL(req.url ?? "", "http://localhost").searchParams;
	} catch {
		respond(res, 400, {
			ok: false,
			error: "bad request"
		});
		return;
	}
	const cwd = params.get("cwd") ?? "";
	const path = params.get("path") ?? "";
	const ref = params.get("ref") ?? void 0;
	if (cwd === "" || path === "") {
		respond(res, 400, {
			ok: false,
			error: "cwd and path are required"
		});
		return;
	}
	let loaded;
	try {
		loaded = await readPreviewBytes(cwd, path, ref);
	} catch (error) {
		respond(res, 404, {
			ok: false,
			error: String(error.message ?? error)
		});
		return;
	}
	if (loaded.mime === null || !loaded.mime.startsWith("image/")) {
		respond(res, 404, {
			ok: false,
			error: "file is not a previewable image"
		});
		return;
	}
	if (loaded.truncated) {
		respond(res, 413, {
			ok: false,
			error: "file too large to preview"
		});
		return;
	}
	res.writeHead(200, {
		"content-type": loaded.mime,
		"content-length": loaded.data.length,
		"x-content-type-options": "nosniff",
		"content-security-policy": "sandbox",
		"cross-origin-resource-policy": "same-origin",
		"cache-control": "private, max-age=60"
	});
	res.end(loaded.data);
}
const BLAME_LINE_CAP = 2e4;
async function gitBlame(cwd, path, ref) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const relPath = relative(repoRoot, fenceRepoPath(repoRoot, typeof path === "string" ? path : "")).replaceAll("\\", "/");
	let rev = null;
	if (typeof ref === "string" && ref !== "") {
		const normalized = normalizeBaseRef(ref);
		if (normalized === null) throw new Error("invalid ref");
		rev = await resolveRangeRef(repoRoot, normalized);
		if (rev === null || rev === "4b825dc642cb6eb9a060e54bf8d69288fbee4904") throw new Error("cannot resolve ref");
	}
	const streamed = await runGitStreamed(repoRoot, [
		"blame",
		"--porcelain",
		...rev !== null ? [rev] : [],
		"--",
		relPath
	]);
	if (streamed.code !== 0) throw new Error("git blame failed: " + (streamed.stderr.trim() || streamed.stdout.trim()));
	const rows = parseBlamePorcelain(streamed.stdout);
	return {
		ok: true,
		lines: rows.slice(0, BLAME_LINE_CAP),
		truncated: streamed.truncated || rows.length > BLAME_LINE_CAP
	};
}
const FILE_HISTORY_CAP = 500;
async function gitFileHistory(cwd, path) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const relPath = relative(repoRoot, fenceRepoPath(repoRoot, typeof path === "string" ? path : "")).replaceAll("\\", "/");
	const streamed = await runGitStreamed(repoRoot, [
		"log",
		"--follow",
		"--date-order",
		"--max-count=" + String(FILE_HISTORY_CAP),
		"--format=%H%x1f%P%x1f%an%x1f%at%x1f%D%x1f%s%x1f%b%x1e",
		"--",
		relPath
	]);
	if (streamed.code !== 0) {
		if (/does not have any commits yet|bad revision/i.test(streamed.stderr + streamed.stdout)) return {
			ok: true,
			commits: [],
			truncated: false
		};
		throw new Error("git log failed: " + (streamed.stderr.trim() || streamed.stdout.trim()));
	}
	const commits = parseLogLines(streamed.truncated ? streamed.stdout.slice(0, streamed.stdout.lastIndexOf("") + 1) : streamed.stdout);
	return {
		ok: true,
		commits,
		truncated: streamed.truncated || commits.length > FILE_HISTORY_CAP
	};
}
const LIST_FILES_CAP = 2e4;
async function gitListFiles(cwd) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const [tracked, others] = await Promise.all([runGitStreamed(repoRoot, ["ls-files", "-z"]), runGitStreamed(repoRoot, [
		"ls-files",
		"-z",
		"--others",
		"--exclude-standard"
	])]);
	if (tracked.code !== 0) throw new Error("git ls-files failed: " + (tracked.stderr.trim() || tracked.stdout.trim()));
	if (others.code !== 0) throw new Error("git ls-files failed: " + (others.stderr.trim() || others.stdout.trim()));
	const tokens = (out, cut) => {
		const parts = out.split("\0");
		if (cut) parts.pop();
		return parts;
	};
	const files = new Set();
	for (const chunk of tokens(tracked.stdout, tracked.truncated)) if (chunk !== "") files.add(chunk);
	for (const chunk of tokens(others.stdout, others.truncated)) if (chunk !== "") files.add(chunk);
	const sorted = [...files].sort();
	return {
		ok: true,
		files: sorted.slice(0, LIST_FILES_CAP),
		truncated: tracked.truncated || others.truncated || sorted.length > LIST_FILES_CAP
	};
}
const FS_LIST_CAP = 5e3;
const FS_IGNORE_DIRS = new Set([
	".git",
	"node_modules",
	"target",
	"dist",
	"build",
	".next",
	"__pycache__"
]);
async function gitFsList(cwd, relPath) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const workspaceRoot = await resolveWorkspace(cwd);
	if (workspaceRoot === null) throw new Error("workspace not found");
	const absDir = fenceWorkspaceDir(workspaceRoot, relPath);
	let dirents;
	try {
		dirents = await readdir(absDir, { withFileTypes: true });
	} catch (error) {
		throw new Error("cannot list directory: " + String(error.message ?? error));
	}
	const relDir = relative(workspaceRoot, absDir).replaceAll("\\", "/");
	const normalizedDir = relDir === "" ? "." : relDir;
	const inIgnored = normalizedDir.split("/").some((segment) => FS_IGNORE_DIRS.has(segment));
	const entries = [];
	for (const entry of dirents) {
		if (entry.name === "." || entry.name === "..") continue;
		if (!inIgnored && FS_IGNORE_DIRS.has(entry.name)) continue;
		if (entry.isDirectory()) {
			const p = normalizedDir === "." ? entry.name : normalizedDir + "/" + entry.name;
			entries.push({
				path: p,
				name: entry.name,
				kind: "dir"
			});
		} else if (entry.isFile()) {
			const p = normalizedDir === "." ? entry.name : normalizedDir + "/" + entry.name;
			let size;
			try {
				size = (await lstat(join(absDir, entry.name))).size;
			} catch {
				size = void 0;
			}
			entries.push({
				path: p,
				name: entry.name,
				kind: "file",
				...size !== void 0 ? { size } : {}
			});
		}
	}
	entries.sort((a, b) => a.kind !== b.kind ? a.kind === "dir" ? -1 : 1 : a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
	const truncated = entries.length > FS_LIST_CAP;
	return {
		ok: true,
		root: workspaceRoot,
		path: normalizedDir,
		entries: entries.slice(0, FS_LIST_CAP),
		truncated
	};
}
async function gitInit(cwd, confirm) {
	if (confirm !== true) return {
		ok: false,
		error: "git init requires confirm: true"
	};
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const workspaceRoot = await resolveWorkspace(cwd);
	if (workspaceRoot === null) throw new Error("workspace not found");
	if (await resolveRepository(cwd) !== null) return {
		ok: true,
		output: ""
	};
	return await new Promise((resolvePromise) => {
		execFile("git", ["init"], {
			timeout: GIT_TIMEOUT_MS,
			maxBuffer: 1048576,
			windowsHide: true,
			cwd: workspaceRoot,
			env: gitEnv()
		}, (error, stdout, stderr) => {
			if (error !== null) resolvePromise({
				ok: false,
				error: stderr.trim() || String(error.message ?? error)
			});
			else resolvePromise({
				ok: true,
				output: stdout.trim()
			});
		});
	});
}
const SEARCH_UNTRACKED_CAP = 64;
const SEARCH_READ_CAP = 262144;
const REFS_CAP = 500;
async function gitRefs(cwd) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const raw = await runGit(repoRoot, [
		"for-each-ref",
		"--format=%(refname)",
		"refs/heads",
		"refs/remotes",
		"refs/tags"
	]);
	const refs = [];
	for (const refname of raw.split("\n")) {
		if (refname === "") continue;
		const entry = refname.startsWith("refs/heads/") ? {
			name: refname.slice(11),
			kind: "branch"
		} : refname.startsWith("refs/remotes/") ? {
			name: refname.slice(13),
			kind: "remote"
		} : refname.startsWith("refs/tags/") ? {
			name: refname.slice(10),
			kind: "tag"
		} : null;
		if (entry === null || entry.name === "" || entry.name.endsWith("/HEAD")) continue;
		refs.push(entry);
	}
	const order = {
		branch: 0,
		remote: 1,
		tag: 2
	};
	refs.sort((a, b) => order[a.kind] !== order[b.kind] ? order[a.kind] - order[b.kind] : a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
	return {
		ok: true,
		refs: refs.slice(0, REFS_CAP),
		truncated: refs.length > REFS_CAP
	};
}
const LOG_CAP = 500;
async function gitLog(cwd, limit, skip) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	let raw;
	const maxCount = typeof limit === "number" && Number.isFinite(limit) && limit >= 1 ? Math.min(Math.floor(limit), LOG_CAP) : LOG_CAP;
	const skipCount = typeof skip === "number" && Number.isFinite(skip) && skip >= 1 ? Math.min(Math.floor(skip), 1e5) : 0;
	{
		const streamed = await runGitStreamed(repoRoot, [
			"log",
			"--all",
			"--date-order",
			...skipCount > 0 ? ["--skip=" + String(skipCount)] : [],
			"--max-count=" + String(maxCount),
			"--format=%H%x1f%P%x1f%an%x1f%at%x1f%D%x1f%s%x1f%b%x1e"
		]);
		if (streamed.code !== 0) {
			if (/does not have any commits yet|bad revision/i.test(streamed.stderr + streamed.stdout)) return {
				ok: true,
				commits: [],
				truncated: false
			};
			throw new Error("git log failed: " + (streamed.stderr.trim() || streamed.stdout.trim()));
		}
		raw = streamed.stdout;
		const commits = parseLogLines(raw);
		return {
			ok: true,
			commits,
			truncated: streamed.truncated || commits.length > maxCount
		};
	}
}
async function gitCommitFiles(cwd, commit) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const hash = typeof commit === "string" ? commit.trim() : "";
	if (!HASH_ONLY_RE.test(hash)) throw new Error("commit id required");
	const parts = (await runGit(repoRoot, [
		"rev-list",
		"--parents",
		"-n",
		"1",
		hash
	])).trim().split(" ");
	if (parts[0] !== hash) throw new Error("commit not found");
	const range = refRange(parts.length > 1 && parts[1] !== void 0 ? parts[1] : EMPTY_TREE_ID, hash);
	const [numstatRaw, nameStatusRaw] = await Promise.all([runGit(repoRoot, [
		"diff",
		"--numstat",
		"-z",
		"--no-color",
		"-M",
		...range
	]), runGit(repoRoot, [
		"diff",
		"--name-status",
		"-z",
		"--no-color",
		"-M",
		...range
	])]);
	const files = mergeDiffRows(parseNameStatusZ(nameStatusRaw), numstatIndex(parseNumstatZ(numstatRaw)));
	let added = 0;
	let deleted = 0;
	for (const file of files) {
		added += file.added;
		deleted += file.deleted;
	}
	return {
		ok: true,
		files,
		totals: {
			added,
			deleted
		}
	};
}
const SEARCH_REGEX_CAP = 100;
function safeCount(haystack, needle, options) {
	if (options.regex && needle.length > 100) return countMatches(haystack, needle, {
		...options,
		regex: false
	});
	return countMatches(haystack, needle, options);
}
async function scanUntrackedMatches(repoRoot, counts, needle, options) {
	let untracked = [];
	try {
		untracked = parsePorcelainV1(await runGit(repoRoot, [
			"status",
			"--porcelain=v1",
			"-z",
			"--untracked-files=all"
		])).filter((entry) => entry.x === "?").map((entry) => entry.path);
	} catch {}
	let partial = untracked.length > SEARCH_UNTRACKED_CAP;
	await mapLimit(untracked.slice(0, SEARCH_UNTRACKED_CAP), 8, async (relPath) => {
		const absPath = resolve(repoRoot, relPath);
		if (!inside(repoRoot, absPath)) return;
		try {
			if (!(await lstat(absPath)).isFile()) return;
			const { bytes } = await readPrefix(absPath, SEARCH_READ_CAP);
			if (bytes.includes(0)) return;
			const count = safeCount(bytes.toString("utf8"), needle, options);
			if (count > 0) counts.set(relPath, (counts.get(relPath) ?? 0) + count);
		} catch {
			partial = true;
		}
	});
	return partial;
}
async function gitSearch(cwd, query, base, target, mode, cs, rx, ws = false) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	if (typeof query !== "string" || query.trim() === "") return {
		ok: true,
		matches: [],
		truncated: false
	};
	const needle = query.slice(0, 200);
	const options = {
		caseSensitive: cs === true,
		regex: rx === true
	};
	const wsFlags = ws === true ? WS_FLAG : [];
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const targetRef = normalizeBaseRef(target);
	if (mode === "content") {
		const grepArgs = [
			"grep",
			"-c",
			"-I",
			...options.caseSensitive ? [] : ["-i"],
			...options.regex ? ["-e", needle] : [
				"--fixed-strings",
				"-e",
				needle
			]
		];
		if (targetRef !== null) {
			const targetCommit = await resolveRangeRef(repoRoot, targetRef);
			if (targetCommit === null) throw new Error("cannot resolve diff range refs");
			const result = await runGitCapture(repoRoot, [...grepArgs, targetCommit]);
			if (result.code === 1) return {
				ok: true,
				matches: [],
				truncated: false
			};
			if (result.code !== 0) throw new Error(result.stderr.trim() || result.stdout.trim() || "git grep failed");
			return {
				ok: true,
				matches: parseGrepCounts(result.stdout, targetCommit).sort((a, b) => b.count - a.count),
				truncated: false
			};
		}
		const result = await runGitCapture(repoRoot, grepArgs);
		if (result.code !== 0 && result.code !== 1) throw new Error(result.stderr.trim() || result.stdout.trim() || "git grep failed");
		const counts = new Map(parseGrepCounts(result.stdout).map((match) => [match.path, match.count]));
		const truncated = await scanUntrackedMatches(repoRoot, counts, needle, options);
		return {
			ok: true,
			matches: [...counts.entries()].map(([path, count]) => ({
				path,
				count
			})).sort((a, b) => b.count - a.count),
			truncated
		};
	}
	let diffText;
	let refsMode = false;
	let searchCut = false;
	const streamDiff = async (args) => {
		const streamed = await runGitStreamed(repoRoot, args);
		if (streamed.code !== 0) throw new Error("git diff failed: " + (streamed.stderr.trim() || streamed.stdout.trim()));
		if (streamed.truncated) searchCut = true;
		return streamed.stdout;
	};
	if (targetRef !== null) {
		const baseCommit = await resolveRangeRef(repoRoot, normalizeBaseRef(base) ?? "HEAD");
		const targetCommit = await resolveRangeRef(repoRoot, targetRef);
		if (baseCommit === null || targetCommit === null) throw new Error("cannot resolve diff range refs");
		diffText = await streamDiff([
			"diff",
			"--no-color",
			"-M",
			"--no-ext-diff",
			...wsFlags,
			...refRange(baseCommit, targetCommit)
		]);
		refsMode = true;
	} else {
		const { base } = await diffBase(repoRoot);
		try {
			diffText = await streamDiff([
				"diff",
				"--no-color",
				"-M",
				"--no-ext-diff",
				...wsFlags,
				base
			]);
		} catch (error) {
			if (typeof base !== "string" || !base.includes("4b825dc642cb6eb9a060e54bf8d69288fbee4904")) throw error;
			diffText = await streamDiff([
				"diff",
				"--no-color",
				"-M",
				"--no-ext-diff",
				...wsFlags,
				"HEAD"
			]);
		}
	}
	const counts = new Map();
	for (const section of splitDiffSections(diffText)) {
		if (section.path === null || section.body === "") continue;
		const count = safeCount(section.body, needle, options);
		if (count > 0) counts.set(section.path, count);
	}
	if (refsMode) return {
		ok: true,
		matches: [...counts.entries()].map(([path, count]) => ({
			path,
			count
		})).sort((a, b) => b.count - a.count),
		truncated: searchCut
	};
	const truncated = await scanUntrackedMatches(repoRoot, counts, needle, options);
	return {
		ok: true,
		matches: [...counts.entries()].map(([path, count]) => ({
			path,
			count
		})).sort((a, b) => b.count - a.count),
		truncated: searchCut || truncated
	};
}
function parseGrepCounts(raw, stripPrefix) {
	const prefix = stripPrefix !== void 0 ? stripPrefix + ":" : "";
	const out = [];
	for (const line of raw.split("\n")) {
		if (line === "") continue;
		const stripped = prefix !== "" && line.startsWith(prefix) ? line.slice(prefix.length) : line;
		const colon = stripped.lastIndexOf(":");
		if (colon <= 0) continue;
		const count = Number(stripped.slice(colon + 1));
		if (!Number.isFinite(count) || count <= 0) continue;
		out.push({
			path: stripped.slice(0, colon),
			count
		});
	}
	return out;
}
const PUSH_TIMEOUT_MS = 12e4;
function runGitCapture(root, args, timeoutMs = GIT_TIMEOUT_MS) {
	return new Promise((resolvePromise) => {
		execFile("git", [
			"-C",
			root,
			"--no-optional-locks",
			"-c",
			"core.quotepath=false",
			...args
		], {
			timeout: timeoutMs,
			maxBuffer: GIT_MAX_BUFFER,
			windowsHide: true,
			encoding: "utf8",
			env: gitEnv()
		}, (error, stdout, stderr) => {
			resolvePromise({
				code: error === null ? 0 : typeof error.code === "number" ? error.code : 1,
				stdout: String(stdout),
				stderr: String(stderr)
			});
		});
	});
}
function runGitStreamed(root, args, timeoutMs = GIT_TIMEOUT_MS, byteCap = STREAM_CAP) {
	return new Promise((resolvePromise) => {
		const child = spawn("git", [
			"-C",
			root,
			"--no-optional-locks",
			"-c",
			"core.quotepath=false",
			...args
		], {
			windowsHide: true,
			env: gitEnv(),
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		});
		const out = [];
		const err = [];
		let size = 0;
		let truncated = false;
		let timedOut = false;
		let settled = false;
		const timer = setTimeout(() => {
			if (!settled) {
				timedOut = true;
				truncated = true;
				try {
					child.kill();
				} catch {}
			}
		}, timeoutMs);
		const onChunk = (chunk) => {
			size += chunk.length;
			if (size > byteCap && !truncated) {
				truncated = true;
				try {
					child.kill();
				} catch {}
				return;
			}
			if (!truncated) out.push(chunk);
		};
		child.stdout?.on("data", onChunk);
		child.stderr?.on("data", (chunk) => {
			if (err.length < 32) err.push(chunk);
		});
		child.once("error", () => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolvePromise({
				code: 1,
				stdout: Buffer.concat(out).toString("utf8"),
				stderr: Buffer.concat(err).toString("utf8"),
				truncated
			});
		});
		child.once("close", (code) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolvePromise({
				code: truncated && !timedOut ? 0 : code ?? 1,
				stdout: Buffer.concat(out).toString("utf8"),
				stderr: Buffer.concat(err).toString("utf8"),
				truncated
			});
		});
	});
}
async function gitCommit(cwd, message, mode, confirm, amend) {
	if (confirm !== true) return {
		ok: false,
		error: "commit requires confirm: true"
	};
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const trimmed = typeof message === "string" ? message.trim() : "";
	if (trimmed === "") return {
		ok: false,
		error: "commit message is required"
	};
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	if (mode === "all") {
		const staged = await runGitCapture(repoRoot, ["add", "-A"]);
		if (staged.code !== 0) return {
			ok: false,
			error: staged.stderr.trim() || staged.stdout.trim() || "git add failed"
		};
	}
	const result = await runGitCapture(repoRoot, [
		"commit",
		...amend === true ? ["--amend"] : [],
		"-m",
		trimmed.slice(0, 2e3)
	]);
	if (result.code !== 0) return {
		ok: false,
		error: result.stderr.trim() || result.stdout.trim() || "git commit failed (exit " + result.code + ")"
	};
	return {
		ok: true,
		output: result.stdout.trim()
	};
}
async function gitLastCommit(cwd) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const raw = (await runGit(repoRoot, [
		"log",
		"-1",
		"--format=%H%x1f%s%x1f%B"
	]).catch(() => "")).trim();
	if (raw === "") throw new Error("no commit found");
	const fields = raw.split("");
	const hash = fields[0].trim();
	if (!HASH_ONLY_RE.test(hash)) throw new Error("no commit found");
	return {
		ok: true,
		hash,
		subject: fields[1] ?? "",
		message: fields.slice(2).join("").trim()
	};
}
async function gitFetch(cwd, confirm) {
	if (confirm !== true) return {
		ok: false,
		error: "fetch requires confirm: true"
	};
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const result = await runGitCapture(repoRoot, ["fetch", "--all"], PUSH_TIMEOUT_MS);
	if (result.code !== 0) return {
		ok: false,
		error: result.stderr.trim() || result.stdout.trim() || "git fetch failed (exit " + result.code + ")"
	};
	return {
		ok: true,
		output: result.stdout.trim()
	};
}
function fencePaths(repoRoot, raw) {
	if (!Array.isArray(raw) || raw.length === 0 || raw.length > 200) throw new Error("paths (1-200 entries) required");
	return raw.map((item) => {
		if (typeof item !== "string" || item === "") throw new Error("paths must be non-empty strings");
		return relative(repoRoot, fenceRepoPath(repoRoot, item)).replaceAll("\\", "/");
	});
}
async function fileOpGuard(cwd, confirm) {
	if (confirm !== true) throw new Error("file operations require confirm: true");
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	return repoRoot;
}
async function gitStage(cwd, paths, confirm) {
	const repoRoot = await fileOpGuard(cwd, confirm);
	return writeAnswer(await runGitCapture(repoRoot, [
		"add",
		"--",
		...fencePaths(repoRoot, paths)
	]), "add");
}
async function gitUnstage(cwd, paths, confirm) {
	const repoRoot = await fileOpGuard(cwd, confirm);
	return writeAnswer(await runGitCapture(repoRoot, [
		"restore",
		"--staged",
		"--",
		...fencePaths(repoRoot, paths)
	]), "restore --staged");
}
async function gitDiscard(cwd, paths, confirm) {
	const repoRoot = await fileOpGuard(cwd, confirm);
	const specs = fencePaths(repoRoot, paths);
	const trackedRaw = await runGit(repoRoot, [
		"ls-files",
		"-z",
		"--",
		...specs
	]);
	const tracked = new Set(trackedRaw.split("\0").filter((chunk) => chunk !== ""));
	const trackedSpecs = [];
	const untrackedSpecs = [];
	for (const spec of specs) {
		if (tracked.has(spec)) {
			trackedSpecs.push(spec);
			continue;
		}
		let isDir = false;
		try {
			isDir = (await lstat(join(repoRoot, spec))).isDirectory();
		} catch {
			isDir = false;
		}
		if (isDir) {
			if ([...tracked].some((line) => line.startsWith(spec + "/"))) trackedSpecs.push(spec);
			untrackedSpecs.push(spec);
			continue;
		}
		untrackedSpecs.push(spec);
	}
	const failures = [];
	if (trackedSpecs.length > 0) {
		const restored = await runGitCapture(repoRoot, [
			"restore",
			"--source=HEAD",
			"--staged",
			"--worktree",
			"--",
			...trackedSpecs
		]);
		if (restored.code !== 0) failures.push(restored.stderr.trim() || restored.stdout.trim() || "git restore failed (exit " + restored.code + ")");
	}
	if (untrackedSpecs.length > 0) {
		const cleaned = await runGitCapture(repoRoot, [
			"clean",
			"-fd",
			"--",
			...untrackedSpecs
		]);
		if (cleaned.code !== 0) failures.push(cleaned.stderr.trim() || cleaned.stdout.trim() || "git clean failed (exit " + cleaned.code + ")");
	}
	if (failures.length > 0) return {
		ok: false,
		error: failures.join("\n")
	};
	return {
		ok: true,
		output: ""
	};
}
const HUNK_PATCH_HEADER_PREFIXES = [
	"diff --git ",
	"index ",
	"old mode ",
	"new mode ",
	"new file mode ",
	"deleted file mode ",
	"similarity index ",
	"dissimilarity index ",
	"--- ",
	"+++ "
];
function validateHunkPatch(patch, relPath) {
	const lines = patch.split("\n");
	if (lines[lines.length - 1] === "") lines.pop();
	const gitLines = lines.filter((line) => line.startsWith("diff --git "));
	if (gitLines.length !== 1) return "patch must contain exactly one \"diff --git\" line";
	if (gitLines[0] !== "diff --git a/" + relPath + " b/" + relPath) return "diff --git path does not match the fenced file path";
	let hunkSeen = false;
	for (const line of lines) {
		if (hunkSeen) {
			if (line.startsWith("@@")) return "patch must contain exactly one hunk";
			if (!(line === "" || line.startsWith(" ") || line.startsWith("+") || line.startsWith("-") || line.startsWith("\\"))) return "unexpected line inside the hunk body";
			continue;
		}
		if (line.startsWith("@@")) {
			if (!/^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/.test(line)) return "malformed hunk header";
			hunkSeen = true;
			continue;
		}
		if (!HUNK_PATCH_HEADER_PREFIXES.some((prefix) => line.startsWith(prefix))) return "unexpected line in the patch header";
		if (line === "--- a/" + relPath || line === "+++ b/" + relPath) continue;
		if (line === "--- /dev/null" || line === "+++ /dev/null") continue;
		if (line.startsWith("--- ") || line.startsWith("+++ ")) return "patch path does not match the fenced file path";
	}
	if (!hunkSeen) return "patch must contain exactly one hunk";
	return null;
}
async function gitHunkOp(cwd, path, patch, action, confirm) {
	const repoRoot = await fileOpGuard(cwd, confirm);
	if (typeof patch !== "string" || patch === "" || patch.length > 524288) return {
		ok: false,
		error: "invalid patch payload"
	};
	if (action !== "stage" && action !== "unstage" && action !== "revert") return {
		ok: false,
		error: "unsupported hunk action"
	};
	const problem = validateHunkPatch(patch, relative(repoRoot, fenceRepoPath(repoRoot, typeof path === "string" ? path : "")).replaceAll("\\", "/"));
	if (problem !== null) return {
		ok: false,
		error: problem
	};
	const dir = await mkdtemp(join(tmpdir(), "dsh-git-review-hunk-"));
	try {
		const patchFile = join(dir, "hunk.patch");
		await writeFile(patchFile, patch, "utf8");
		const args = ["apply"];
		if (action === "stage") args.push("--cached");
		if (action === "unstage") args.push("--cached", "--reverse");
		if (action === "revert") args.push("--reverse");
		args.push(patchFile);
		return writeAnswer(await runGitCapture(repoRoot, args), "git apply");
	} finally {
		await rm(dir, {
			recursive: true,
			force: true
		});
	}
}
const STASH_INDEX_CAP = 999;
async function gitStash(cwd, action, index, includeUntracked, confirm) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	if (action === "list") return {
		ok: true,
		stashes: parseStashLines(await runGit(repoRoot, [
			"stash",
			"list",
			"--format=%gd%x1f%at%x1f%gs%x1e"
		]).catch(() => ""))
	};
	if (confirm !== true) return {
		ok: false,
		error: "stash actions require confirm: true"
	};
	if (action === "push") return writeAnswer(await runGitCapture(repoRoot, [
		"stash",
		"push",
		...includeUntracked === true ? ["-u"] : []
	]), "stash push");
	if (action === "apply" || action === "pop" || action === "drop") {
		const n = typeof index === "number" && Number.isInteger(index) && index >= 0 && index <= STASH_INDEX_CAP ? index : null;
		if (n === null) return {
			ok: false,
			error: "stash index required (0-999)"
		};
		return writeAnswer(await runGitCapture(repoRoot, [
			"stash",
			action,
			"stash@{" + n + "}"
		]), "stash " + action);
	}
	return {
		ok: false,
		error: "unknown stash action"
	};
}
async function gitPush(cwd, confirm) {
	if (confirm !== true) return {
		ok: false,
		error: "push requires confirm: true"
	};
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const result = await runGitCapture(repoRoot, ["push"], PUSH_TIMEOUT_MS);
	if (result.code !== 0) return {
		ok: false,
		error: result.stderr.trim() || result.stdout.trim() || "git push failed (exit " + result.code + ")"
	};
	return {
		ok: true,
		output: result.stdout.trim()
	};
}
function historyTarget(raw) {
	const hash = typeof raw === "string" ? raw.trim() : "";
	if (!HASH_ONLY_RE.test(hash)) throw new Error("commit id required (40-hex)");
	return hash;
}
async function gitReset(cwd, commit, mode, confirm) {
	if (confirm !== true) return {
		ok: false,
		error: "reset requires confirm: true"
	};
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const hash = historyTarget(commit);
	const resolvedMode = mode === void 0 ? "mixed" : mode;
	if (resolvedMode !== "soft" && resolvedMode !== "mixed" && resolvedMode !== "hard") return {
		ok: false,
		error: "reset mode must be soft, mixed or hard"
	};
	const flag = resolvedMode === "soft" ? "--soft" : resolvedMode === "hard" ? "--hard" : "--mixed";
	return writeAnswer(await runGitCapture(repoRoot, [
		"reset",
		flag,
		hash
	]), "reset --" + flag.slice(2));
}
async function gitRevert(cwd, commit, confirm) {
	if (confirm !== true) return {
		ok: false,
		error: "revert requires confirm: true"
	};
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	return writeAnswer(await runGitCapture(repoRoot, [
		"revert",
		"--no-edit",
		historyTarget(commit)
	]), "revert");
}
async function gitCherryPick(cwd, commit, confirm) {
	if (confirm !== true) return {
		ok: false,
		error: "cherry-pick requires confirm: true"
	};
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	return writeAnswer(await runGitCapture(repoRoot, ["cherry-pick", historyTarget(commit)]), "cherry-pick");
}
async function gitMerge(cwd, name, noFf, confirm) {
	if (confirm !== true) return {
		ok: false,
		error: "merge requires confirm: true"
	};
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const ref = normalizeBaseRef(name);
	if (ref === null) return {
		ok: false,
		error: "invalid branch name"
	};
	const commit = await resolveRangeRef(repoRoot, ref);
	if (commit === null) return {
		ok: false,
		error: "cannot resolve branch: " + ref
	};
	return writeAnswer(await runGitCapture(repoRoot, [
		"merge",
		"--no-edit",
		...noFf === true ? ["--no-ff"] : [],
		commit
	]), "merge");
}
async function gitPull(cwd, rebase, confirm) {
	if (confirm !== true) return {
		ok: false,
		error: "pull requires confirm: true"
	};
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	return writeAnswer(await runGitCapture(repoRoot, [
		"pull",
		rebase === true ? "--rebase" : "--no-rebase",
		"--no-edit"
	], PUSH_TIMEOUT_MS), "pull");
}
async function gitConflictResolve(cwd, path, side, confirm) {
	if (confirm !== true) return {
		ok: false,
		error: "conflict resolution requires confirm: true"
	};
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const relPath = relative(repoRoot, fenceRepoPath(repoRoot, typeof path === "string" ? path : "")).replaceAll("\\", "/");
	if (side !== "ours" && side !== "theirs") return {
		ok: false,
		error: "conflict side must be ours or theirs"
	};
	const flag = side === "theirs" ? "--theirs" : "--ours";
	const taken = await runGitCapture(repoRoot, [
		"checkout",
		flag,
		"--",
		relPath
	]);
	if (taken.code !== 0) return {
		ok: false,
		error: taken.stderr.trim() || "git checkout " + flag + " failed (the file may not be in an unmerged state)"
	};
	return writeAnswer(await runGitCapture(repoRoot, [
		"add",
		"--",
		relPath
	]), "add");
}
async function gitConflictFinish(cwd, action, kind, confirm) {
	if (confirm !== true) return {
		ok: false,
		error: "conflict finish requires confirm: true"
	};
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const op = kind === "merge" || kind === "rebase" || kind === "cherry-pick" || kind === "revert" ? kind : null;
	if (op === null) return {
		ok: false,
		error: "unknown operation kind"
	};
	const marker = op === "merge" ? "MERGE_HEAD" : op === "rebase" ? "REBASE_HEAD" : op === "cherry-pick" ? "CHERRY_PICK_HEAD" : "REVERT_HEAD";
	if (await detectInProgress(repoRoot) !== op) return {
		ok: false,
		error: "no " + op + " in progress (marker " + marker + " absent)"
	};
	if (action !== "continue" && action !== "abort") return {
		ok: false,
		error: "conflict action must be continue or abort"
	};
	const verb = action === "abort" ? "--abort" : "--continue";
	return writeAnswer(await runGitCapture(repoRoot, [op, verb], PUSH_TIMEOUT_MS), op + " " + verb);
}
async function branchGuard(repoRoot, confirm, rawName) {
	if (confirm !== true) return {
		ok: false,
		error: "branch actions require confirm: true"
	};
	const name = normalizeBaseRef(rawName);
	if (name === null) return {
		ok: false,
		error: "invalid branch name"
	};
	const check = await runGitCapture(repoRoot, [
		"check-ref-format",
		"--branch",
		name
	]);
	if (check.code !== 0) return {
		ok: false,
		error: check.stderr.trim() || check.stdout.trim() || "invalid branch name: " + name
	};
	return {
		ok: true,
		name
	};
}
function writeAnswer(result, verb) {
	if (result.code !== 0) return {
		ok: false,
		error: result.stderr.trim() || result.stdout.trim() || "git " + verb + " failed (exit " + result.code + ")"
	};
	return {
		ok: true,
		output: result.stdout.trim()
	};
}
async function gitBranchCreate(cwd, name, startPoint, confirm) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const guard = await branchGuard(repoRoot, confirm, name);
	if (!guard.ok) return guard;
	let startCommit;
	if (typeof startPoint === "string" && startPoint.trim() !== "") {
		const ref = normalizeBaseRef(startPoint);
		const commit = ref === null ? null : await resolveRangeRef(repoRoot, ref);
		if (commit === null || commit === "4b825dc642cb6eb9a060e54bf8d69288fbee4904") return {
			ok: false,
			error: "cannot resolve start point: " + (ref ?? "(invalid)")
		};
		startCommit = commit;
	}
	return writeAnswer(await runGitCapture(repoRoot, [
		"branch",
		guard.name,
		...startCommit !== void 0 ? [startCommit] : []
	]), "branch");
}
async function gitBranchSwitch(cwd, name, confirm) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const guard = await branchGuard(repoRoot, confirm, name);
	if (!guard.ok) return guard;
	return writeAnswer(await runGitCapture(repoRoot, ["switch", guard.name]), "switch");
}
async function gitBranchDelete(cwd, name, force, confirm) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const guard = await branchGuard(repoRoot, confirm, name);
	if (!guard.ok) return guard;
	return writeAnswer(await runGitCapture(repoRoot, [
		"branch",
		force === true ? "-D" : "-d",
		guard.name
	]), "branch -d");
}
async function gitBranchRename(cwd, name, newName, confirm) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const guard = await branchGuard(repoRoot, confirm, name);
	if (!guard.ok) return guard;
	const guardNew = await branchGuard(repoRoot, confirm, newName);
	if (!guardNew.ok) return {
		ok: false,
		error: guardNew.error
	};
	return writeAnswer(await runGitCapture(repoRoot, [
		"branch",
		"-m",
		guard.name,
		guardNew.name
	]), "branch -m");
}
async function gitBranchTrack(cwd, remote, local, confirm) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	if (confirm !== true) return {
		ok: false,
		error: "branch actions require confirm: true"
	};
	const remoteRef = normalizeBaseRef(remote);
	if (remoteRef === null || !remoteRef.includes("/")) return {
		ok: false,
		error: "invalid remote branch name"
	};
	const remoteCommit = await resolveRangeRef(repoRoot, remoteRef);
	if (remoteCommit === null || remoteCommit === "4b825dc642cb6eb9a060e54bf8d69288fbee4904") return {
		ok: false,
		error: "cannot resolve remote branch: " + remoteRef
	};
	const fallback = remoteRef.slice(remoteRef.indexOf("/") + 1);
	const guard = await branchGuard(repoRoot, confirm, typeof local === "string" && local.trim() !== "" ? local : fallback);
	if (!guard.ok) return guard;
	return writeAnswer(await runGitCapture(repoRoot, [
		"switch",
		"-c",
		guard.name,
		"--track",
		remoteRef
	]), "switch --track");
}
async function tagGuard(repoRoot, confirm, rawName) {
	if (confirm !== true) return {
		ok: false,
		error: "tag actions require confirm: true"
	};
	const name = normalizeBaseRef(rawName);
	if (name === null) return {
		ok: false,
		error: "invalid tag name"
	};
	const check = await runGitCapture(repoRoot, ["check-ref-format", "refs/tags/" + name]);
	if (check.code !== 0) return {
		ok: false,
		error: check.stderr.trim() || check.stdout.trim() || "invalid tag name: " + name
	};
	return {
		ok: true,
		name
	};
}
async function gitTagCreate(cwd, name, target, confirm) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const guard = await tagGuard(repoRoot, confirm, name);
	if (!guard.ok) return guard;
	let targetCommit;
	if (typeof target === "string" && target.trim() !== "") {
		const ref = normalizeBaseRef(target);
		const commit = ref === null ? null : await resolveRangeRef(repoRoot, ref);
		if (commit === null || commit === "4b825dc642cb6eb9a060e54bf8d69288fbee4904") return {
			ok: false,
			error: "cannot resolve tag target: " + (ref ?? "(invalid)")
		};
		targetCommit = commit;
	}
	return writeAnswer(await runGitCapture(repoRoot, [
		"tag",
		guard.name,
		...targetCommit !== void 0 ? [targetCommit] : []
	]), "tag");
}
async function gitTagDelete(cwd, name, confirm) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const guard = await tagGuard(repoRoot, confirm, name);
	if (!guard.ok) return guard;
	return writeAnswer(await runGitCapture(repoRoot, [
		"tag",
		"-d",
		guard.name
	]), "tag -d");
}
async function gitTagPush(cwd, name, confirm) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const guard = await tagGuard(repoRoot, confirm, name);
	if (!guard.ok) return guard;
	return writeAnswer(await runGitCapture(repoRoot, [
		"push",
		"origin",
		"refs/tags/" + guard.name
	], PUSH_TIMEOUT_MS), "push tag");
}
async function gitFileOp(cwd, path, action, newPath, confirm) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	if (confirm !== true) return {
		ok: false,
		error: "file operations require confirm: true"
	};
	const repoRoot = await resolveRepository(cwd);
	const root = repoRoot ?? await resolveWorkspace(cwd);
	if (root === null) throw new Error("workspace not found");
	const absPath = repoRoot !== null ? fenceRepoPath(root, typeof path === "string" ? path : "") : fenceWorkspacePath(root, typeof path === "string" ? path : "");
	let stat = null;
	try {
		stat = await lstat(absPath);
	} catch {
		return {
			ok: false,
			error: "path does not exist: " + String(path)
		};
	}
	if (stat === null || !stat.isFile() && !stat.isDirectory()) return {
		ok: false,
		error: "not a file or directory"
	};
	if (action === "rename") {
		if (typeof newPath !== "string" || newPath.trim() === "") return {
			ok: false,
			error: "new path is required"
		};
		const absTarget = repoRoot !== null ? fenceRepoPath(root, newPath.trim()) : fenceWorkspacePath(root, newPath.trim());
		if (absTarget === absPath) return {
			ok: true,
			output: ""
		};
		try {
			await lstat(absTarget);
			return {
				ok: false,
				error: "target already exists: " + newPath
			};
		} catch {}
		try {
			await rename(absPath, absTarget);
			return {
				ok: true,
				output: ""
			};
		} catch (error) {
			return {
				ok: false,
				error: String(error.message ?? error)
			};
		}
	}
	if (action === "delete") try {
		await rm(absPath, {
			recursive: stat.isDirectory(),
			force: false
		});
		return {
			ok: true,
			output: ""
		};
	} catch (error) {
		return {
			ok: false,
			error: String(error.message ?? error)
		};
	}
	return {
		ok: false,
		error: "unknown file operation"
	};
}
async function gitOpenWith(cwd, path, app, confirm) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	if (confirm !== true) return {
		ok: false,
		error: "open-with requires confirm: true"
	};
	if (app !== void 0 && app !== "default" && app !== "explorer" && app !== "notepad" && app !== "code" && app !== "code-insiders") return {
		ok: false,
		error: "unknown app"
	};
	const repoRoot = await resolveRepository(cwd);
	const root = repoRoot ?? await resolveWorkspace(cwd);
	if (root === null) throw new Error("workspace not found");
	const absPath = repoRoot !== null ? fenceRepoPath(root, typeof path === "string" ? path : "") : fenceWorkspacePath(root, typeof path === "string" ? path : "");
	let isDir = false;
	try {
		const stat = await lstat(absPath);
		if (!stat.isFile() && !stat.isDirectory()) return {
			ok: false,
			error: "not a file or directory"
		};
		isDir = stat.isDirectory();
	} catch {
		return {
			ok: false,
			error: "path does not exist (it may only exist in history)"
		};
	}
	if (isDir && app === "notepad") return {
		ok: false,
		error: "notepad cannot open a directory"
	};
	const tool = app === "explorer" ? "explorer.exe" : app === "notepad" ? "notepad.exe" : app === "code" ? "code" : app === "code-insiders" ? "code-insiders" : void 0;
	const run = () => new Promise((resolvePromise, rejectPromise) => {
		const argv = tool !== void 0 ? [tool, tool === "explorer.exe" && !isDir ? "/select," + absPath : absPath] : process.platform === "win32" ? ["explorer.exe", absPath] : ["xdg-open", absPath];
		const child = spawn(argv[0], argv.slice(1), {
			windowsHide: true,
			detached: true,
			stdio: "ignore"
		});
		child.once("error", (error) => rejectPromise(error));
		child.once("spawn", () => resolvePromise());
		child.unref();
	});
	try {
		await run();
		return {
			ok: true,
			output: ""
		};
	} catch (error) {
		const message = String(error.message ?? error);
		const hint = error.code === "ENOENT" ? " (app not installed or not on PATH)" : "";
		return {
			ok: false,
			error: "cannot open: " + message + hint
		};
	}
}
async function gitOpenApps() {
	const available = async (name) => {
		try {
			await new Promise((resolvePromise, rejectPromise) => {
				execFile(process.platform === "win32" ? "where" : "which", [name], {
					windowsHide: true,
					timeout: 5e3,
					maxBuffer: 65536
				}, (error) => {
					if (error !== null) rejectPromise(error);
					else resolvePromise();
				});
			});
			return true;
		} catch {
			return false;
		}
	};
	const [hasCode, hasInsiders] = await Promise.all([available("code"), available("code-insiders")]);
	const apps = [{
		id: "default",
		available: true
	}];
	if (process.platform === "win32") apps.push({
		id: "explorer",
		available: true
	}, {
		id: "notepad",
		available: true
	});
	apps.push({
		id: "code",
		available: hasCode
	}, {
		id: "code-insiders",
		available: hasInsiders
	});
	return {
		ok: true,
		apps
	};
}
const HUNK_BODY_CAP = 614400;
function readJsonBody(req, res, bodyCap = BODY_CAP) {
	return new Promise((resolvePromise, rejectPromise) => {
		let responded = false;
		if (!String(req.headers["content-type"] ?? "").toLowerCase().includes("application/json")) {
			responded = true;
			rejectPromise(new Error("content-type must be application/json"));
			res.writeHead(415, { "content-type": "application/json; charset=utf-8" });
			res.end(JSON.stringify({
				ok: false,
				error: "content-type must be application/json"
			}));
			req.resume();
			return;
		}
		const chunks = [];
		let size = 0;
		req.on("data", (chunk) => {
			if (responded) return;
			size += chunk.length;
			if (size > bodyCap) {
				responded = true;
				rejectPromise(new Error("request body too large"));
				res.writeHead(413, { "content-type": "application/json; charset=utf-8" });
				res.end(JSON.stringify({
					ok: false,
					error: "request body too large"
				}));
				req.resume();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			if (responded) return;
			try {
				const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
				if (parsed === null || typeof parsed !== "object") rejectPromise(new Error("body must be a JSON object"));
				else resolvePromise(parsed);
			} catch (error) {
				rejectPromise(new Error("invalid JSON body: " + String(error.message ?? error)));
			}
		});
		req.on("error", rejectPromise);
	});
}
function respond(res, status, payload) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(payload));
}
function apply(ctx) {
	installSettings(ctx);
	ctx.inject(["webServer"], (wctx) => {
		wctx.effect(() => wctx.webServer.register({
			kind: "prefix",
			path: API_PREFIX,
			handler: async (req, res) => {
				const route = (req.url ?? "/").split("?")[0];
				try {
					if (route === "/ping" || route === API_PREFIX + "/ping") {
						respond(res, 200, { ok: true });
						return;
					}
					if (route === "/asset" || route === API_PREFIX + "/asset") {
						await serveAsset(req, res);
						return;
					}
					if (req.method !== "POST") {
						respond(res, 405, {
							ok: false,
							error: "POST only"
						});
						return;
					}
					const action = route.startsWith(API_PREFIX + "/") ? route.slice(20) : route.startsWith("/") ? route.slice(1) : route;
					const body = await readJsonBody(req, res, action === "hunk-op" ? HUNK_BODY_CAP : BODY_CAP);
					if (action === "status") {
						respond(res, 200, await gitStatus(body["cwd"], body["base"], body["target"], body["ws"]));
						return;
					}
					if (action === "file-diff") {
						respond(res, 200, await gitFileDiff(body["cwd"], body["path"], body["untracked"], body["full"], body["origPath"], body["scope"], body["base"], body["target"], body["ws"]));
						return;
					}
					if (action === "refs") {
						respond(res, 200, await gitRefs(body["cwd"]));
						return;
					}
					if (action === "log") {
						respond(res, 200, await gitLog(body["cwd"], body["limit"], body["skip"]));
						return;
					}
					if (action === "commit-files") {
						respond(res, 200, await gitCommitFiles(body["cwd"], body["commit"]));
						return;
					}
					if (action === "commit") {
						respond(res, 200, await gitCommit(body["cwd"], body["message"], body["mode"], body["confirm"], body["amend"]));
						return;
					}
					if (action === "push") {
						respond(res, 200, await gitPush(body["cwd"], body["confirm"]));
						return;
					}
					if (action === "stage") {
						respond(res, 200, await gitStage(body["cwd"], body["paths"], body["confirm"]));
						return;
					}
					if (action === "unstage") {
						respond(res, 200, await gitUnstage(body["cwd"], body["paths"], body["confirm"]));
						return;
					}
					if (action === "discard") {
						respond(res, 200, await gitDiscard(body["cwd"], body["paths"], body["confirm"]));
						return;
					}
					if (action === "hunk-op") {
						respond(res, 200, await gitHunkOp(body["cwd"], body["path"], body["patch"], body["action"], body["confirm"]));
						return;
					}
					if (action === "fetch") {
						respond(res, 200, await gitFetch(body["cwd"], body["confirm"]));
						return;
					}
					if (action === "stash") {
						respond(res, 200, await gitStash(body["cwd"], body["action"], body["index"], body["includeUntracked"], body["confirm"]));
						return;
					}
					if (action === "last-commit") {
						respond(res, 200, await gitLastCommit(body["cwd"]));
						return;
					}
					if (action === "reset") {
						respond(res, 200, await gitReset(body["cwd"], body["commit"], body["mode"], body["confirm"]));
						return;
					}
					if (action === "revert") {
						respond(res, 200, await gitRevert(body["cwd"], body["commit"], body["confirm"]));
						return;
					}
					if (action === "cherry-pick") {
						respond(res, 200, await gitCherryPick(body["cwd"], body["commit"], body["confirm"]));
						return;
					}
					if (action === "merge") {
						respond(res, 200, await gitMerge(body["cwd"], body["name"], body["noFf"], body["confirm"]));
						return;
					}
					if (action === "pull") {
						respond(res, 200, await gitPull(body["cwd"], body["rebase"], body["confirm"]));
						return;
					}
					if (action === "conflict-resolve") {
						respond(res, 200, await gitConflictResolve(body["cwd"], body["path"], body["side"], body["confirm"]));
						return;
					}
					if (action === "conflict-finish") {
						respond(res, 200, await gitConflictFinish(body["cwd"], body["action"], body["kind"], body["confirm"]));
						return;
					}
					if (action === "branch-create") {
						respond(res, 200, await gitBranchCreate(body["cwd"], body["name"], body["startPoint"], body["confirm"]));
						return;
					}
					if (action === "branch-switch") {
						respond(res, 200, await gitBranchSwitch(body["cwd"], body["name"], body["confirm"]));
						return;
					}
					if (action === "branch-delete") {
						respond(res, 200, await gitBranchDelete(body["cwd"], body["name"], body["force"], body["confirm"]));
						return;
					}
					if (action === "branch-rename") {
						respond(res, 200, await gitBranchRename(body["cwd"], body["name"], body["newName"], body["confirm"]));
						return;
					}
					if (action === "branch-track") {
						respond(res, 200, await gitBranchTrack(body["cwd"], body["remote"], body["local"], body["confirm"]));
						return;
					}
					if (action === "tag-create") {
						respond(res, 200, await gitTagCreate(body["cwd"], body["name"], body["target"], body["confirm"]));
						return;
					}
					if (action === "tag-delete") {
						respond(res, 200, await gitTagDelete(body["cwd"], body["name"], body["confirm"]));
						return;
					}
					if (action === "tag-push") {
						respond(res, 200, await gitTagPush(body["cwd"], body["name"], body["confirm"]));
						return;
					}
					if (action === "blame") {
						respond(res, 200, await gitBlame(body["cwd"], body["path"], body["ref"]));
						return;
					}
					if (action === "file-history") {
						respond(res, 200, await gitFileHistory(body["cwd"], body["path"]));
						return;
					}
					if (action === "file-content") {
						respond(res, 200, await gitFileContent(body["cwd"], body["path"], body["ref"]));
						return;
					}
					if (action === "file-bytes") {
						respond(res, 200, await gitFileBytes(body["cwd"], body["path"], body["ref"], body["stage"]));
						return;
					}
					if (action === "list-files") {
						respond(res, 200, await gitListFiles(body["cwd"]));
						return;
					}
					if (action === "fs-list") {
						respond(res, 200, await gitFsList(body["cwd"], body["path"]));
						return;
					}
					if (action === "git-init") {
						respond(res, 200, await gitInit(body["cwd"], body["confirm"]));
						return;
					}
					if (action === "search") {
						respond(res, 200, await gitSearch(body["cwd"], body["query"], body["base"], body["target"], body["mode"], body["cs"], body["rx"], body["ws"]));
						return;
					}
					if (action === "file-op") {
						respond(res, 200, await gitFileOp(body["cwd"], body["path"], body["action"], body["newPath"], body["confirm"]));
						return;
					}
					if (action === "open-with") {
						respond(res, 200, await gitOpenWith(body["cwd"], body["path"], body["app"], body["confirm"]));
						return;
					}
					if (action === "apps") {
						respond(res, 200, await gitOpenApps());
						return;
					}
					respond(res, 404, {
						ok: false,
						error: "unknown action"
					});
				} catch (error) {
					if (res.headersSent) return;
					respond(res, 200, {
						ok: false,
						error: String(error.message ?? error)
					});
				}
			}
		}), "dsh-git-review: fenced git api");
	});
}
//#endregion
export { SEARCH_REGEX_CAP, apply, gitBlame, gitBranchCreate, gitBranchDelete, gitBranchRename, gitBranchSwitch, gitBranchTrack, gitCherryPick, gitCommit, gitCommitFiles, gitConflictFinish, gitConflictResolve, gitDiscard, gitEnv, gitFetch, gitFileBytes, gitFileContent, gitFileDiff, gitFileHistory, gitFileOp, gitFsList, gitHunkOp, gitInit, gitLastCommit, gitListFiles, gitLog, gitMerge, gitOpenApps, gitOpenWith, gitPull, gitRefs, gitReset, gitRevert, gitSearch, gitStage, gitStash, gitStatus, gitTagCreate, gitTagDelete, gitTagPush, gitUnstage, inject, name };
