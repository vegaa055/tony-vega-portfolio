import { serializeJsonLd } from "@/lib/json-ld";

/** Structured data describing the page, for search engines. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
