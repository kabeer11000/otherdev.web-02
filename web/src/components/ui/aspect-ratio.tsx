import type * as React from 'react'

function AspectRatio({ ratio, style, ...props }: React.ComponentProps<'div'> & { ratio?: number }) {
  return <div data-slot="aspect-ratio" style={{ aspectRatio: ratio, ...style }} {...props} />
}

export { AspectRatio }
