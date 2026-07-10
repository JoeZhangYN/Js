export const AsyncTaskLayoutEvent = Object.freeze({
  PARALLEL: "parallel",
  SEQUENTIAL: "sequential",
  GROUPED: "grouped",
});

function scheduleDefault(task, delayMs) {
  if (delayMs <= 0) return Promise.resolve().then(task);
  return new Promise((resolve, reject) => {
    setTimeout(() => Promise.resolve().then(task).then(resolve, reject), delayMs);
  });
}

function runParallel(event) {
  const schedule = event.schedule || scheduleDefault;
  const staggerMs = Math.max(0, Number(event.staggerMs) || 0);
  const tasks = event.items.map((item, index) =>
    schedule(() => event.execute(item, index), staggerMs * index)
  );
  return Promise.all(tasks);
}

async function runSequential(event) {
  const results = [];
  for (let index = 0; index < event.items.length; index += 1) {
    const result = await event.execute(event.items[index], index);
    results.push(result);
    if (event.shouldContinue && !event.shouldContinue(result, index)) break;
  }
  return results;
}

async function runGrouped(event) {
  const groups = new Map();
  event.items.forEach((item, index) => {
    const identity = event.identityOf(item, index);
    if (!groups.has(identity)) groups.set(identity, []);
    groups.get(identity).push({ item, index });
  });
  const results = [];
  const groupTasks = Array.from(groups.values()).map(async (entries) => {
    for (const entry of entries) {
      results[entry.index] = await event.execute(entry.item, entry.index);
    }
  });
  await Promise.all(groupTasks);
  return results;
}

export function runAsyncTaskLayout(event) {
  const items = Array.from(event?.items || []);
  const normalized = { ...event, items };
  if (event?.type === AsyncTaskLayoutEvent.PARALLEL) return runParallel(normalized);
  if (event?.type === AsyncTaskLayoutEvent.SEQUENTIAL) return runSequential(normalized);
  if (event?.type === AsyncTaskLayoutEvent.GROUPED) return runGrouped(normalized);
  return Promise.reject(new Error(`Unsupported async task layout: ${event?.type || "missing"}`));
}
