function isHidden(row) {
  return row.is_hidden === 1 || row.is_hidden === true || row.is_hidden === "1";
}

function hasReItemId(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function sameValue(left, right) {
  if (left === null || left === undefined) {
    return right === null || right === undefined;
  }
  if (right === null || right === undefined) {
    return false;
  }
  return String(left) === String(right);
}

function legacyMatchKey(item) {
  return JSON.stringify([item.name, item.category, item.description]);
}

function hasMetadataChanges(row, item) {
  return (
    !sameValue(row.re_item_name, item.name) ||
    !sameValue(row.category, item.category) ||
    !sameValue(row.description, item.description) ||
    !sameValue(row.quantity, item.quantity)
  );
}

function buildProjectUpdateDiff(existingRows, incomingItems) {
  const activeRows = existingRows.filter((row) => !isHidden(row));
  const hiddenRowsByReItemId = new Map();
  const activeRowsByReItemId = new Map();
  const legacyRowsByFields = new Map();

  existingRows.forEach((row) => {
    if (hasReItemId(row.re_item_id)) {
      const byId = isHidden(row) ? hiddenRowsByReItemId : activeRowsByReItemId;
      byId.set(String(row.re_item_id), row);
      return;
    }

    if (!isHidden(row)) {
      const key = legacyMatchKey({
        name: row.re_item_name,
        category: row.category ?? null,
        description: row.description ?? null,
      });
      const matches = legacyRowsByFields.get(key) || [];
      matches.push(row);
      legacyRowsByFields.set(key, matches);
    }
  });

  const matchedIds = new Set();
  const updates = [];
  const restores = [];
  const inserts = [];

  incomingItems.forEach((item) => {
    const reItemId = String(item.re_item_id);
    let row = activeRowsByReItemId.get(reItemId);
    let isLegacyMatch = false;

    if (!row) {
      row = hiddenRowsByReItemId.get(reItemId);
    }

    if (!row) {
      const legacyMatches = legacyRowsByFields.get(legacyMatchKey(item));
      row = legacyMatches && legacyMatches.find((candidate) => !matchedIds.has(candidate.id));
      isLegacyMatch = Boolean(row);
    }

    if (!row) {
      inserts.push(item);
      return;
    }

    matchedIds.add(row.id);
    if (isHidden(row)) {
      restores.push({ row, item });
    } else if (isLegacyMatch || hasMetadataChanges(row, item)) {
      updates.push({ row, item, backfillReItemId: isLegacyMatch });
    }
  });

  const hides = activeRows.filter((row) => !matchedIds.has(row.id));

  return { updates, restores, inserts, hides };
}

module.exports = { buildProjectUpdateDiff };
