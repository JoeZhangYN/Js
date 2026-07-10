import { describe, expect, it } from "vitest";
import { RepairBackendEvent, runRepairBackendAutomation } from "./repair-backend.js";

function createBackendForTest(post) {
  return runRepairBackendAutomation({ type: RepairBackendEvent.CREATE }, { post });
}

describe("repair backend HTTP failures", () => {
  it("routes fetch-state HTTP failures to the failure callback", () => {
    const failure = { kind: "networkError", href: "?s=Bazaar&ss=am&screen=repair", retries: 4 };
    const post = (_href, _func, _parm, _type, onFailure) => onFailure(failure);
    const onState = () => {
      throw new Error("state callback must not run");
    };
    const onFailure = (value) => {
      expect(value).toBe(failure);
    };

    createBackendForTest(post).fetchState(onState, onFailure);
  });

  it("routes Armory HTTP status failures to the failure callback", () => {
    const failure = { kind: "httpStatus", href: "?s=Bazaar&ss=am&screen=repair", status: 500 };
    const post = (_href, _func, _parm, _type, onFailure) => onFailure(failure);

    createBackendForTest(post).fetchState(
      () => {},
      (value) => {
        expect(value).toBe(failure);
      }
    );
  });

  it("routes submit-repair HTTP failures to the failure callback", () => {
    const failure = { kind: "networkError", href: "?s=Bazaar&ss=am&screen=repair", retries: 4 };
    const post = (_href, _func, _parm, _type, onFailure) => onFailure(failure);

    createBackendForTest(post).submitRepair(
      ["7"],
      () => {},
      (value) => {
        expect(value).toBe(failure);
      }
    );
  });
});
