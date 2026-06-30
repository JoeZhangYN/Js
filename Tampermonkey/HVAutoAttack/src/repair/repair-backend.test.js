import { describe, it, expect } from "vitest";
import { RepairBackendEvent, runRepairBackendAutomation } from "./repair-backend.js";

/** happy-dom 全局 DOMParser 造主世界 forge 页 Document。 */
function doc(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

/** 序列化 fake post：按调用顺序回放 responses[i]，记录每次 (href, parm, type)。 */
function fakePost(responses) {
  const calls = [];
  const post = (href, func, parm, type) => {
    calls.push({ href, parm, type });
    func(responses[calls.length - 1]);
  };
  return { post, calls };
}

function makeRepairBackend(isIsekai, post) {
  return runRepairBackendAutomation({ type: RepairBackendEvent.CREATE, isIsekai }, { post });
}

describe("repair backend entry", () => {
  it("rejects unknown backend events without creating a backend", () => {
    const { post } = fakePost([]);

    expect(runRepairBackendAutomation({ type: "unknown", isIsekai: false }, { post })).toBeUndefined();
  });
});

describe("makeRepairBackend 主世界 fetchState（dynjs 选择器 + cache-buster 反退化）", () => {
  it("用 script[src*=/dynjs/] 取 dynjs + URL 带 cache-buster；耐久/材料解析对", () => {
    const pageDoc = doc(
      `<div class="equiplist"><div onclick="set_forge_cost(1,'Requires: 2x Repair Kit')">x</div></div>` +
        `<script src="https://hentaiverse.org/dynjs/equip/abc"></script>`
    );
    const dynjsText = `var x={"1":{"d":"Condition: 100 / 1000 (10%)"}};`;
    const { post, calls } = fakePost([pageDoc, dynjsText]);
    let state;
    makeRepairBackend(false, post).fetchState((s) => {
      state = s;
    });

    expect(calls[0].href).toBe("?s=Forge&ss=re");
    // 第二段取 dynjs：命中 /dynjs/ 选择器 + 必带 cache-buster（防修后复验读旧耐久误触 stop-stuck）
    expect(calls[1].href).toContain("/dynjs/equip/abc");
    expect(calls[1].href).toMatch(/[?&]t=\d+/);
    expect(state.equips).toEqual([
      { id: "1", conditionPct: 10, materials: [{ matId: null, name: "Repair Kit", count: 2 }] },
    ]);
  });

  it("无 /dynjs/ 命中 → 回退 #mainpane>script[src]", () => {
    const pageDoc = doc(
      `<div id="mainpane"><script src="https://hentaiverse.org/other/x.js"></script></div>`
    );
    const dynjsText = `var x={"2":{"d":"Condition: 200 / 1000 (20%)"}};`;
    const { post, calls } = fakePost([pageDoc, dynjsText]);
    let state;
    makeRepairBackend(false, post).fetchState((s) => {
      state = s;
    });
    expect(calls[1].href).toContain("/other/x.js");
    expect(state.equips).toEqual([{ id: "2", conditionPct: 20, materials: [] }]);
  });

  it("无任何 dynjs 脚本 → 空状态（只取 forge 页一次、不二次取、不崩）", () => {
    const pageDoc = doc(`<div class="equiplist">no script here</div>`);
    const { post, calls } = fakePost([pageDoc]);
    let state;
    makeRepairBackend(false, post).fetchState((s) => {
      state = s;
    });
    expect(calls.length).toBe(1);
    expect(state.equips).toEqual([]);
  });
});

describe("makeRepairBackend 异世界（token 由 fetchState 取、submitRepair 用）", () => {
  it("submitRepair 带 postoken + eqids[]", () => {
    const pageText =
      `<form id="equipform"><input name="postoken" value="tok9"></form>` +
      `<script>var eqitems={"5":{"m":{"50000":2}}};var itemdata={"50000":{"n":"Repair Kit","c":0}};</script>`;
    const { post, calls } = fakePost([pageText, ""]);
    const backend = makeRepairBackend(true, post);
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
