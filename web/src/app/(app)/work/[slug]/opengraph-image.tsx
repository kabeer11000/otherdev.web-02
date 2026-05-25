import { ImageResponse } from 'next/og'
import { getProjects, getProjectBySlug } from '@/lib/payload-api'

export const size = {
  width: 1200,
  height: 630,
}
export const alt = 'Project | Other Dev Portfolio'
export const contentType = 'image/png'

export const revalidate = 60

export async function generateStaticParams() {
  const projects = await getProjects()
  return projects.map(p => ({ slug: p.slug }))
}

export async function generateImageMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params
  const project = await getProjectBySlug(slug)

  return [
    {
      id: slug,
      width: size.width,
      height: size.height,
      alt: project?.title ? `${project.title} | Other Dev Portfolio` : alt,
      contentType,
    },
  ]
}

interface ImageProps {
  params: Promise<{ slug: string }>
  id: Promise<string>
}

export default async function Image({ params, id }: ImageProps) {
  const { slug } = await params
  const imageId = await id
  const project = await getProjectBySlug(slug)

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          position: 'relative',
        }}
      >
        {project?.image?.sizes?.og?.url && (
          <img
            src={project.image.sizes.og.url}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: 16,
            }}
          >
            Other Dev
          </span>
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              textAlign: 'center',
              maxWidth: 900,
              padding: '0 40px',
            }}
          >
            {project?.title ?? slug}
          </h1>
          {project?.description && (
            <p
              style={{
                fontSize: 24,
                color: 'rgba(255,255,255,0.7)',
                marginTop: 24,
                letterSpacing: '-0.02em',
                maxWidth: 700,
                textAlign: 'center',
              }}
            >
              {project.description}
            </p>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
