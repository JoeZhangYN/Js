import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const OUTPUT = fileURLToPath(new URL("../src/data/hvut-ability-live-evidence.js", import.meta.url));
const WORLDS = Object.freeze({ main: "", isekai: "/isekai" });
const ASSETS = Object.freeze([
  { asset: "5bf.png", family: "blue", state: "learned" },
  { asset: "7gf.png", family: "green", state: "learned" },
  { asset: "2rf.png", family: "red", state: "learned" },
  { asset: "1pf.png", family: "purple", state: "learned" },
  { asset: "2ru.png", family: "red", state: "unlockable" },
  { asset: "2x.png", family: "default", state: "locked" },
]);

const proxyConfigured = Boolean(process.env.HTTPS_PROXY || process.env.HTTP_PROXY);
const proxyFlagAvailable = process.allowedNodeEnvironmentFlags.has("--use-env-proxy");
if (proxyConfigured && proxyFlagAvailable && !process.execArgv.includes("--use-env-proxy")) {
  const result = spawnSync(process.execPath, ["--use-env-proxy", ...process.argv.slice(1)], {
    stdio: "inherit",
    windowsHide: true,
  });
  process.exit(result.status ?? 1);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function decodeRgbaPng(bytes) {
  if (!bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    throw new Error("notPng");
  }
  let offset = 8;
  let header;
  const compressed = [];
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    }
    if (type === "IDAT") compressed.push(data);
    offset += length + 12;
    if (type === "IEND") break;
  }
  if (!header || header.bitDepth !== 8 || header.colorType !== 6 || header.interlace !== 0) {
    throw new Error(`unsupportedPng:${JSON.stringify(header)}`);
  }
  const raw = inflateSync(Buffer.concat(compressed));
  const stride = header.width * 4;
  const pixels = Buffer.alloc(stride * header.height);
  for (let row = 0; row < header.height; row += 1) {
    const filter = raw[row * (stride + 1)];
    for (let column = 0; column < stride; column += 1) {
      const source = raw[row * (stride + 1) + column + 1];
      const index = row * stride + column;
      const left = column >= 4 ? pixels[index - 4] : 0;
      const above = row > 0 ? pixels[index - stride] : 0;
      const upperLeft = row > 0 && column >= 4 ? pixels[index - stride - 4] : 0;
      const predictor = [
        0,
        left,
        above,
        Math.floor((left + above) / 2),
        paeth(left, above, upperLeft),
      ][filter];
      if (predictor === undefined) throw new Error(`unsupportedPngFilter:${filter}`);
      pixels[index] = (source + predictor) & 255;
    }
  }
  const center = (Math.floor(header.height / 2) * header.width + Math.floor(header.width / 2)) * 4;
  let transparentPixels = 0;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] === 0) transparentPixels += 1;
  }
  return {
    width: header.width,
    height: header.height,
    centerRgba: Array.from(pixels.subarray(center, center + 4)),
    transparentPixels,
  };
}

async function captureAsset(world, prefix, definition, observedAt) {
  const url = `https://hentaiverse.org${prefix}/y/ab/${definition.asset}`;
  const response = await fetch(url);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok) throw new Error(`assetFetchFailed:${world}:${response.status}:${url}`);
  return {
    world,
    sourceIdentity: `${world}:publicAbilityAsset`,
    url,
    observedAt,
    reachability: "successful",
    status: response.status,
    contentType: response.headers.get("content-type"),
    byteLength: bytes.length,
    sha256: sha256(bytes),
    ...definition,
    ...decodeRgbaPng(bytes),
  };
}

async function capturePage(world, prefix, observedAt) {
  const query = world === "main" ? "?s=Character&ss=ab&tree=twohanded" : "?s=Character&ss=ab";
  const url = `https://hentaiverse.org${prefix}/${query}`;
  const response = await fetch(url);
  const bytes = Buffer.from(await response.arrayBuffer());
  const html = bytes.toString("utf8");
  return {
    world,
    sourceIdentity: `${world}:characterAbilityPage`,
    url,
    observedAt,
    status: response.status,
    contentType: response.headers.get("content-type"),
    byteLength: bytes.length,
    sha256: sha256(bytes),
    reachability: /<form[^>]+login/i.test(html) ? "authenticationRequired" : "successful",
    hasLoginForm: /<form[^>]+login/i.test(html),
    hasAbilitySurface: /id=["'](?:ability|ab_)/i.test(html),
  };
}

const observedAt = new Date().toISOString();
const assets = [];
const pages = [];
for (const [world, prefix] of Object.entries(WORLDS)) {
  for (const definition of ASSETS)
    assets.push(await captureAsset(world, prefix, definition, observedAt));
  pages.push(await capturePage(world, prefix, observedAt));
}
const evidence = {
  schemaVersion: 1,
  evidenceIdentity: "hvutAbilityLiveSurfaceObservation",
  observedAt,
  claimScope: "publicAssetsAndUnauthenticatedPageReachability",
  authenticatedDomStatus: "unknownAuthenticationRequired",
  assets,
  pages,
};
const serialized = JSON.stringify(evidence, null, 2);
const source = `// file-size-gate: exempt generated dual-world live evidence records\n// Generated by scripts/capture-hvut-ability-live-evidence.mjs --write.\nexport const HvutAbilityLiveEvidence = Object.freeze(\n  JSON.parse(String.raw\`${serialized}\`)\n);\n`;
if (process.argv.includes("--write")) {
  writeFileSync(OUTPUT, source);
  console.log(`[capture-hvut-ability-live-evidence] wrote ${OUTPUT}`);
} else {
  console.log(JSON.stringify(evidence, null, 2));
}
