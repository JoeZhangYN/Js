import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

import { recordMonsterKnowledgePersistenceFailure } from "./monster-knowledge-persistence-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  mocks.runDiagnosticConsoleAutomation.mockReturnValue(true);
});

describe("recordMonsterKnowledgePersistenceFailure", () => {
  it("records typed monster knowledge persistence evidence", () => {
    const error = new Error("store blocked");
    error.failure = { source: "monsterDbStore", stage: "transaction-abort" };

    recordMonsterKnowledgePersistenceFailure({
      stage: "scan-store-profile",
      monsterId: 101,
      monsterName: "Dragon",
      error,
    });

    expect(
      JSON.parse(
        window.sessionStorage.getItem(DiagnosticEvidenceKey.BATTLE_MONSTER_KNOWLEDGE_PERSISTENCE)
      )
    ).toMatchObject({
      source: "monsterKnowledgePersistence",
      result: "failed",
      stage: "scan-store-profile",
      monsterId: 101,
      monsterName: "Dragon",
      error: "store blocked",
      cause: { source: "monsterDbStore", stage: "transaction-abort" },
    });
  });

  it("does not throw when persistence evidence storage is unavailable", () => {
    const sessionStorage = {
      setItem: () => {
        throw new Error("session blocked");
      },
    };

    expect(() =>
      recordMonsterKnowledgePersistenceFailure(
        { stage: "scan-store-hp", error: new Error("hp blocked") },
        { sessionStorage }
      )
    ).not.toThrow();
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] monster knowledge persistence evidence failed",
        expect.objectContaining({ error: "session blocked" }),
      ],
    });
  });

  it("returns persistence failure evidence when storage and typed warning diagnostics both fail", () => {
    const sessionStorage = {
      setItem: () => {
        throw new Error("quota");
      },
    };
    mocks.runDiagnosticConsoleAutomation.mockReturnValue(false);

    expect(() =>
      recordMonsterKnowledgePersistenceFailure(
        { stage: "scan-cache-profile", error: new Error("cache blocked") },
        { sessionStorage }
      )
    ).not.toThrow();
    expect(
      recordMonsterKnowledgePersistenceFailure(
        { stage: "scan-cache-profile", error: new Error("cache blocked") },
        { sessionStorage }
      )
    ).toMatchObject({
      source: "monsterKnowledgePersistence",
      result: "failed",
      stage: "scan-cache-profile",
      error: "cache blocked",
    });
  });
});
