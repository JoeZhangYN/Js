export const EquipmentSurfaceKind = Object.freeze({
  SHOWEQUIP: "showequip",
  POPUP: "popup",
  EMBEDDED_INFO: "embeddedInfo",
});

const EVENT_DOCUMENT_STARTED = "documentStarted";

export const EquipmentSurfaceLifecycleEvent = Object.freeze({
  DOCUMENT_STARTED: EVENT_DOCUMENT_STARTED,
});

function elementNode(node) {
  return node?.nodeType === 1 ? node : null;
}

function addSurface(identities, root, kind) {
  if (!root) return;
  if (kind !== EquipmentSurfaceKind.SHOWEQUIP) {
    const showEquipRoots = root.matches(".showequip")
      ? [root]
      : Array.from(root.querySelectorAll(".showequip"));
    if (showEquipRoots.length) {
      showEquipRoots.forEach((showEquip) =>
        identities.set(showEquip, {
          kind: EquipmentSurfaceKind.SHOWEQUIP,
          root: showEquip,
        })
      );
      return;
    }
  }
  if (kind === EquipmentSurfaceKind.POPUP && root.style.visibility !== "visible") return;
  identities.set(root, { kind, root });
}

function discoverEquipmentSurfaces(node) {
  const element = elementNode(node);
  if (!element) return [];
  const identities = new Map();

  addSurface(identities, element.closest(".showequip"), EquipmentSurfaceKind.SHOWEQUIP);
  element
    .querySelectorAll(".showequip")
    .forEach((root) => addSurface(identities, root, EquipmentSurfaceKind.SHOWEQUIP));

  addSurface(identities, element.closest("#popup_box"), EquipmentSurfaceKind.POPUP);
  element
    .querySelectorAll("#popup_box")
    .forEach((root) => addSurface(identities, root, EquipmentSurfaceKind.POPUP));

  addSurface(identities, element.closest("#equipinfo"), EquipmentSurfaceKind.EMBEDDED_INFO);
  element
    .querySelectorAll("#equipinfo")
    .forEach((root) => addSurface(identities, root, EquipmentSurfaceKind.EMBEDDED_INFO));

  return Array.from(identities.values(), (identity) => Object.freeze(identity));
}

export function runEquipmentSurfaceLifecycle(event, deps = {}) {
  if (event?.type !== EVENT_DOCUMENT_STARTED) return false;
  const documentAuthority = deps.document || document;
  const root = documentAuthority.body || documentAuthority.documentElement;
  if (!root) return false;
  const Observer = deps.MutationObserver || MutationObserver;
  const onSurfaceReady = deps.onSurfaceReady || (() => {});
  const report = (node) =>
    discoverEquipmentSurfaces(node).forEach((identity) => onSurfaceReady(identity));

  report(root);
  const observer = new Observer((mutations) => {
    for (const mutation of mutations) {
      report(mutation.target);
      mutation.addedNodes?.forEach(report);
    }
  });
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style"],
  });

  return () => observer.disconnect();
}
