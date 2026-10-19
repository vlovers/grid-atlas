export type CatalogueParams = { page?: string | string[]; q?: string | string[] };
export const PAGE_SIZE = 100;
export const MAX_OFFSET = 100000;

export function catalogueParams(params: CatalogueParams) {
  const raw = typeof params.page === 'string' ? params.page : '1';
  const value = /^[1-9][0-9]*$/.test(raw) ? Number(raw) : 1;
  const page = Number.isSafeInteger(value) && value <= MAX_OFFSET / PAGE_SIZE + 1 ? value : 1;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  return { page, offset: (page - 1) * PAGE_SIZE, q };
}

export function pageHref(path: string, page: number, q = '') {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (page > 1) params.set('page', String(page));
  return params.size ? `${path}?${params}` : path;
}

export function validId(id: string) {
  return /^[1-9][0-9]*$/.test(id) && Number(id) <= 2147483647;
}
