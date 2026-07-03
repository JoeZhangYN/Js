export function isHvutConfigFieldDisabled(field, context) {
  if (context?.isIsekai) {
    return Boolean(field?.server && field.server !== context.serverName);
  }
  return Boolean(
    field?.disabled === "persistent" && !context?.isIsekai ||
      field?.disabled === "isekai" && context?.isIsekai
  );
}
