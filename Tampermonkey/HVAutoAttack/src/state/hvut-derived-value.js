export function splitHvutDerivedValue(family, value) {
  if (Array.isArray(value)) {
    return {
      meta: { family, kind: "array", length: value.length },
      records: Object.entries(value).map(([recordId, item]) => ({ family, recordId, value: item })),
    };
  }
  if (value && typeof value === "object") {
    return {
      meta: { family, kind: "object" },
      records: Object.entries(value).map(([recordId, item]) => ({ family, recordId, value: item })),
    };
  }
  return {
    meta: { family, kind: "scalar" },
    records: [{ family, recordId: "$value", value }],
  };
}

export function assembleHvutDerivedValue(meta, records) {
  if (!meta) return undefined;
  if (meta.kind === "array") {
    const value = new Array(meta.length);
    for (const record of records) value[Number(record.recordId)] = record.value;
    return value;
  }
  if (meta.kind === "object") {
    return Object.fromEntries(records.map((record) => [record.recordId, record.value]));
  }
  return records.find((record) => record.recordId === "$value")?.value;
}

export const hvutDerivedRecordKey = (family, recordId) => `${family}\u0000${recordId}`;
