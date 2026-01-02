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
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontSize: "200px",
              fontWeight: 900,
              letterSpacing: "-0.05em",
              display: "flex",
            }}
          >
            <span style={{ color: "#f25b28" }}>M</span>
            <span style={{ color: "#ffffff" }}>UTUALISM</span>
          </div>
          {/* Tagline */}
          <div
            style={{
              fontSize: "36px",
              fontWeight: 500,
              color: "#a1a1aa",
              letterSpacing: "0.1em",
              textAlign: "center",
            }}
          >
            Visualize Your Farcaster Social Graphs
          </div>
          {/* Description */}
          <div
            style={{
              fontSize: "24px",
              fontWeight: 400,
              color: "#71717a",
              letterSpacing: "0.05em",
              textAlign: "center",
              fontStyle: "italic",
              transform: "skewX(-12deg)",
            }}
          >
            your mutual, your attention, your influence
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}
