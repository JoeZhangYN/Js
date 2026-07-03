export function isHvutConfigFieldDisabled(field, context) {
  if (context?.isIsekai) {
    return Boolean(field?.server && field.server !== context.serverName);
  }
  return Boolean(
    field?.disabled === "persistent" && !context?.isIsekai ||
      field?.disabled === "isekai" && context?.isIsekai
  );
}

export function getHvutConfigFieldInputKind(field) {
  if (field?.input === "textarea") return "textarea";
  if (field?.input === "select") return "select";
  if (field?.type === "boolean") return "checkbox";
  if (field?.type === "number") return "number";
  return "text";
}
