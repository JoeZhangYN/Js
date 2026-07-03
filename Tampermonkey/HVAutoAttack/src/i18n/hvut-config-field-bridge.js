import {
  formatHvutConfigFieldDescription,
  formatHvutConfigFieldHelpText,
  getHvutConfigFieldInputKind,
  isHvutConfigFieldDisabled,
} from "./hvut-config-field.js";

window.HVAA_hvutConfigField = Object.freeze({
  formatDescription: formatHvutConfigFieldDescription,
  formatHelpText: formatHvutConfigFieldHelpText,
  inputKind: getHvutConfigFieldInputKind,
  isDisabled: isHvutConfigFieldDisabled,
});
