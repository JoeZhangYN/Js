const EQUIPMENT_FULL_EVENTPANE_RE =
  /<p[^>]*class=["'][^"']*\bmessagebox_error\b[^"']*["'][^>]*>\s*Your equipment inventory is full\s*<\/p>/i;

export function classifyWidgetUnavailableReason(eventpane = "") {
  if (EQUIPMENT_FULL_EVENTPANE_RE.test(eventpane)) return "equipmentInventoryFull";
  return "encounterKeyMissing";
}
