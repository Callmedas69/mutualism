import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#18181b",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "40px",
          }}
        >
          {/* Logo M */}
          <div
            style={{
              fontSize: "400px",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              display: "flex",
            }}
          >
            <span style={{ color: "#f25b28" }}>M</span>
          </div>
          {/* Tagline */}
          <div
            style={{
              fontSize: "48px",
              fontWeight: 500,
              color: "#a1a1aa",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            MUTUALISM
          </div>
        </div>
      </div>
    ),
    {
      width: 1024,
      height: 1024,
    }
  );
}
