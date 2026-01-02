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
        {/* Logo M */}
        <div
          style={{
            fontSize: "120px",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            color: "#f25b28",
          }}
        >
          M
        </div>
      </div>
    ),
    {
      width: 200,
      height: 200,
    }
  );
}
