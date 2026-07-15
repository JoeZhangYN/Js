import { strBytes, toCanonicalSampleJson } from "./riddle-dataset-export-format.js";

function hex(bytes) {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function fnv1a32(chunks) {
  let hash = 0x811c9dc5;
  for (const chunk of chunks) {
    for (const value of chunk) {
      hash ^= value;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return `fnv1a32:${hash.toString(16).padStart(8, "0")}`;
}

export function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const match = /^data:([^;,]+)(?:;base64)?$/.exec(dataUrl.slice(0, comma));
  try {
    const binary = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: match?.[1] || "application/octet-stream" });
  } catch {
    return null;
  }
}

export function riddleSampleMetadata(record) {
  return {
    saved_at: record.savedAt,
    source: record.source,
    confidence: record.confidence,
    answers: record.answers,
    image_src: record.imageSrc,
  };
}

export async function hashRiddleSampleContent(metadata, imageBlob, cryptoApi = globalThis.crypto) {
  const metadataBytes = strBytes(JSON.stringify(metadata));
  const imageBytes = imageBlob ? new Uint8Array(await imageBlob.arrayBuffer()) : new Uint8Array();
  const chunks = [metadataBytes, imageBytes];
  if (cryptoApi?.subtle?.digest) {
    try {
      const combined = new Uint8Array(metadataBytes.byteLength + imageBytes.byteLength);
      combined.set(metadataBytes);
      combined.set(imageBytes, metadataBytes.byteLength);
      const digest = await cryptoApi.subtle.digest("SHA-256", combined);
      return `sha256:${hex(new Uint8Array(digest))}`;
    } catch {
      // Deterministic fallback keeps migration verification available in restricted contexts.
    }
  }
  return fnv1a32(chunks);
}

export async function createRiddleSampleRecord(
  { id, savedAt, timestamp, source, confidence, answers, imageSrc, imageBlob },
  deps = {}
) {
  const metadata = { saved_at: savedAt, source, confidence, answers, image_src: imageSrc };
  const metadataBytes = strBytes(JSON.stringify(metadata)).byteLength;
  const contentHash = await hashRiddleSampleContent(metadata, imageBlob, deps.cryptoApi);
  const imageBytes = imageBlob?.size || 0;
  return Object.freeze({
    id,
    savedAt,
    timestamp,
    source,
    confidence,
    answers,
    imageSrc,
    imageBlob,
    imageType: imageBlob?.type || null,
    imageBytes,
    metadataBytes,
    totalBytes: metadataBytes + imageBytes,
    contentHash,
  });
}

export async function legacyRiddleSampleRecord(sourceKey, entry, deps = {}) {
  const metadata = toCanonicalSampleJson(entry);
  const imageBlob = dataUrlToBlob(entry?.imageBase64);
  const timestamp = Number(entry?.timestamp) || 0;
  return createRiddleSampleRecord(
    {
      id: `legacy:${sourceKey}`,
      savedAt: metadata.saved_at || new Date(timestamp).toISOString(),
      timestamp,
      source: metadata.source || "ml",
      confidence: metadata.confidence || "high",
      answers: metadata.answers || "",
      imageSrc: metadata.image_src || "unknown",
      imageBlob,
    },
    deps
  );
}
