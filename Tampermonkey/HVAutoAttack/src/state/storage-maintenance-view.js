export function createStorageMaintenanceView(doc = globalThis.document) {
  let root = null;
  let body = null;

  function ensure() {
    if (root?.isConnected) return;
    root = doc.createElement("section");
    root.dataset.hvaaStorageMaintenance = "status";
    Object.assign(root.style, {
      position: "fixed",
      zIndex: "2147483647",
      right: "12px",
      top: "12px",
      width: "360px",
      padding: "12px",
      color: "#f5f5f5",
      background: "rgba(24, 24, 28, .96)",
      border: "1px solid #7aa2f7",
      whiteSpace: "pre-wrap",
      font: "13px/1.5 sans-serif",
    });
    const close = doc.createElement("button");
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close storage maintenance status");
    Object.assign(close.style, { float: "right", cursor: "pointer" });
    close.addEventListener("click", () => root.remove());
    body = doc.createElement("div");
    root.append(close, body);
    doc.body.append(root);
  }

  function show(message) {
    ensure();
    body.textContent = message;
    return root;
  }

  return Object.freeze({ show });
}
