export function updateAtIndex(array, index, newItem) {
  return array.map((item, i) => (i === index ? newItem : item));
}

export function upsertByIndex(array, item, index) {
  return typeof index === "number"
    ? updateAtIndex(array, index, item)
    : [...array, item];
}