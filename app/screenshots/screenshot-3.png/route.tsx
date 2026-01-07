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

        {/* Tokenize Card */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "40px",
          }}
        >
          {/* Zora Logo Placeholder */}
          <div
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "24px",
              backgroundColor: "#27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid #f25b28",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                fontWeight: 900,
                color: "#f25b28",
              }}
            >
              Z
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#ffffff",
              textAlign: "center",
            }}
          >
            Tokenize Your Graph
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "28px",
              fontWeight: 500,
              color: "#a1a1aa",
              textAlign: "center",
              maxWidth: "80%",
            }}
          >
            Create a unique coin representing your social connections on Zora
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "32px",
                backgroundColor: "#27272a",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: 700,
                  color: "#3b82f6",
                }}
              >
                247
              </div>
              <div
                style={{
                  fontSize: "20px",
                  color: "#71717a",
                }}
              >
                Mutuals
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "32px",
                backgroundColor: "#27272a",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: 700,
                  color: "#3b82f6",
                }}
              >
                1.2K
              </div>
              <div
                style={{
                  fontSize: "20px",
                  color: "#71717a",
                }}
              >
                Connections
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div
            style={{
              marginTop: "40px",
              padding: "24px 64px",
              backgroundColor: "#f25b28",
              borderRadius: "16px",
              fontSize: "32px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            Create Coin
          </div>
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
          Tokenize on Zora Protocol
        </div>
      </div>
    ),
    {
      width: 1290,
      height: 2796,
    }
  );
}
