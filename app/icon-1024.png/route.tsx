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
            
          }}
        >
          {/* Logo M */}
          <div
            style={{
              fontSize: "800px",
              fontWeight: 900,
              lineHeight: 0.8,
              color: "#f25b28",
            }}
          >
            M
          </div>
          {/* Tagline */}
          <div
            style={{
              fontSize: "106px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.03em",
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
