import { describe, it, expect } from "vitest";
import { RepairBackendEvent, runRepairBackendAutomation } from "./repair-backend.js";

/** 序列化 fake post：按调用顺序回放 responses[i]，记录每次 (href, parm, type)。 */
function fakePost(responses) {
  const calls = [];
  const post = (href, func, parm, type) => {
    calls.push({ href, parm, type });
    func(responses[calls.length - 1]);
  };
  return { post, calls };
}

function makeRepairBackend(post) {
  return runRepairBackendAutomation({ type: RepairBackendEvent.CREATE }, { post });
}

describe("repair backend entry", () => {
  it("rejects unknown backend events without creating a backend", () => {
    const { post } = fakePost([]);

    expect(runRepairBackendAutomation({ type: "unknown" }, { post })).toBeUndefined();
  });

  it("rejects null backend events without creating a backend", () => {
    const { post, calls } = fakePost([]);

    expect(runRepairBackendAutomation(null, { post })).toBeUndefined();
    expect(calls).toEqual([]);
  });
});

describe("world-invariant Armory repair authority", () => {
  it("uses Bazaar Armory repair page and postoken submit body", () => {
    const pageText =
      `<form id="equipform"><input name="postoken" value="tokp"></form>` +
      `<script>var eqitems={"5":{"m":{"50000":2}}};var itemdata={"50000":{"n":"Repair Kit","c":0}};</script>`;
    const { post, calls } = fakePost([pageText, ""]);
    const backend = makeRepairBackend(post);
    let state;
    backend.fetchState((s) => {
      state = s;
    });
    expect(calls[0]).toMatchObject({
      href: "?s=Bazaar&ss=am&screen=repair",
      parm: null,
      type: "text",
    });
    expect(state).toMatchObject({
      token: "tokp",
      equips: [
        {
          id: "5",
          conditionPct: null,
          materials: [{ matId: "50000", name: "Repair Kit", count: 2 }],
        },
      ],
    });

    backend.submitRepair(["5"], () => {});
    expect(calls[1].href).toBe("?s=Bazaar&ss=am&screen=repair");
    expect(calls[1].parm).toBe("postoken=tokp&eqids[]=5");
  });
});

describe("repair session token", () => {
  it("uses the postoken returned by fetchState in submitRepair", () => {
    const pageText =
      `<form id="equipform"><input name="postoken" value="tok9"></form>` +
      `<script>var eqitems={"5":{"m":{"50000":2}}};var itemdata={"50000":{"n":"Repair Kit","c":0}};</script>`;
    const { post, calls } = fakePost([pageText, ""]);
    const backend = makeRepairBackend(post);
    let state;
    backend.fetchState((s) => {
      state = s;
    });
    expect(state.token).toBe("tok9");
    expect(state.equips).toEqual([
      {
        id: "5",
        conditionPct: null,
        materials: [{ matId: "50000", name: "Repair Kit", count: 2 }],
      },
    ]);
    backend.submitRepair(["5"], () => {});
    expect(calls[1].parm).toBe("postoken=tok9&eqids[]=5");
  });
});
