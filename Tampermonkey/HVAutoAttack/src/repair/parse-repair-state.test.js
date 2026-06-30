import { describe, it, expect } from "vitest";
import { RepairStateParseEvent, runRepairStateParser } from "./parse-repair-state.js";

/** 用 happy-dom 全局 DOMParser 造 Document（主世界 parse 吃 document）。 */
function doc(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

function parsePersistentRepairState(pageDoc, dynjsText) {
  return runRepairStateParser({
    type: RepairStateParseEvent.PERSISTENT,
    pageDoc,
    dynjsText,
  });
}

function parseIsekaiRepairState(pageText) {
  return runRepairStateParser({
    type: RepairStateParseEvent.ISEKAI,
    pageText,
  });
}

describe("repair state parser entry — persistent", () => {
  it("rejects unknown parser events without choosing a world parser", () => {
    expect(
      runRepairStateParser({
        type: "unknown",
        pageDoc: doc("<div></div>"),
        dynjsText: `x = {"100":{"d":"Condition: 1000 / 1000 (100%)"}};`,
        pageText: `<script>var eqitems = {"100":{"m":{"50000":1}}};</script>`,
      })
    ).toBeUndefined();
  });

  it("解析耐久% + set_forge_cost 材料（枚举来自 dynjs JSON keys）", () => {
    // 真实维修页装备数据在 dynjs；set_forge_cost 提供每件材料（在页 HTML 里，容器无关）。
    const html = `<div class="equiplist">
      <div onclick="set_forge_cost(308838159,'Requires: 5x Crystal of Flames, 3x Binding of Slaughter')">...</div>
    </div>`;
    const dynjs = `equip = {"308838159":{"d":"Legendary Rapier Tier 7 Condition: 250 / 1000 (25%) Energy: 100%"}};`;
    const state = parsePersistentRepairState(doc(html), dynjs);
    expect(state.isIsekai).toBe(false);
    expect(state.token).toBe(null);
    expect(state.equips).toEqual([
      {
        id: "308838159",
        conditionPct: 25,
        materials: [
          { matId: null, name: "Crystal of Flames", count: 5 },
          { matId: null, name: "Binding of Slaughter", count: 3 },
        ],
      },
    ]);
  });

  it("满耐久件无 set_forge_cost → 材料为空（仍带回供阈值判定）", () => {
    const dynjs = `x = {"100":{"d":"Condition: 1000 / 1000 (100%)"}};`;
    const state = parsePersistentRepairState(doc("<div></div>"), dynjs);
    expect(state.equips).toEqual([{ id: "100", conditionPct: 100, materials: [] }]);
  });

  it("无耐久字段（不可解析）→ 跳过不崩", () => {
    const dynjs = `x = {"200":{"d":"No condition here"}};`;
    expect(parsePersistentRepairState(doc("<div></div>"), dynjs).equips).toEqual([]);
  });

  it("dynjs 解析失败 → 空 equips 不崩", () => {
    expect(parsePersistentRepairState(doc("<div></div>"), "garbage").equips).toEqual([]);
  });

  it("页面无 .eqp 节点也能枚举（枚举来自 dynjs keys 而非 DOM — 主世界修复失效根因回归）", () => {
    // 真实 ?s=Forge&ss=re 页无 `.eqp>[id]` 结构；旧实现据此枚举 → 0 件 → 静默不修。
    const html = `<div class="equiplist"><div onclick="set_forge_cost(555,'Requires: 2x Repair Kit')">x</div></div>`;
    const dynjs = `var equipment = {"555":{"d":"Condition: 300 / 1000 (30%)"}};`;
    const state = parsePersistentRepairState(doc(html), dynjs);
    expect(state.equips).toEqual([
      { id: "555", conditionPct: 30, materials: [{ matId: null, name: "Repair Kit", count: 2 }] },
    ]);
  });

  it("dynjs 含换行也能解析（首/末花括号切片，非 /\\{.*\\}/）", () => {
    const dynjs = `var equipment =\n{\n"777":{"d":"Condition: 500 / 1000 (50%)"}\n};\n`;
    const state = parsePersistentRepairState(doc("<div></div>"), dynjs);
    expect(state.equips).toEqual([{ id: "777", conditionPct: 50, materials: [] }]);
  });
});

describe("repair state parser entry — isekai", () => {
  const page = `
    <form id="equipform"><input type="hidden" name="postoken" value="tok_abc123"></form>
    <script>
      var eqitems = {"100":{"m":{"50000":3,"62000":1}},"200":{"m":{"50001":2}},"300":{}};
      var itemdata = {"50000":{"n":"Repair Outfit","c":1},"50001":{"n":"Repair Kit","c":5},"62000":{"n":"Aether Shard","c":0}};
    </script>`;

  it("需修件 = 有非空 .m；护符料 62000 剔除；满修件 300 跳过；token 解析", () => {
    const state = parseIsekaiRepairState(page);
    expect(state.isIsekai).toBe(true);
    expect(state.token).toBe("tok_abc123");
    expect(state.equips).toEqual([
      {
        id: "100",
        conditionPct: null,
        materials: [{ matId: "50000", name: "Repair Outfit", count: 3 }],
      },
      {
        id: "200",
        conditionPct: null,
        materials: [{ matId: "50001", name: "Repair Kit", count: 2 }],
      },
    ]);
  });

  it("仅护符料损坏的件 → 整件剔除（不纳入自动维修）", () => {
    const onlyCharm = `<script>
      var eqitems = {"400":{"m":{"63000":1}}};
      var itemdata = {"63000":{"n":"Charm","c":0}};
    </script>`;
    expect(parseIsekaiRepairState(onlyCharm).equips).toEqual([]);
  });

  it("eqitems 缺失 → 空 equips 不崩，token 为 null", () => {
    const state = parseIsekaiRepairState("<div>nothing</div>");
    expect(state.equips).toEqual([]);
    expect(state.token).toBe(null);
  });
});
