"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface TenantContextType {
  domain: string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [domain, setDomain] = useState("otherdev.com");

  useEffect(() => {
    // Get domain from window.location on client-side
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      // Remove port if present (e.g., localhost:3000 -> localhost)
      const cleanDomain = hostname.split(":")[0];
      setDomain(cleanDomain);
    }
  }, []);

  return (
    <TenantContext.Provider value={{ domain }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
