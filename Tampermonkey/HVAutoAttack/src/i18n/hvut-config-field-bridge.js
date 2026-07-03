import { getHvutConfigFieldInputKind, isHvutConfigFieldDisabled } from "./hvut-config-field.js";

window.HVAA_hvutConfigField = Object.freeze({
  inputKind: getHvutConfigFieldInputKind,
  isDisabled: isHvutConfigFieldDisabled,
});
