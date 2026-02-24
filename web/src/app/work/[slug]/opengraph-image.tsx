import { ImageResponse } from "next/og";
import { projects } from "@/lib/projects";

export const runtime = "edge";

export const alt = "Project preview | OtherDev";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div
            style={{
              fontSize: 48,
              color: "#686868",
            }}
          >
            Project Not Found
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  }

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
          OTHERDEV
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
              fontSize: 72,
              fontWeight: 800,
              color: "#000000",
              marginBottom: 24,
              textAlign: "center",
              maxWidth: "1000px",
              lineHeight: 1.1,
            }}
          >
            {project.title}
          </h1>

          <p
            style={{
              fontSize: 32,
              color: "#686868",
              textAlign: "center",
              maxWidth: "900px",
              lineHeight: 1.5,
              marginTop: 20,
            }}
          >
            {project.description}
          </p>

          <div
            style={{
              marginTop: 40,
              padding: "16px 32px",
              backgroundColor: "#e5e5e5",
              borderRadius: 8,
            }}
          >
            <span
              style={{
                fontSize: 24,
                color: "#686868",
                fontWeight: 500,
              }}
            >
              {project.year}
            </span>
          </div>
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
          otherdev.com/work/{slug}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
