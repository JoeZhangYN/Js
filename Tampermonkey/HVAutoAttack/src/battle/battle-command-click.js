export function clickBattleCommandElement(element) {
  try {
    element.click();
    return { clicked: true };
  } catch (error) {
    return {
      clicked: false,
      reason: "clickFailed",
      error: error?.message || String(error),
    };
  }
}
