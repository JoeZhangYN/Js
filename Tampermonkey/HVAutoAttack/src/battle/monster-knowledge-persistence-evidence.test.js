import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiagnosticEvidenceKey } from "../core/diagnostic-evidence-keys.js";
import { recordMonsterKnowledgePersistenceFailure } from "./monster-knowledge-persistence-evidence.js";

beforeEach(() => {
  window.sessionStorage.clear();
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
    const warn = vi.fn();
    const sessionStorage = {
      setItem: () => {
        throw new Error("session blocked");
      },
    };

    expect(() =>
      recordMonsterKnowledgePersistenceFailure(
        { stage: "scan-store-hp", error: new Error("hp blocked") },
        { sessionStorage, warn }
      )
    ).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] monster knowledge persistence evidence failed",
      expect.objectContaining({ error: "session blocked" })
    );
  });

  it("returns persistence failure evidence when storage and warning diagnostics both fail", () => {
    const sessionStorage = {
      setItem: () => {
        throw new Error("quota");
      },
    };
    const warn = () => {
      throw new Error("console blocked");
    };

    expect(() =>
      recordMonsterKnowledgePersistenceFailure(
        { stage: "scan-cache-profile", error: new Error("cache blocked") },
        { sessionStorage, warn }
      )
    ).not.toThrow();
    expect(
      recordMonsterKnowledgePersistenceFailure(
        { stage: "scan-cache-profile", error: new Error("cache blocked") },
        { sessionStorage, warn }
      )
    ).toMatchObject({
      source: "monsterKnowledgePersistence",
      result: "failed",
      stage: "scan-cache-profile",
      error: "cache blocked",
    });
  });
});
