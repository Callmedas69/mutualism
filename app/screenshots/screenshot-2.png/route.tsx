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

        {/* Connections List */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Section Title */}
          <div
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: "16px",
            }}
          >
            Your Mutual Connections
          </div>

          {/* Connection Items */}
          {[
            { name: "alice.eth" },
            { name: "bob.base" },
            { name: "charlie.fc" },
            { name: "diana.eth" },
            { name: "evan.base" },
          ].map((user, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                padding: "24px",
                backgroundColor: "#27272a",
                borderRadius: "16px",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  color: "#ffffff",
                  fontWeight: 700,
                }}
              >
                {user.name[0].toUpperCase()}
              </div>
              {/* Name */}
              <div
                style={{
                  flex: 1,
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                {user.name}
              </div>
            </div>
          ))}
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
          Discover Mutual Connections
        </div>
      </div>
    ),
    {
      width: 1290,
      height: 2796,
    }
  );
}
