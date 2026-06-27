// 配置表单采集能力：把 settings UI 控件统一转换为 option 对象。

const EVENT_COLLECT_OPTION = "collectOption";

export const SettingsFormOptionEvent = Object.freeze({
  COLLECT_OPTION: EVENT_COLLECT_OPTION,
});

function writeNestedOption(option, name, value, className) {
  const path = name.split("_");
  if (path.length === 1) {
    option[name] = value;
    return;
  }
  if (!(path[0] in option)) option[path[0]] = {};
  if (className === "customizeInput") {
    if (typeof option[path[0]][path[1]] === "undefined") option[path[0]][path[1]] = [];
    option[path[0]][path[1]].push(value);
  } else {
    option[path[0]][path[1]] = value;
  }
}

function readInputValue(input) {
  if (input.className === "hvAADebug") return undefined;
  if (input.className === "hvAANumber") {
    const value = Number(input.value || input.placeholder);
    return Number.isNaN(value) ? undefined : { name: input.name, value };
  }
  if (input.type === "text" || input.type === "hidden") {
    const value = input.value || input.placeholder;
    return value === "" ? undefined : { name: input.name, value };
  }
  if (input.type === "checkbox") {
    if (input.checked === false && !input.hasAttribute("data-default-on")) return undefined;
    return { name: input.id, value: input.checked };
  }
  if (input.type === "select-one") return { name: input.name, value: input.value };
  return undefined;
}

function collectOption({ version, inputs = [] }) {
  const option = { version };
  for (const input of inputs) {
    const field = readInputValue(input);
    if (!field) continue;
    writeNestedOption(option, field.name, field.value, input.className);
  }
  return option;
}

export function runSettingsFormOptionAutomation(event = { type: EVENT_COLLECT_OPTION }) {
  if (event.type === EVENT_COLLECT_OPTION) return collectOption(event);
  return undefined;
}
