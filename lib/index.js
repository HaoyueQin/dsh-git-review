import { execFile } from "node:child_process";
import { lstat, open, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
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
function normalizeBaseRef(value) {
	if (typeof value !== "string") return null;
	const ref = value.trim();
	if (ref === "" || ref.length > 256) return null;
	if (ref.startsWith("-") || ref.includes("..") || ref.includes("@{")) return null;
	if (/[\s~^:?*\[\\{}]/.test(ref)) return null;
	return ref;
}
const EMPTY_TREE_ID = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
function refRange(baseCommit, targetCommit) {
	return baseCommit === "4b825dc642cb6eb9a060e54bf8d69288fbee4904" ? [baseCommit, targetCommit] : [baseCommit + "..." + targetCommit];
}
function mergeDiffRows(rows, numstat) {
	return rows.map((row) => {
		const stat = numstat.get(row.path);
		return {
			path: row.path,
			origPath: row.origPath,
			x: row.letter,
			y: " ",
			added: stat === void 0 ? 0 : stat.added ?? 0,
			deleted: stat === void 0 ? 0 : stat.deleted ?? 0,
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
		if (item.startsWith("HEAD -> ")) out.push({
			name: item.slice(8),
			kind: "head"
		});
		else if (item.startsWith("tag: ")) out.push({
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
			subject: fields.slice(5).join("").trim()
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
//#endregion
//#region src/index.ts
const HASH_ONLY_RE = /^[0-9a-f]{40}$/;
const name = "dsh-git-review";
const inject = ["webServer"];
const API_PREFIX = "/dsh-git-review/api";
const BODY_CAP = 65536;
const GIT_TIMEOUT_MS = 3e4;
const GIT_MAX_BUFFER = 67108864;
const DIFF_CAP = 2097152;
const READ_CAP = 524288;
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
			encoding: "utf8"
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
	return child === "" || !child.startsWith("..") && !isAbsolute(child);
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
async function probeUntracked(repoRoot, relPath) {
	const absPath = resolve(repoRoot, relPath);
	if (!inside(repoRoot, absPath)) return null;
	try {
		if (!(await lstat(absPath)).isFile()) return null;
	} catch {
		return null;
	}
	try {
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
	} catch {
		return null;
	}
}
async function untrackedPseudoDiff(repoRoot, relPath) {
	const absPath = resolve(repoRoot, relPath);
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
function capDiff(diffText) {
	if (diffText.length <= DIFF_CAP) return {
		diff: diffText,
		truncated: false
	};
	const cut = diffText.lastIndexOf("\n", DIFF_CAP);
	return {
		diff: cut === -1 ? "" : diffText.slice(0, cut),
		truncated: true
	};
}
async function gitStatus(cwd, base, target) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) return {
		ok: false,
		isRepository: false,
		error: "not a git repository (or git is unavailable)"
	};
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
	const [branchRaw, porcelainRaw, numstatRaw, nameStatusRaw] = await Promise.all([
		runGit(repoRoot, [
			"rev-parse",
			"--abbrev-ref",
			"HEAD"
		]).catch(() => ""),
		runGit(repoRoot, [
			"status",
			"--porcelain=v1",
			"-z",
			"--untracked-files=all"
		]),
		overrideCommit !== null ? runGit(repoRoot, [
			"diff",
			"--numstat",
			"-z",
			"--no-color",
			"-M",
			overrideCommit
		]) : runGit(repoRoot, [
			"diff",
			"--numstat",
			"-z",
			"--no-color",
			"-M",
			unbornHead ? EMPTY_TREE_ID : "HEAD"
		]),
		overrideCommit !== null ? runGit(repoRoot, [
			"diff",
			"--name-status",
			"-z",
			"--no-color",
			"-M",
			overrideCommit
		]) : Promise.resolve("")
	]);
	const porcelainEntries = parsePorcelainV1(porcelainRaw);
	const numstat = numstatIndex(parseNumstatZ(numstatRaw));
	const finalEntries = overrideCommit !== null ? [...parseNameStatusZ(nameStatusRaw).map((row) => ({
		x: row.letter,
		y: " ",
		path: row.path,
		origPath: row.origPath
	})), ...porcelainEntries.filter((entry) => entry.x === "?")] : porcelainEntries;
	const untrackedCounts = new Map();
	for (const entry of finalEntries) {
		if (entry.x !== "?") continue;
		const probe = await probeUntracked(repoRoot, entry.path);
		if (probe !== null) untrackedCounts.set(entry.path, probe);
	}
	const files = mergeStatus(finalEntries, numstat, untrackedCounts);
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
		base: overrideCommit ?? headCommit,
		unbornHead,
		baseRef: overrideCommit !== null ? baseRef : null,
		files,
		totals: {
			added,
			deleted
		}
	};
}
function asScope(value) {
	return value === "staged" || value === "unstaged" ? value : "all";
}
async function gitFileDiff(cwd, path, untracked, full, origPath, scope, base, target) {
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
		const pseudo = await untrackedPseudoDiff(repoRoot, relPath);
		if (pseudo !== null) return pseudo;
	}
	const { base: headCommit } = await diffBase(repoRoot);
	const diffScope = asScope(scope);
	const baseRef = normalizeBaseRef(base);
	const requestedCommit = baseRef === null ? null : await resolveRangeRef(repoRoot, baseRef);
	const overrideCommit = requestedCommit !== null && requestedCommit !== headCommit ? requestedCommit : null;
	const usesRange = overrideCommit !== null || diffScope !== "unstaged";
	const rangeArg = overrideCommit ?? headCommit;
	const attempt = (range) => runGit(repoRoot, [
		"diff",
		...overrideCommit === null && diffScope === "staged" ? ["--cached"] : [],
		"--no-color",
		"-M",
		"--no-ext-diff",
		"--unified=" + String(context),
		...usesRange ? [range] : [],
		"--",
		...pathspecs
	]);
	let diffText;
	try {
		diffText = await attempt(rangeArg);
	} catch (error) {
		if (!usesRange) throw error;
		diffText = await attempt("HEAD");
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
		truncated: capped.truncated
	};
}
async function gitFileContent(cwd, path) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const absPath = fenceRepoPath(repoRoot, typeof path === "string" ? path : "");
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
const LIST_FILES_CAP = 2e4;
async function gitListFiles(cwd) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const [trackedRaw, othersRaw] = await Promise.all([runGit(repoRoot, ["ls-files", "-z"]), runGit(repoRoot, [
		"ls-files",
		"-z",
		"--others",
		"--exclude-standard"
	])]);
	const files = new Set();
	for (const chunk of trackedRaw.split("\0")) if (chunk !== "") files.add(chunk);
	for (const chunk of othersRaw.split("\0")) if (chunk !== "") files.add(chunk);
	const sorted = [...files].sort();
	return {
		ok: true,
		files: sorted.slice(0, LIST_FILES_CAP),
		truncated: sorted.length > LIST_FILES_CAP
	};
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
async function gitLog(cwd) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	let raw;
	try {
		raw = await runGit(repoRoot, [
			"log",
			"--all",
			"--date-order",
			"--max-count=" + String(LOG_CAP),
			"--format=%H%x1f%P%x1f%an%x1f%at%x1f%D%x1f%s%x1e"
		]);
	} catch (error) {
		if (/does not have any commits yet|bad revision/i.test(String(error.message ?? error))) return {
			ok: true,
			commits: [],
			truncated: false
		};
		throw error;
	}
	const commits = parseLogLines(raw);
	return {
		ok: true,
		commits,
		truncated: commits.length >= LOG_CAP
	};
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
async function gitSearch(cwd, query, base, target) {
	if (typeof cwd !== "string" || cwd === "") throw new Error("cwd is required");
	if (typeof query !== "string" || query.trim() === "") return {
		ok: true,
		matches: [],
		truncated: false
	};
	const needle = query.slice(0, 200);
	const repoRoot = await resolveRepository(cwd);
	if (repoRoot === null) throw new Error("not a git repository");
	const targetRef = normalizeBaseRef(target);
	let diffText;
	let refsMode = false;
	if (targetRef !== null) {
		const baseCommit = await resolveRangeRef(repoRoot, normalizeBaseRef(base) ?? "HEAD");
		const targetCommit = await resolveRangeRef(repoRoot, targetRef);
		if (baseCommit === null || targetCommit === null) throw new Error("cannot resolve diff range refs");
		diffText = await runGit(repoRoot, [
			"diff",
			"--no-color",
			"-M",
			"--no-ext-diff",
			...refRange(baseCommit, targetCommit)
		]);
		refsMode = true;
	} else {
		const { base } = await diffBase(repoRoot);
		try {
			diffText = await runGit(repoRoot, [
				"diff",
				"--no-color",
				"-M",
				"--no-ext-diff",
				base
			]);
		} catch {
			diffText = await runGit(repoRoot, [
				"diff",
				"--no-color",
				"-M",
				"--no-ext-diff",
				"HEAD"
			]);
		}
	}
	const counts = new Map();
	for (const section of splitDiffSections(diffText)) {
		if (section.path === null || section.body === "") continue;
		const count = countOccurrences(section.body, needle);
		if (count > 0) counts.set(section.path, count);
	}
	if (refsMode) return {
		ok: true,
		matches: [...counts.entries()].map(([path, count]) => ({
			path,
			count
		})).sort((a, b) => b.count - a.count),
		truncated: false
	};
	let untracked = [];
	try {
		untracked = parsePorcelainV1(await runGit(repoRoot, [
			"status",
			"--porcelain=v1",
			"-z",
			"--untracked-files=all"
		])).filter((entry) => entry.x === "?").map((entry) => entry.path);
	} catch {}
	let truncated = untracked.length > SEARCH_UNTRACKED_CAP;
	for (const relPath of untracked.slice(0, SEARCH_UNTRACKED_CAP)) {
		const absPath = resolve(repoRoot, relPath);
		if (!inside(repoRoot, absPath)) continue;
		try {
			const { bytes } = await readPrefix(absPath, SEARCH_READ_CAP);
			if (bytes.includes(0)) continue;
			const count = countOccurrences(bytes.toString("utf8"), needle);
			if (count > 0) counts.set(relPath, (counts.get(relPath) ?? 0) + count);
		} catch {
			truncated = true;
		}
	}
	return {
		ok: true,
		matches: [...counts.entries()].map(([path, count]) => ({
			path,
			count
		})).sort((a, b) => b.count - a.count),
		truncated
	};
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
			encoding: "utf8"
		}, (error, stdout, stderr) => {
			resolvePromise({
				code: error === null ? 0 : typeof error.code === "number" ? error.code : 1,
				stdout: String(stdout),
				stderr: String(stderr)
			});
		});
	});
}
async function gitCommit(cwd, message, mode, confirm) {
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
		"-m",
		(trimmed.startsWith("-") ? " " + trimmed : trimmed).slice(0, 2e3)
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
function readJsonBody(req, res) {
	return new Promise((resolvePromise, rejectPromise) => {
		const chunks = [];
		let size = 0;
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > BODY_CAP) {
				rejectPromise(new Error("request body too large"));
				res.writeHead(413, { "content-type": "application/json; charset=utf-8" });
				res.end(JSON.stringify({
					ok: false,
					error: "request body too large"
				}));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
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
	const webServer = ctx.webServer;
	if (webServer === void 0) {
		ctx.logger?.warn?.("[dsh-git-review] webServer service absent — review API disabled");
		return;
	}
	ctx.effect(() => webServer.register({
		kind: "prefix",
		path: API_PREFIX,
		handler: async (req, res) => {
			const route = (req.url ?? "/").split("?")[0];
			try {
				if (route === "/ping" || route === API_PREFIX + "/ping") {
					respond(res, 200, { ok: true });
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
				const body = await readJsonBody(req, res);
				if (action === "status") {
					respond(res, 200, await gitStatus(body["cwd"], body["base"], body["target"]));
					return;
				}
				if (action === "file-diff") {
					respond(res, 200, await gitFileDiff(body["cwd"], body["path"], body["untracked"], body["full"], body["origPath"], body["scope"], body["base"], body["target"]));
					return;
				}
				if (action === "refs") {
					respond(res, 200, await gitRefs(body["cwd"]));
					return;
				}
				if (action === "log") {
					respond(res, 200, await gitLog(body["cwd"]));
					return;
				}
				if (action === "commit-files") {
					respond(res, 200, await gitCommitFiles(body["cwd"], body["commit"]));
					return;
				}
				if (action === "commit") {
					respond(res, 200, await gitCommit(body["cwd"], body["message"], body["mode"], body["confirm"]));
					return;
				}
				if (action === "push") {
					respond(res, 200, await gitPush(body["cwd"], body["confirm"]));
					return;
				}
				if (action === "file-content") {
					respond(res, 200, await gitFileContent(body["cwd"], body["path"]));
					return;
				}
				if (action === "list-files") {
					respond(res, 200, await gitListFiles(body["cwd"]));
					return;
				}
				if (action === "search") {
					respond(res, 200, await gitSearch(body["cwd"], body["query"], body["base"], body["target"]));
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
	}), "dsh-git-review: read-only git api");
}
//#endregion
export { apply, inject, name };
