/** Exact public route mapping. No external destinations, headers or free-form HTML. */
export function textViewParams(path: string) {
  const url = new URL(path, "http://grid-atlas.local");
  if (url.origin !== "http://grid-atlas.local") return null;
  const match = url.pathname.match(
    /^\/(uk|en)\/(explorer\/(?:connections\/)?(drivers|constructors)\/([1-9][0-9]*)|time-machine|explorer\/evidence\/([1-9][0-9]*)\/([1-9][0-9]*))$/,
  );
  if (!match) return null;
  const query = new URLSearchParams(url.search);
  if (match[3]) {
    query.set("kind", match[3] === "drivers" ? "driver" : "constructor");
    query.set("id", match[4]);
  }
  if (match[5]) {
    query.set("driver", match[5]);
    query.set("constructor", match[6]);
    query.set("experience", "evidence");
  } else
    query.set(
      "experience",
      url.pathname.endsWith("time-machine") ? "machine" : "network",
    );
  return { locale: match[1] as "uk" | "en", query };
}
export function htmlText(value: unknown) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
