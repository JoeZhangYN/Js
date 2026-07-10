export const ARMORY_CATEGORY_KEYS = Object.freeze([
  "weapon_1handed",
  "weapon_2handed",
  "weapon_staff",
  "shield",
  "armor_cloth",
  "armor_light",
  "armor_heavy",
]);

export const ArmoryPageKind = Object.freeze({
  TABLE: "table",
  EMPTY: "empty",
  LIMITED: "limited",
  UNEXPECTED_PAGE: "unexpectedPage",
  REQUEST_FAILED: "requestFailed",
});

function armoryUrl(baseUrl, screen, filter) {
  const url = new URL(baseUrl);
  url.search = new URLSearchParams({ s: "Bazaar", ss: "am", screen, filter }).toString();
  return url.href;
}

function safePageDetail(response, doc, text, requestedUrl) {
  return {
    requestedUrl,
    finalUrl: response?.url || requestedUrl,
    status: response?.status ?? null,
    statusText: response?.statusText || "",
    title: doc?.title || "",
    hasNavbar: Boolean(doc?.getElementById("navbar")),
    hasEquiplist: Boolean(doc?.getElementById("equiplist")),
    message: doc?.getElementById("messagebox_inner")?.textContent?.trim().slice(0, 240) || "",
    excerpt: String(doc?.body?.textContent || text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240),
  };
}

function parsePage(document, text) {
  const doc = document.implementation.createHTMLDocument("");
  doc.documentElement.innerHTML = text;
  return doc;
}

function classifyResponse(response, text, doc, requestedUrl, category) {
  const detail = { category: category.key, ...safePageDetail(response, doc, text, requestedUrl) };
  if (response.status === 429 || response.status === 503 || text.trim() === "state lock limiter in effect") {
    return { kind: ArmoryPageKind.LIMITED, detail };
  }
  if (!response.ok) return { kind: ArmoryPageKind.REQUEST_FAILED, detail };
  const equiplist = doc.getElementById("equiplist");
  const table = equiplist?.querySelector(":scope > table") || doc.querySelector("#equiplist > table");
  if (table) return { kind: ArmoryPageKind.TABLE, category, doc, table, detail };
  if (equiplist) return { kind: ArmoryPageKind.EMPTY, category, doc, table: null, detail };
  return { kind: ArmoryPageKind.UNEXPECTED_PAGE, category, doc, table: null, detail };
}

export function readArmoryCategories(filterbar, baseUrl) {
  const links = new Map();
  for (const anchor of filterbar?.querySelectorAll?.("a[href]") || []) {
    try {
      const url = new URL(anchor.getAttribute("href"), baseUrl);
      const key = url.searchParams.get("filter");
      if (ARMORY_CATEGORY_KEYS.includes(key)) links.set(key, { key, href: url.href });
    } catch {
      // Invalid filter links are not Armory category identities.
    }
  }
  return ARMORY_CATEGORY_KEYS.flatMap((key) => (links.has(key) ? [links.get(key)] : []));
}

export function createArmoryPageReader({ fetchImpl, document, baseUrl }) {
  async function read({ screen, category }) {
    const requestedUrl = armoryUrl(baseUrl, screen, category.key);
    let response;
    try {
      response = await fetchImpl(requestedUrl, { credentials: "same-origin" });
      const text = await response.text();
      const doc = parsePage(document, text);
      return classifyResponse(response, text, doc, requestedUrl, category);
    } catch (error) {
      return {
        kind: ArmoryPageKind.REQUEST_FAILED,
        category,
        detail: {
          category: category.key,
          requestedUrl,
          finalUrl: response?.url || requestedUrl,
          status: response?.status ?? null,
          error: error?.message || String(error),
        },
      };
    }
  }

  return Object.freeze({ read });
}
