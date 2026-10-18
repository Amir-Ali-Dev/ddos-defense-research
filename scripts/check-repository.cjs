const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const YAML = require("yaml");
const root = path.resolve(__dirname, "..");
function files(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      ["node_modules", ".git", "dist"].includes(e.name)
        ? []
        : e.isDirectory()
          ? files(path.join(dir, e.name))
          : [path.join(dir, e.name)],
    );
}
function exactExists(target) {
  if (!fs.existsSync(target)) return false;
  const relative = path.relative(root, target);
  if (relative.startsWith("..")) return false;
  let current = root;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    if (!fs.readdirSync(current).includes(part)) return false;
    current = path.join(current, part);
  }
  return true;
}
function slug(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .replace(/ /g, "-");
}
function anchors(text) {
  const ids = new Set(),
    counts = new Map();
  for (const match of text.matchAll(/^#{1,6} +(.+?) *#*$/gm)) {
    const id = slug(match[1]);
    const n = counts.get(id) || 0;
    counts.set(id, n + 1);
    ids.add(id + (n ? "-" + n : ""));
  }
  return ids;
}
let checked = 0;
const errors = [];
for (const file of files(root)) {
  const ext = path.extname(file);
  if (![".json", ".md", ".yml", ".yaml", ".svg"].includes(ext)) continue;
  const text = fs.readFileSync(file, "utf8");
  try {
    if (ext === ".json") JSON.parse(text);
    if (ext === ".yml" || ext === ".yaml")
      YAML.parse(text, { uniqueKeys: true });
  } catch (e) {
    errors.push(path.relative(root, file) + ": " + e.message);
  }
  if (ext !== ".md") continue;
  const links = [...text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  links.push(...[...text.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]));
  for (let href of links) {
    href = href.replace(/^<|>$/g, "");
    if (/^(https?:|mailto:|data:)/.test(href)) continue;
    const [location, fragment] = href.split("#");
    const target = path.resolve(
      path.dirname(file),
      decodeURIComponent(location || path.basename(file)),
    );
    checked++;
    if (!exactExists(target)) {
      errors.push(
        path.relative(root, file) + ": missing/case-mismatched " + href,
      );
      continue;
    }
    if (
      fragment &&
      path.extname(target) === ".md" &&
      !anchors(fs.readFileSync(target, "utf8")).has(
        decodeURIComponent(fragment),
      )
    )
      errors.push(path.relative(root, file) + ": missing anchor " + href);
  }
}
const compose = YAML.parse(
  fs.readFileSync(path.join(root, "lab/docker-compose.yml"), "utf8"),
);
for (const [name, service] of Object.entries(compose.services)) {
  for (const port of service.ports || [])
    assert(String(port).startsWith("127.0.0.1:"), "Non-loopback port: " + name);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "PASS: JSON/YAML, " +
      checked +
      " internal links/anchors and loopback Compose ports",
  );
