/**
 * Monster identity matching entry.
 *
 * Normalizes the name shape used only for runtime matching between battle log
 * text and DOM/status names. Storage keys keep their original scanned names.
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeMonsterName(name) {
  return (name || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(?:a|an|the) /i, "");
}
