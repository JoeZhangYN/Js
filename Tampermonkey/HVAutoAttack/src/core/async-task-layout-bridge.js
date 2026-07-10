import { AsyncTaskLayoutEvent, runAsyncTaskLayout } from "./async-task-layout.js";

export function installAsyncTaskLayoutBridge(target = window) {
  const bridge = Object.freeze({ events: AsyncTaskLayoutEvent, run: runAsyncTaskLayout });
  target.HVAA_asyncTaskLayout = bridge;
  return bridge;
}

if (typeof window !== "undefined") installAsyncTaskLayoutBridge(window);
