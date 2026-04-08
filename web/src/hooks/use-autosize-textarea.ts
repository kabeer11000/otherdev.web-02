import { layout, prepare } from '@chenglou/pretext'
import { useLayoutEffect, useMemo, useRef } from 'react'

interface UseAutosizeTextAreaProps {
  ref: React.RefObject<HTMLTextAreaElement | null>
  width: number
  maxHeight?: number
  fontSize?: number
  lineHeight?: number
  borderWidth?: number
  dependencies: React.DependencyList
}

export function useAutosizeTextArea({
  ref,
  width,
  maxHeight = Number.MAX_SAFE_INTEGER,
  fontSize = 14,
  lineHeight = 21,
  borderWidth = 0,
  dependencies: _dependencies,
}: UseAutosizeTextAreaProps) {
  const preparedRef = useRef<ReturnType<typeof prepare> | null>(null)
  const text = ref.current?.value || ''
  const font = `${fontSize}px TWKLausanne`

  const prepared = useMemo(() => prepare(text, font, { whiteSpace: 'pre-wrap' }), [text, font])
  preparedRef.current = prepared

  useLayoutEffect(() => {
    if (!ref.current || width <= 0 || !preparedRef.current) return

    const padding = borderWidth * 2
    const contentWidth = width - padding

    const { height } = layout(preparedRef.current, contentWidth, lineHeight)
    const clampedHeight = Math.min(height, maxHeight)

    ref.current.style.height = `${clampedHeight + padding}px`
  }, [width, maxHeight, lineHeight, borderWidth, ref])
}
