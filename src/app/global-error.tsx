"use client"; // Error boundaries must be Client Components

/**
 * Last resort, when the root layout itself fails. It replaces the whole
 * document, so the site's stylesheet and fonts aren't available: the few
 * styles it needs are inline, in the site's colors.
 */
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#05060a",
          color: "#eceef5",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <title>Something went wrong · Tony Vega</title>
        <main style={{ padding: "2rem", maxWidth: "32rem" }}>
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#ff6a4d",
            }}
          >
            Error
          </p>
          <h1
            style={{ margin: "1rem 0", fontSize: "2.25rem", fontWeight: 300 }}
          >
            Something went wrong
          </h1>
          <p style={{ margin: 0, lineHeight: 1.6, color: "#a2aabd" }}>
            The site couldn&apos;t load. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "2rem",
              border: 0,
              borderRadius: "2px",
              padding: "0.8rem 1.25rem",
              background: "#ff6a4d",
              color: "#05060a",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
