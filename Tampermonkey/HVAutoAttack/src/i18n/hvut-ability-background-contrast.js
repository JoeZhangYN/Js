export const HvutAbilityPointTone = Object.freeze({
  DARK: "dark",
  LIGHT: "light",
});

const WHITE = Object.freeze({ red: 255, green: 255, blue: 255, alpha: 1 });

function channel(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(255, number)) : null;
}

function alpha(value) {
  const number = value === undefined ? 1 : Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : null;
}

function parseCssColor(value) {
  if (typeof value !== "string") return null;
  if (value.trim().toLowerCase() === "transparent") {
    return { red: 0, green: 0, blue: 0, alpha: 0 };
  }
  const match = /^rgba?\(\s*([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*(?:,|\/)\s*([\d.]+))?\s*\)$/i.exec(
    value.trim()
  );
  if (!match) return null;
  const parsed = {
    red: channel(match[1]),
    green: channel(match[2]),
    blue: channel(match[3]),
    alpha: alpha(match[4]),
  };
  return Object.values(parsed).some((part) => part === null) ? null : parsed;
}

function composite(foreground, background) {
  const mixedAlpha = foreground.alpha + background.alpha * (1 - foreground.alpha);
  if (mixedAlpha === 0) return { red: 0, green: 0, blue: 0, alpha: 0 };
  const mix = (front, back) =>
    (front * foreground.alpha + back * background.alpha * (1 - foreground.alpha)) /
    mixedAlpha;
  return {
    red: mix(foreground.red, background.red),
    green: mix(foreground.green, background.green),
    blue: mix(foreground.blue, background.blue),
    alpha: mixedAlpha,
  };
}

function linearChannel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(color) {
  return (
    0.2126 * linearChannel(color.red) +
    0.7152 * linearChannel(color.green) +
    0.0722 * linearChannel(color.blue)
  );
}

function contrastRatio(first, second) {
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function decideHvutAbilityPointContrast(input) {
  const parsedLayers = Array.from(input?.backgroundColors || [])
    .map(parseCssColor)
    .filter(Boolean);
  let effective = WHITE;
  for (const layer of parsedLayers.reverse()) effective = composite(layer, effective);

  const backgroundLuminance = luminance(effective);
  const darkContrast = contrastRatio(backgroundLuminance, 0);
  const lightContrast = contrastRatio(backgroundLuminance, 1);
  const tone = darkContrast >= lightContrast ? HvutAbilityPointTone.DARK : HvutAbilityPointTone.LIGHT;
  const rounded = [effective.red, effective.green, effective.blue].map(Math.round);
  return Object.freeze({
    kind: "accepted",
    tone,
    textColor: tone === HvutAbilityPointTone.DARK ? "#000" : "#fff",
    effectiveBackground: `rgb(${rounded.join(", ")})`,
    contrastRatio: Number(Math.max(darkContrast, lightContrast).toFixed(2)),
    source: parsedLayers.length ? "computedLayers" : "defaultWhite",
  });
}
