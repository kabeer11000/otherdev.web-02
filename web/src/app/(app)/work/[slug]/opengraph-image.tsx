import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}
export const alt = 'Project | Other Dev Portfolio'
export const contentType = 'image/png'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  return [
    { slug: 'boulevard' },
    { slug: 'narkins-2024' },
    { slug: 'cultured-legacy-2024' },
    { slug: 'khaadi' },
    { slug: 'serene-life' },
    { slug: 'limi' },
    { slug: 'satwa' },
    { slug: 'elvy' },
    { slug: 'rina' },
    { slug: 'alif' },
    { slug: 'saira' },
    { slug: ' Sana' },
    { slug: 'zaid' },
    { slug: 'warda' },
    { slug: 'nadia' },
    { slug: 'maimoona' },
    { slug: 'aqsa' },
    { slug: 'fatima' },
    { slug: 'hina' },
  ]
}

interface ImageProps {
  params: Promise<{ slug: string }>
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params

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
            {slug}
          </h1>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}