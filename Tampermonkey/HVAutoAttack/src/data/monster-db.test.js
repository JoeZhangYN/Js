// scan 解析回归锁：用**真实 HV scan 面板 HTML**(2026-06-25 console 实测) 锁住 parseScanResult。
// 背景：旧上游单条巨正则对当前 HV NO MATCH（跨多行 + Trainer 排 Class 之前），自采 scan 全失效；
// 本锁防再退化成"只过 mock 不过真站"。
import { describe, it, expect } from "vitest";
import { parseScanResult, checkScanResultValidity, RESIST_KEYS } from "./monster-db.js";

// 真实 scan 面板（9 抗 + 战斗参数齐全；结构逐字对齐实测 DOM）。
const RESISTS = [
  ["Fire", "+", 50],
  ["Cold", "+", 37],
  ["Elec", "+", 75],
  ["Wind", "+", 50],
  ["Holy", "+", 62],
  ["Dark", "+", 62],
  ["Crushing", "+", 25],
  ["Slashing", "+", 25],
  ["Piercing", "+", 0],
];
const resistDiv = ([label, s, v]) =>
  `<div style="width:110px; float:left; padding-right:10px"><div style="width:60px; float:left; text-align:right">${label}:</div><div style="width:40px; float:left; text-align:right; font-weight:bold; padding-left:5px">${s}${v}%</div><div style="clear:both"></div></div>`;

const REAL_SCAN = `<strong>Scanning Deep Learning...</strong> &nbsp; &nbsp; HP: 110762 / 110816 &nbsp; &nbsp; MP: 43% &nbsp; &nbsp; SP: 41%<br>
<table>
<tbody><tr><td style="width:100px; text-align:right; padding-right:5px"><strong>Monster Trainer:</strong></td><td>vplusvvisvvv</td></tr>
    <tr>
        <td><strong>Monster Class:</strong></td>
        <td colspan="2">Dragonkin, Power Level 2250</td>
    </tr>
    <tr>
        <td><strong>Melee Attack:</strong></td>
        <td colspan="2">Piercing; Accuracy 296.0 (87.1% hit chance against player)</td>
    </tr>
    <tr>
        <td><strong>Avoidance:</strong></td>
        <td colspan="2">Evade 609.3 (17.1% base chance vs player attack, 58.2% base chance vs player magic)</td>
    </tr>
    <tr>
        <td><strong>Intercept:</strong></td>
        <td colspan="2">Parry 912.5 (24.9% base chance vs player attack) &nbsp; Resist 821.3 (54.9% base chance vs player magic)</td>
    </tr>
    <tr>
        <td><strong>Resists:</strong></td>
        <td colspan="2"><div style="width:400px">${RESISTS.map(resistDiv).join("")}<div style="clear:both"></div></div></td>
    </tr>
</tbody></table>`;

describe("parseScanResult（真实 HV scan 面板）", () => {
  const info = parseScanResult(REAL_SCAN, "2026-06-25");

  it("非 null（修旧 R_SCAN 对当前 HV 的 NO MATCH）", () => {
    expect(info).not.toBeNull();
  });

  it("身份 + 固有 PL + trainer + 攻击类型", () => {
    expect(info).toMatchObject({
      monsterName: "Deep Learning",
      monsterClass: "Dragonkin",
      plvl: 2250,
      trainer: "vplusvvisvvv",
      attack: "Piercing",
      lastUpdate: "2026-06-25",
    });
  });

  it("九抗逐项正确（含 Piercing +0）", () => {
    expect(info.fire).toBe(50);
    expect(info.cold).toBe(37);
    expect(info.elec).toBe(75);
    expect(info.holy).toBe(62);
    expect(info.crushing).toBe(25);
    expect(info.piercing).toBe(0);
    expect(RESIST_KEYS.every((k) => typeof info[k] === "number")).toBe(true);
  });

  it("新增战斗参数（命中/闪避物·法/招架/法抗/MP·SP/cur·maxHP）全部抓到", () => {
    expect(info).toMatchObject({
      accuracy: 296,
      hitChance: 87.1,
      evade: 609.3,
      evadeVsAttack: 17.1,
      evadeVsMagic: 58.2,
      parry: 912.5,
      parryChance: 24.9,
      magicResist: 821.3,
      magicResistChance: 54.9,
      mpPct: 43,
      spPct: 41,
      curHP: 110762,
      maxHP: 110816,
    });
  });

  it("非 scan 行 / 空 → null（不抛）", () => {
    expect(parseScanResult("You hit the Orc for 100 damage", "2026-06-25")).toBeNull();
    expect(parseScanResult("", "2026-06-25")).toBeNull();
    expect(parseScanResult(null, "2026-06-25")).toBeNull();
  });

  it("缺九抗（不完整 scan）→ null（与旧'抗性不全不入库'语义一致）", () => {
    const partial =
      "<strong>Scanning Foo...</strong> Monster Class:</strong></td><td>Beast, Power Level 100</td>";
    expect(parseScanResult(partial, "2026-06-25")).toBeNull();
  });
});

describe("checkScanResultValidity", () => {
  it("含污染 debuff（imperil 等）→ false（不入库）", () => {
    expect(checkScanResultValidity('<img src="imperil.png">')).toBe(false);
    expect(checkScanResultValidity("<div>clean</div>")).toBe(true);
    expect(checkScanResultValidity(undefined)).toBe(false);
  });
});
