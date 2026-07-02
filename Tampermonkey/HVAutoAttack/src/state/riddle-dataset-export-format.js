import { TimeEvent, runTimeAutomation } from "../core/time.js";

export function dataUrlToBytes(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  try {
    const bin = atob(dataUrl.slice(comma + 1));
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  } catch {
    return null;
  }
}

export function strBytes(str) {
  return new TextEncoder().encode(str);
}

export function toCanonicalSampleJson(entry) {
  const j = (entry && entry.json) || {};
  if (j.source) return j;
  const answers = Array.isArray(j.answer) ? j.answer.join(",") : j.answer || j.answers || "";
  const failed = j.is_failed === true;
  return {
    saved_at:
      j.saved_at ||
      (entry && entry.timestamp
        ? runTimeAutomation({ type: TimeEvent.ISO_TIMESTAMP, stamp: entry.timestamp })
        : ""),
    source: "ml",
    confidence: failed ? "low" : "high",
    answers,
    image_src: j.image_src || "unknown",
    legacy: { return: j.return, is_failed: j.is_failed, expire: j.expire },
  };
}

export function imgExt(dataUrl) {
  const m = /^data:image\/(\w+)/.exec(dataUrl || "");
  if (!m) return "webp";
  return m[1] === "jpeg" ? "jpg" : m[1];
}

export function sampleBaseName(key) {
  const raw = key.replace(/^saved_/, "").replace(/^(pony_|riddle_)/, "");
  const d = raw.replace(/\D/g, "");
  if (d.length >= 14) {
    return `pony_${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}_${d.slice(8, 10)}-${d.slice(10, 12)}-${d.slice(12, 14)}`;
  }
  return `pony_${raw}`;
}
