export const SiteIdentity = Object.freeze({
  HV: "hv",
  EXTERNAL: "external",
});

export const GameWorld = Object.freeze({
  PERSISTENT: "persistent",
  ISEKAI: "isekai",
});

function hostnameOf(location) {
  return String(location?.hostname || location?.host || "")
    .toLowerCase()
    .split(":")[0];
}

export function classifySite(location) {
  return hostnameOf(location) === "e-hentai.org" ? SiteIdentity.EXTERNAL : SiteIdentity.HV;
}

export function classifyWorld(location, site = classifySite(location)) {
  if (site === SiteIdentity.EXTERNAL) return GameWorld.PERSISTENT;
  return /\/isekai\/?/.test(String(location?.pathname || ""))
    ? GameWorld.ISEKAI
    : GameWorld.PERSISTENT;
}

export function classifyIngress(location) {
  const site = classifySite(location);
  return Object.freeze({
    site,
    world: classifyWorld(location, site),
    host: hostnameOf(location),
    origin: String(location?.origin || ""),
    pathname: String(location?.pathname || "/"),
  });
}
