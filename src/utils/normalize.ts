export const normalizeForSearch = (value: string) =>
  value.normalize('NFD').toLowerCase().replace(/[\u0300-\u036f]/g, '');