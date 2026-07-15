export function measureLegacyRiddleSampleBytes(entry) {
  try {
    return new TextEncoder().encode(JSON.stringify(entry)).byteLength;
  } catch {
    return 0;
  }
}
