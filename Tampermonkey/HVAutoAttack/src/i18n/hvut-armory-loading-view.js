import { ArmoryCategoryStatus } from "./hvut-armory-integration.js";

const STATUS_TEXT = Object.freeze({
  [ArmoryCategoryStatus.LOADING]: "Loading...",
  [ArmoryCategoryStatus.STAGED]: "Loaded...",
  [ArmoryCategoryStatus.EMPTY]: "No equipment...",
  [ArmoryCategoryStatus.FAILED]: "Load failed...",
});

function bodyCategory(body) {
  return (
    body.dataset.hvutArmoryCategory ||
    body.dataset.hvutArmoryFailure ||
    body.dataset.hvutArmoryLoading ||
    null
  );
}

function sortBodies(table, categoryOrder) {
  const order = new Map(categoryOrder.map((key, index) => [key, index]));
  Array.from(table.tBodies)
    .sort((a, b) => (order.get(bodyCategory(a)) ?? 99) - (order.get(bodyCategory(b)) ?? 99))
    .forEach((body) => table.appendChild(body));
}

function loadingBody(document, category) {
  const body = document.createElement("tbody");
  body.dataset.hvutArmoryLoading = category;
  const row = body.insertRow();
  row.className = "hvut-eqp-category";
  const cell = row.insertCell();
  cell.colSpan = 10;
  cell.textContent = `${STATUS_TEXT[ArmoryCategoryStatus.LOADING]} [${category}]`;
  return body;
}

export function createArmoryLoadingView({ document, table, categoryOrder }) {
  let active = null;

  function restore() {
    if (!active) return;
    const attempted = new Set(active.categories);
    for (const body of Array.from(table.tBodies)) {
      if (!active.retrying || attempted.has(bodyCategory(body))) body.remove();
    }
    active.originalBodies.forEach((body) => table.appendChild(body));
    sortBodies(table, categoryOrder);
    active = null;
  }

  function begin({ categories, retrying }) {
    restore();
    const keys = categories.map((category) => category.key);
    const attempted = new Set(keys);
    const originalBodies = Array.from(table.tBodies).filter(
      (body) => !retrying || attempted.has(bodyCategory(body))
    );
    originalBodies.forEach((body) => body.remove());
    const placeholders = new Map();
    for (const key of keys) {
      const body = loadingBody(document, key);
      placeholders.set(key, body);
      table.appendChild(body);
    }
    sortBodies(table, categoryOrder);
    active = { categories: keys, retrying, originalBodies, placeholders };
  }

  function progress({ category, status }) {
    const body = active?.placeholders.get(category);
    if (!body) return;
    body.firstElementChild.firstElementChild.textContent = `${STATUS_TEXT[status] || STATUS_TEXT.loading} [${category}]`;
  }

  function complete() {
    active = null;
  }

  return Object.freeze({ begin, progress, restore, complete });
}
