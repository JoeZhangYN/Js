const EVENT_RENDER_DROP_TABLE_BODY = "renderDropTableBody";
const EVENT_RENDER_USAGE_TABLE_BODY = "renderUsageTableBody";

export const BattleReportViewEvent = Object.freeze({
  RENDER_DROP_TABLE_BODY: EVENT_RENDER_DROP_TABLE_BODY,
  RENDER_USAGE_TABLE_BODY: EVENT_RENDER_USAGE_TABLE_BODY,
});

const USAGE_LABELS = {
  self: "<l0>自身 (次数)</l0><l1>自身 (次數)</l1><l2>Self (Frequency)</l2>",
  restore: "<l0>回复 (总量)</l0><l1>回复 (總量)</l1><l2>Restore (Amount)</l2>",
  items: "<l0>物品 (次数)</l0><l1>物品 (次數)</l1><l2>Items (Frequency)</l2>",
  magic: "<l0>技能 (次数)</l0><l1>技能 (次數)</l1><l2>Magic (Frequency)</l2>",
  damage: "<l0>伤害 (总量)</l0><l1>傷害 (總量)</l1><l2>Damage (Amount)</l2>",
  hurt: "<l0>受伤 (总量)</l0><l1>受傷 (總量)</l1><l2>Loss (Amount)</l2>",
  proficiency: "<l0>熟练度 (总量)</l0><l1>熟練度 (總量)</l1><l2>Proficiency (Amount)</l2>",
};

function renderHeader(columns) {
  return `<tr class="hvAATh"><td class="selectTable"></td>${columns.map((name) => `<td>${name}</td>`).join("")}</tr>`;
}

function renderDropTableBody(report) {
  if (report.mode === "single") {
    return `<tbody><tr class="hvAATh"><td></td><td><l0>数量</l0><l1>數量</l1><l2>Amount</l2></td></tr>${report.rows
      .map((row) => `<tr><td>${row.key}</td><td>${row.value}</td></tr>`)
      .join("")}</tbody>`;
  }
  return `<tbody>${renderHeader(report.columns)}${report.rows
    .map(
      (row) =>
        `<tr><td>${row.key}</td>${row.values.map((value) => `<td>${value}</td>`).join("")}</tr>`
    )
    .join("")}</tbody>`;
}

function renderUsageTableBody(report) {
  if (report.mode === "single") {
    return `<tbody>${report.sections
      .map(
        (section) =>
          `<tr class="hvAATh"><td>${USAGE_LABELS[section.key]}</td><td><l01>值</l01><l2>Value</l2></td></tr>${section.rows
            .map((row) => `<tr><td>${row.key}</td><td>${row.value}</td></tr>`)
            .join("")}`
      )
      .join("")}</tbody>`;
  }
  return `<tbody>${renderHeader(report.columns)}${report.sections
    .map(
      (section) =>
        `<tr class="hvAATh"><td colspan="${report.columns.length + 1}">${USAGE_LABELS[section.key]}</td></tr>${section.rows
          .map(
            (row) =>
              `<tr><td>${row.key}</td>${row.values.map((value) => `<td>${value}</td>`).join("")}</tr>`
          )
          .join("")}`
    )
    .join("")}</tbody>`;
}

export function runBattleReportViewAutomation(event) {
  if (event.type === EVENT_RENDER_DROP_TABLE_BODY) return renderDropTableBody(event.report);
  if (event.type === EVENT_RENDER_USAGE_TABLE_BODY) return renderUsageTableBody(event.report);
  return "";
}
