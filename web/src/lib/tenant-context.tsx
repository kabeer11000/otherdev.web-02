'use client'

import { createContext, type ReactNode, useContext } from 'react'

interface TenantContextType {
  domain: string
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({
  children,
  initialDomain = 'otherdev.com',
}: {
  children: ReactNode
  initialDomain?: string
}) {
  return (
    <TenantContext.Provider value={{ domain: initialDomain }}>{children}</TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
