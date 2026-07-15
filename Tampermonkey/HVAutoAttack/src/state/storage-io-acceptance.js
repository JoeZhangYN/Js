import { storageIoPolicyOf, StorageAuthority } from "./storage-io-policy.js";
import { runStorageIoMetricsAutomation, StorageIoMetricsEvent } from "./storage-io-metrics.js";

export const StorageIoAcceptanceEvent = Object.freeze({
  BEGIN: "begin",
  REPORT: "report",
});

export function createStorageIoAcceptanceCapability(deps = {}) {
  const runMetrics = deps.runMetrics || runStorageIoMetricsAutomation;
  const now = deps.now || (() => new Date().toISOString());
  let startedAt = null;

  function begin() {
    runMetrics({ type: StorageIoMetricsEvent.RESET });
    startedAt = now();
    return Object.freeze({
      status: "recording",
      startedAt,
      workload: "Run a representative battle or leave the page active, then open the report.",
    });
  }

  function report() {
    const metrics = runMetrics({ type: StorageIoMetricsEvent.SNAPSHOT });
    const gm = Object.values(metrics).filter(
      (metric) => storageIoPolicyOf(metric.identity).authority === StorageAuthority.GM
    );
    const gmPhysicalWrites = gm.reduce((total, metric) => total + metric.physicalWrites, 0);
    const gmLogicalBytesWritten = gm.reduce(
      (total, metric) => total + metric.logicalBytesWritten,
      0
    );
    if (!startedAt) {
      return Object.freeze({
        status: "notRecording",
        startedAt: null,
        observedAt: now(),
        gmPhysicalWrites,
        gmLogicalBytesWritten,
        reductionFloorPercent: null,
        externalWriteClassification:
          "Begin an acceptance window on the page to observe before classifying Edge IO.",
        metrics,
      });
    }
    const accepted = gmPhysicalWrites === 0;
    return Object.freeze({
      status: accepted ? "accepted" : "applicationWritesObserved",
      startedAt,
      observedAt: now(),
      gmPhysicalWrites,
      gmLogicalBytesWritten,
      reductionFloorPercent: accepted ? 100 : null,
      externalWriteClassification: accepted
        ? "Edge/Tampermonkey LevelDB growth during this zero-app-write window is external state."
        : "Application-attributed GM writes were observed; inspect metrics before classifying Edge IO.",
      metrics,
    });
  }

  return Object.freeze({
    run(event) {
      if (event?.type === StorageIoAcceptanceEvent.BEGIN) return begin();
      if (event?.type === StorageIoAcceptanceEvent.REPORT) return report();
      return undefined;
    },
  });
}

const currentStorageIoAcceptance = createStorageIoAcceptanceCapability();

export function runStorageIoAcceptanceAutomation(event) {
  return currentStorageIoAcceptance.run(event);
}
