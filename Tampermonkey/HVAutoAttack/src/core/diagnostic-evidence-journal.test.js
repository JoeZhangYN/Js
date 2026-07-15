import { describe, expect, it, vi } from "vitest";
import {
  createDiagnosticEvidenceJournalCapability,
  DiagnosticEvidenceJournalEvent,
  writeDiagnosticSessionSnapshot,
} from "./diagnostic-evidence-journal.js";

describe("diagnostic evidence journal", () => {
  it("keeps at most 128 events and 64 KiB in memory", () => {
    const journal = createDiagnosticEvidenceJournalCapability();
    for (let index = 0; index < 140; index += 1) {
      journal.run({
        type: DiagnosticEvidenceJournalEvent.RECORD,
        key: `failure:${index % 4}`,
        value: JSON.stringify({ index, detail: "x".repeat(700) }),
      });
    }
    const snapshot = journal.run({ type: DiagnosticEvidenceJournalEvent.SNAPSHOT });
    expect(snapshot.entries.length).toBeLessThanOrEqual(128);
    expect(snapshot.totalBytes).toBeLessThanOrEqual(64 * 1024);
    expect(
      JSON.parse(journal.run({ type: DiagnosticEvidenceJournalEvent.READ, key: "failure:3" })).index
    ).toBe(139);
  });

  it("summarizes a single oversized record and can reset", () => {
    const journal = createDiagnosticEvidenceJournalCapability();
    journal.run({
      type: DiagnosticEvidenceJournalEvent.RECORD,
      key: "large",
      value: JSON.stringify({ capability: "probe", stage: "write", detail: "x".repeat(70_000) }),
    });
    expect(
      JSON.parse(journal.run({ type: DiagnosticEvidenceJournalEvent.READ, key: "large" }))
    ).toMatchObject({ truncated: true, capability: "probe", stage: "write" });
    expect(journal.run({ type: DiagnosticEvidenceJournalEvent.RESET })).toBe(true);
    expect(journal.run({ type: DiagnosticEvidenceJournalEvent.SNAPSHOT })).toEqual({
      entries: [],
      totalBytes: 0,
    });
  });

  it("deduplicates and bounds persisted failure snapshots", () => {
    const values = new Map();
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: vi.fn((key, value) => values.set(key, value)),
    };
    const evidence = { capability: "probe", stage: "write", detail: "x".repeat(70_000) };

    expect(writeDiagnosticSessionSnapshot("failure", evidence, storage)).toBe(true);
    expect(writeDiagnosticSessionSnapshot("failure", evidence, storage)).toBe(true);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(values.get("failure").length).toBeLessThan(64 * 1024);
    expect(JSON.parse(values.get("failure"))).toMatchObject({
      truncated: true,
      capability: "probe",
      stage: "write",
    });
  });
});
