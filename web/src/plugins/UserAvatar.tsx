import config from '@payload-config'
import { getPayload } from 'payload'
import type { Media, User } from '../payload-types'

type Props = {
  user?: User | null
}

export async function UserAvatar({ user }: Props) {
  if (!user) return null

  const avatarRef = user.avatar
  let url: string | null = null

  if (avatarRef && typeof avatarRef === 'object' && 'url' in avatarRef) {
    url = (avatarRef as Media).url ?? null
  } else if (typeof avatarRef === 'string') {
    const payload = await getPayload({ config })
    const media = await payload
      .findByID({ collection: 'media', id: avatarRef, depth: 0 })
      .catch(() => null)
    url = media?.url ?? null
  }

  if (!url) return null

  return (
    <img
      src={url}
      alt={user.name ?? user.email ?? ''}
      style={{
        width: '2rem',
        height: '2rem',
        objectFit: 'cover',
        borderRadius: '50%',
        display: 'block',
      }}
    />
  )
}
