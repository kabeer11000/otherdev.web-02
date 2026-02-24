import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "About OtherDev";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          padding: "60px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 60,
            fontSize: 32,
            color: "#686868",
            fontWeight: 600,
          }}
        >
          ABOUT OTHERDEV
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 40,
          }}
        >
          <h1
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "#000000",
              marginBottom: 32,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            About Us
          </h1>

          <p
            style={{
              fontSize: 32,
              color: "#686868",
              textAlign: "center",
              maxWidth: "900px",
              lineHeight: 1.6,
              marginTop: 20,
            }}
          >
            Full-service web development and design studio
            <br />
            based in Karachi.
            <br />
            <br />
            Founded by Kabeer Jaffri and Ossaid Qadri.
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 60,
            fontSize: 24,
            color: "#999999",
          }}
        >
          otherdev.com/about
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
