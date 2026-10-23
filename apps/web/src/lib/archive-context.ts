/** Only allow known local archive routes as navigation return targets. */
export function safeArchiveReturnTarget(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string' || value.length > 240) return null;
  if (value.includes('%') || value.includes('\\') || value.includes('//') || value.includes('#')) return null;
  if (/^\/(?:drivers|constructors|circuits)\/[a-zA-Z0-9_-]+(?:\?season=(?:19|20|21)\d{2})?$/.test(value)) return value;
  return null;
}

export function archiveContextHref(destination: string, returnTo: string | null): string {
  if (!returnTo) return destination;
  return destination + (destination.includes('?') ? '&' : '?') + 'from=' + encodeURIComponent(returnTo);
}
