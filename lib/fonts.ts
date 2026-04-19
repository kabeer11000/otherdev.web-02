// Font configuration for self-hosted fonts
// Following Framer's approach of self-hosting for performance

export const fontConfig = {
  display: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '600',
    fontDisplay: 'swap' as const
  },
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '400',
    fontDisplay: 'swap' as const
  }
}