'use client'

import { useRouter } from 'next/navigation'
import type { PayloadComponent } from 'payload'

export const LogoutButton: PayloadComponent = () => {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/users/logout', { method: 'POST' })
      if (response.ok) {
        router.push('/admin')
        router.refresh()
      }
    } catch {
      window.location.href = '/admin'
    }
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 16px',
        textAlign: 'left',
        width: '100%',
        fontFamily: 'inherit',
        fontSize: '14px',
      }}
    >
      Log Out
    </button>
  )
}
