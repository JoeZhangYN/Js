import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = path.resolve(root, "..", "HentaiVerse", "Hentaiverse Monsterbation.js");
const source = fs.readFileSync(file, "utf8");
const violations = [];

if (/\bcfg\s*\[\s*evals\s*\[\s*i\s*\]\s*\]\s*=\s*eval\s*\(/.test(source)) {
  violations.push("Monsterbation action/regexp config still uses eval");
}

if (!/function\s+ParseMonsterbationConfigValue\s*\(/.test(source)) {
  violations.push("Monsterbation action/regexp config lacks explicit parser entry");
}

if (!/\bcfg\s*\[\s*evals\s*\[\s*i\s*\]\s*\]\s*=\s*ParseMonsterbationConfigValue\s*\(/.test(source)) {
  violations.push("Monsterbation action/regexp config does not route through parser entry");
}

const evalCalls = source.match(/\beval\s*\(/g) || [];
if (evalCalls.length !== 1 || !/\beval\s*\(\s*cfg\.bind\s*\)/.test(source)) {
  violations.push("Monsterbation eval scope changed; expected only the cfg.bind parser boundary to remain");
}

if (violations.length) {
  console.error("[verify-monsterbation-action-config-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-monsterbation-action-config-boundary] OK — Monsterbation action config uses explicit parser");
