// 配置表单采集能力：把 settings UI 控件统一转换为 option 对象。

const EVENT_COLLECT_OPTION = "collectOption";

export const SettingsFormOptionEvent = Object.freeze({
  COLLECT_OPTION: EVENT_COLLECT_OPTION,
});

const settingsFormOptionEventHandlers = Object.freeze({
  [EVENT_COLLECT_OPTION]: (event) => collectOption(event),
});

function writeNestedOption(option, field) {
  const { name, value, mode } = field;
  const path = name.split("_");
  if (path.length === 1) {
    option[name] = value;
    return;
  }
  if (!(path[0] in option)) option[path[0]] = {};
  if (mode === "grouped") {
    if (typeof option[path[0]][path[1]] === "undefined") option[path[0]][path[1]] = [];
    option[path[0]][path[1]].push(value);
  } else {
    option[path[0]][path[1]] = value;
  }
}

function hasInputClass(input, className) {
  if (input?.classList?.contains?.(className)) return true;
  return String(input?.className || "")
    .split(/\s+/)
    .includes(className);
}

function readInputValue(input) {
  if (hasInputClass(input, "hvAADebug")) return undefined;
  if (hasInputClass(input, "hvAANumber")) {
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
    writeNestedOption(option, {
      ...field,
      mode: hasInputClass(input, "customizeInput") ? "grouped" : "scalar",
    });
  }
  return option;
}

export function runSettingsFormOptionAutomation(event = { type: EVENT_COLLECT_OPTION }) {
  return settingsFormOptionEventHandlers[event?.type]?.(event);
}
