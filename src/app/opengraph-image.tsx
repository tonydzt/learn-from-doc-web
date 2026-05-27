import { ImageResponse } from "next/og";

export const alt = "Developer Docs Progress Tracker";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f5f1e8",
          color: "#12212b",
          padding: "62px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              background: "#167e79",
              borderRadius: 18,
              height: 56,
              width: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f5f1e8",
              fontSize: 28,
            }}
          >
            %
          </div>
          <span style={{ fontFamily: "Arial, sans-serif", fontSize: 24 }}>
            Developer Docs Progress Tracker
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ color: "#167e79", fontFamily: "Arial, sans-serif", fontSize: 19 }}>
            A reading ledger for developer documentation
          </div>
          <div style={{ fontSize: 70, letterSpacing: "-2px", maxWidth: 900 }}>
            Know where to continue in developer docs.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            fontFamily: "Arial, sans-serif",
            color: "#52636b",
            fontSize: 20,
          }}
        >
          <span style={{ color: "#167e79" }}>Chrome</span>
          <span>/</span>
          <span>Edge</span>
          <span>/</span>
          <span>Firefox</span>
        </div>
      </div>
    ),
    size,
  );
}
