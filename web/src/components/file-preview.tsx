"use client"

import { X, FileText, FileCode2, File } from "lucide-react"
import { useEffect, useState } from "react"

interface FilePreviewProps {
  files: File[]
  onRemove: (index: number) => void
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return url
}

function FileIcon({ file }: { file: File }) {
  if (file.name.match(/\.(ts|tsx|js|jsx|py|json)$/i)) {
    return <FileCode2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
  }
  if (file.name.match(/\.(txt|md|pdf)$/i)) {
    return <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
  }
  return <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
}

function ImageFileItem({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useObjectUrl(file)

  return (
    <div className="relative group">
      <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted">
        {url && (
          <img
            src={url}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Remove ${file.name}`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  )
}

function NonImageFileItem({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground">
      <FileIcon file={file} />
      <span className="max-w-[140px] truncate">{file.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={`Remove ${file.name}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function FilePreview({ files, onRemove }: FilePreviewProps) {
  if (files.length === 0) return null

  const images = files.filter((f) => f.type.startsWith("image/"))
  const others = files.filter((f) => !f.type.startsWith("image/"))

  return (
    <div className="flex flex-wrap items-end gap-2">
      {images.map((file, i) => (
        <ImageFileItem
          key={`${file.name}-${i}`}
          file={file}
          onRemove={() => onRemove(files.indexOf(file))}
        />
      ))}
      {others.map((file, i) => (
        <NonImageFileItem
          key={`${file.name}-${i}`}
          file={file}
          onRemove={() => onRemove(files.indexOf(file))}
        />
      ))}
    </div>
  )
}
