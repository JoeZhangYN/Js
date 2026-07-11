import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EquipmentSurfaceKind,
  EquipmentSurfaceLifecycleEvent,
  runEquipmentSurfaceLifecycle,
} from "./equipment-surface-lifecycle.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("equipment surface document lifecycle", () => {
  it("discovers a popup that is created and filled after document start", async () => {
    const onSurfaceReady = vi.fn();
    const dispose = runEquipmentSurfaceLifecycle(
      { type: EquipmentSurfaceLifecycleEvent.DOCUMENT_STARTED },
      { onSurfaceReady }
    );

    const popup = document.createElement("div");
    popup.id = "popup_box";
    popup.style.visibility = "visible";
    document.body.appendChild(popup);
    popup.innerHTML = '<div class="eq"></div><div class="eqt"></div>';

    await vi.waitFor(() => {
      expect(onSurfaceReady).toHaveBeenCalledWith({
        kind: EquipmentSurfaceKind.POPUP,
        root: popup,
      });
    });
    dispose();
  });

  it("prefers a concrete showequip identity over its popup container", async () => {
    const onSurfaceReady = vi.fn();
    const dispose = runEquipmentSurfaceLifecycle(
      { type: EquipmentSurfaceLifecycleEvent.DOCUMENT_STARTED },
      { onSurfaceReady }
    );
    const popup = document.createElement("div");
    popup.id = "popup_box";
    popup.style.visibility = "visible";
    popup.innerHTML = '<div class="showequip"></div>';
    document.body.appendChild(popup);

    await vi.waitFor(() => {
      expect(onSurfaceReady).toHaveBeenCalledWith({
        kind: EquipmentSurfaceKind.SHOWEQUIP,
        root: popup.firstElementChild,
      });
    });
    expect(onSurfaceReady).not.toHaveBeenCalledWith({
      kind: EquipmentSurfaceKind.POPUP,
      root: popup,
    });
    dispose();
  });

  it("rejects unknown lifecycle events without observing the document", () => {
    const MutationObserver = vi.fn();
    expect(runEquipmentSurfaceLifecycle({ type: "unknown" }, { MutationObserver })).toBe(false);
    expect(runEquipmentSurfaceLifecycle(null, { MutationObserver })).toBe(false);
    expect(MutationObserver).not.toHaveBeenCalled();
  });
});
