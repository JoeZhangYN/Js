import { describe, expect, it } from "vitest";
import { RepairBackendEvent, runRepairBackendAutomation } from "./repair-backend.js";

function createBackendForTest(isIsekai, post) {
  return runRepairBackendAutomation({ type: RepairBackendEvent.CREATE, isIsekai }, { post });
}

describe("repair backend HTTP failures", () => {
  it("routes isekai fetch-state HTTP failures to the failure callback", () => {
    const failure = { kind: "networkError", href: "?s=Bazaar&ss=am&screen=repair", retries: 4 };
    const post = (_href, _func, _parm, _type, onFailure) => onFailure(failure);
    const onState = () => {
      throw new Error("state callback must not run");
    };
    const onFailure = (value) => {
      expect(value).toBe(failure);
    };

    createBackendForTest(true, post).fetchState(onState, onFailure);
  });

  it("routes persistent dynjs HTTP failures to the failure callback", () => {
    const pageDoc = new DOMParser().parseFromString(
      '<script src="https://hentaiverse.org/dynjs/equip/abc"></script>',
      "text/html"
    );
    const failure = { kind: "httpStatus", href: "https://hentaiverse.org/dynjs/equip/abc", status: 500 };
    const post = (_href, func, _parm, _type, onFailure) => {
      if (_href === "?s=Forge&ss=re") {
        func(pageDoc);
        return;
      }
      onFailure(failure);
    };

    createBackendForTest(false, post).fetchState(() => {}, (value) => {
      expect(value).toBe(failure);
    });
  });

  it("routes submit-repair HTTP failures to the failure callback", () => {
    const failure = { kind: "networkError", href: "?s=Forge&ss=re", retries: 4 };
    const post = (_href, _func, _parm, _type, onFailure) => onFailure(failure);

    createBackendForTest(false, post).submitRepair(["7"], () => {}, (value) => {
      expect(value).toBe(failure);
    });
  });
});
