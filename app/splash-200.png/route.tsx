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
          backgroundColor: "#ffffff",
        }}
      >
        {/* Rounded M Logo */}
        <div
          style={{
            width: "160px",
            height: "160px",
            borderRadius: "90px",
            backgroundColor: "#18181b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: "120px",
              fontWeight: 900,
              color: "#f25b28",
            }}
          >
            M
          </div>
        </div>
      </div>
    ),
    {
      width: 200,
      height: 200,
    }
  );
}
