import { ImageResponse } from 'next/og'
import { getProjects } from '@/lib/payload-api'

export const size = {
  width: 1200,
  height: 630,
}
export const alt = 'Our Work | Other Dev Portfolio'
export const contentType = 'image/png'

export default async function Image() {
  const projects = await getProjects()
  const firstProject = projects[0]
  const coverImageUrl = firstProject?.image?.sizes?.og?.url

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
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        {coverImageUrl && (
          <img
            src={coverImageUrl}
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
            }}
          >
            Our Work
          </h1>
          <p
            style={{
              fontSize: 28,
              color: 'rgba(255,255,255,0.8)',
              marginTop: 24,
              letterSpacing: '-0.02em',
            }}
          >
            Premium web design & development
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}