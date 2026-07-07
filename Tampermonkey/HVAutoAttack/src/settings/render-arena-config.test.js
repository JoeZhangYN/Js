import { describe, expect, it } from "vitest";
import {
  renderArenaStaminaLossSchemaFields,
  renderIdleArenaSchemaFields,
  renderRestoreStaminaSchemaFields,
} from "./render.js";

describe("arena settings schema rendering", () => {
  it("derives idle arena checkbox from option schema", () => {
    const html = renderIdleArenaSchemaFields();

    expect(html).toContain('id="idleArena"');
    expect(html).toContain('<label for="idleArena">');
    expect(html).toContain(`name="${["idleArena", "Time"].join("")}"`);
    expect(html).toContain('class="idleArenaReset"');
  });

  it("derives restore stamina checkbox from option schema", () => {
    const html = renderRestoreStaminaSchemaFields();

    expect(html).toContain('id="restoreStamina"');
    expect(html).toContain('<label for="restoreStamina">');
    expect(html).toContain('name="staminaLow"');
    expect(html).toContain("no Idle Arena");
  });

  it("does not expose retired stamina loss action checkboxes", () => {
    const html = renderArenaStaminaLossSchemaFields();

    expect(html).toContain(`name="${["stamina", "Lose"].join("")}"`);
    expect(html).not.toContain("staminaPause");
    expect(html).not.toContain("staminaWarn");
    expect(html).not.toContain("staminaFlee");
  });
});
