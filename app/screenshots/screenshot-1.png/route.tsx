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
          flexDirection: "column",
          backgroundColor: "#18181b",
          padding: "40px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: 900,
              color: "#f25b28",
            }}
          >
            M
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            MUTUALISM
          </div>
        </div>

        {/* Network Graph Placeholder */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#27272a",
            borderRadius: "24px",
            position: "relative",
          }}
        >
          {/* Central node */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "#f25b28",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              color: "#ffffff",
              fontWeight: 700,
            }}
          >
            You
          </div>
          {/* Surrounding nodes */}
          <div
            style={{
              position: "absolute",
              top: "80px",
              left: "100px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "120px",
              right: "80px",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#1e40af",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "100px",
              left: "120px",
              width: "45px",
              height: "45px",
              borderRadius: "50%",
              backgroundColor: "#60a5fa",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "150px",
              right: "100px",
              width: "55px",
              height: "55px",
              borderRadius: "50%",
              backgroundColor: "#93c5fd",
            }}
          />
        </div>

        {/* Caption */}
        <div
          style={{
            marginTop: "32px",
            fontSize: "28px",
            fontWeight: 600,
            color: "#a1a1aa",
            textAlign: "center",
          }}
        >
          Visualize Your Network Graph
        </div>
      </div>
    ),
    {
      width: 1290,
      height: 2796,
    }
  );
}
