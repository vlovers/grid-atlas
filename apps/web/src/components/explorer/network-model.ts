/** A visual page is a bounded view into the API slice, never the complete archive. */
export const NETWORK_PAGE_SIZE = 8;
export const NETWORK_WIDTH = 1120;
export const NETWORK_HEIGHT = 720;
export function networkPositions(count: number) {
  const size = Math.max(0, Math.min(NETWORK_PAGE_SIZE, count));
  return Array.from({ length: size }, (_, index) => {
    const side = index % 2;
    const rows = Math.ceil((size - side) / 2);
    return {
      x: side ? 910 : 210,
      y: 360 + (Math.floor(index / 2) - (rows - 1) / 2) * 156,
    };
  });
}
export function networkPage(index: number) {
  return Math.floor(Math.max(0, index) / NETWORK_PAGE_SIZE);
}
export function fitZoom(value: number) {
  return Math.max(1, Math.min(2.5, Math.round(value * 100) / 100));
}
/** Full identity remains in the accessible name, title, list and inspector. */
export function nodeLines(name: string, width = 25): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of name.split(/\s+/)) {
    if (line && line.length + word.length + 1 > width) {
      lines.push(line);
      line = "";
    }
    line += (line ? " " : "") + word;
  }
  if (line) lines.push(line);
  return lines
    .slice(0, 3)
    .map((value, i) =>
      value.length > width || (i === 2 && lines.length > 3)
        ? value.slice(0, width - 1) + "…"
        : value,
    );
}
