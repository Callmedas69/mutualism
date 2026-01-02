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
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #f25b2820 0%, transparent 50%), radial-gradient(circle at 80% 50%, #f25b2810 0%, transparent 50%)",
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
              fontSize: "140px",
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
              fontSize: "32px",
              fontWeight: 500,
              color: "#a1a1aa",
              letterSpacing: "0.1em",
            }}
          >
            RELATIONSHIP ARE MUTUAL, YOURS ?
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
