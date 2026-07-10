import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (target) => fs.readFileSync(path.join(root, target), "utf8");
const layoutTarget = "src/core/async-task-layout.js";
const layoutTestTarget = "src/core/async-task-layout.test.js";
const bridgeTarget = "src/core/async-task-layout-bridge.js";
const armoryTarget = "src/i18n/hvut-armory-integration.js";
const hvutTarget = "src/i18n/hv-utils.js";
const mainTarget = "src/main.js";
const layout = read(layoutTarget);
const layoutTest = read(layoutTestTarget);
const bridge = read(bridgeTarget);
const armory = read(armoryTarget);
const hvut = read(hvutTarget);
const main = read(mainTarget);
const violations = [];

function requireAll(target, text, needles) {
  for (const needle of needles) {
    if (!text.includes(needle)) violations.push(`${target} must include ${needle}`);
  }
}

requireAll(layoutTarget, layout, [
  'PARALLEL: "parallel"',
  'SEQUENTIAL: "sequential"',
  'GROUPED: "grouped"',
  "const tasks = event.items.map",
  "return Promise.all(tasks);",
  "const result = await event.execute(event.items[index], index);",
  "const groupTasks = Array.from(groups.values()).map",
  "results[entry.index] = await event.execute(entry.item, entry.index);",
  "await Promise.all(groupTasks);",
]);
requireAll(layoutTestTarget, layoutTest, [
  "arranges every independent task before the final convergence wait",
  "keeps a causal sequence ordered and can stop after a rejected result",
  "runs identities in parallel while serializing tasks within each identity",
]);
requireAll(bridgeTarget, bridge, [
  "installAsyncTaskLayoutBridge",
  "events: AsyncTaskLayoutEvent",
  "run: runAsyncTaskLayout",
  "target.HVAA_asyncTaskLayout = bridge",
]);
requireAll(mainTarget, main, ['import "./core/async-task-layout-bridge.js"']);
requireAll(armoryTarget, armory, [
  "AsyncTaskLayoutEvent.PARALLEL",
  "items: categories",
  "staggerMs: deps.requestDelayMs",
  "const categoryResults = await runAsyncTaskLayout",
]);
requireAll(hvutTarget, hvut, [
  "var run_hvut_async_task_layout = function (layout, items, execute, policy = {})",
  "window.HVAA_asyncTaskLayout",
  "bridge.run({ ...policy, type: type, items: items, execute: execute })",
  "run_hvut_async_task_layout('SEQUENTIAL', items, buy",
  "run_hvut_async_task_layout('SEQUENTIAL', attach, attach_add",
  "run_hvut_async_task_layout('SEQUENTIAL', Array.from({ length: count })",
  "run_hvut_async_task_layout('GROUPED', urls",
  "identityOf: ([url]) => url",
  "run_hvut_async_task_layout('PARALLEL', filters, update)",
  "run_hvut_async_task_layout('PARALLEL', mobs, update)",
]);
if ((hvut.match(/run_hvut_async_task_layout\('SEQUENTIAL'/g) || []).length !== 4) {
  violations.push(`${hvutTarget} must keep four causal same-URL write layouts`);
}
if ((hvut.match(/run_hvut_async_task_layout\('GROUPED'/g) || []).length !== 2) {
  violations.push(`${hvutTarget} must keep two per-monster grouped write layouts`);
}
if (/Promise\.all\s*\(/.test(hvut)) {
  violations.push(`${hvutTarget} must not reintroduce untyped Promise.all network batches`);
}
if (hvut.includes("$ajax.repeat")) {
  violations.push(`${hvutTarget} must not reintroduce the retired eager repeat scheduler`);
}

if (violations.length) {
  console.error("[verify-async-task-layout-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-async-task-layout-boundary] OK - independent tasks fan out, causal writes serialize, and groups converge once"
);
