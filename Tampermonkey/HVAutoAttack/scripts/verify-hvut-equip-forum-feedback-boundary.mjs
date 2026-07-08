import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function count(pattern) {
  return [...text.matchAll(pattern)].length;
}

for (const required of [
  "HVUT_FEEDBACK_EVENT",
  "PROMPT_EQUIP_FORUM_LINK: 'promptEquipForumLink'",
  "HVUT_FEEDBACK_COPY",
  "equipForumLinkPrompt: { main: '论坛链接:', isekai: 'Forum Link:' }",
  "resolve_hvut_feedback_copy",
  "run_hvut_user_feedback",
  "render_hvut_equip_forum_link",
  "prompt_hvut_equip_forum_link",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must own ${required}`);
  }
}

if (count(/\bprompt_hvut_equip_forum_link\(/g) !== 4) {
  violations.push(
    `${target} must route the four equipment forum-link prompt calls through prompt_hvut_equip_forum_link`
  );
}

if (count(/\brender_hvut_equip_forum_link\(/g) !== 1) {
  violations.push(
    `${target} must keep equipment forum-link BBCode construction in render_hvut_equip_forum_link`
  );
}

if (count(/\bprompt\(\s*resolve_hvut_feedback_copy\(event\.copy\),\s*event\.value\)/g) !== 1) {
  violations.push(`${target} must keep raw prompt side effect only in run_hvut_user_feedback`);
}

for (const forbidden of [
  "prompt('Forum Link:'",
  'prompt("Forum Link:"',
  "prompt('论坛链接:'",
  'prompt("论坛链接:"',
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not prompt equipment forum links directly: ${forbidden}`);
  }
}

if (
  text.includes("prompt_hvut_equip_forum_link(eq, eq.data.namecode)") &&
  count(/\$equip\.namecode\(eq\);/g) < 2
) {
  violations.push(`${target} must derive namecode before prompting equipment forum namecode links`);
}

if (violations.length) {
  console.error("[verify-hvut-equip-forum-feedback-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-equip-forum-feedback-boundary] OK - equipment forum-link feedback uses one typed entry"
);
