import { headers } from "next/headers";
import { textViewParams } from "./text-model";
/** The request location is overwritten by middleware, never trusted from a client header. */
export async function NoScriptTextLink() {
  const path = (await headers()).get("x-grid-atlas-location");
  const parsed = path && textViewParams(path);
  if (!parsed) return null;
  return (
    <noscript>
      <p>
        <a href={`/${parsed.locale}/explorer/text?${parsed.query}`}>
          {parsed.locale === "uk"
            ? "Відкрити текстовий вигляд без JavaScript →"
            : "Open the text view without JavaScript →"}
        </a>
      </p>
    </noscript>
  );
}
