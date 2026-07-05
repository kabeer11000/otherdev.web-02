'use client'

import { Button, toast, useDocumentInfo, useField } from '@payloadcms/ui'
import type { ArrayFieldClientComponent } from 'payload'
import { useMemo, useState } from 'react'

type ProjectMediaRow = {
  file?: string | { id?: number | string } | null
  type?: 'image' | 'video' | null
}

type DeleteGalleryImagesResponse = {
  deletedCount?: number
  error?: string
  failed?: Array<{ id: number | string; message: string }>
  remainingMedia?: ProjectMediaRow[]
}

const getImageRows = (rows: ProjectMediaRow[]) => rows.filter(row => row.type !== 'video')

export const ProjectMediaBulkActions: ArrayFieldClientComponent = ({ path }) => {
  const { id } = useDocumentInfo()
  const { setValue, value } = useField<ProjectMediaRow[]>({ path })
  const [isDeleting, setIsDeleting] = useState(false)

  const rows = Array.isArray(value) ? value : []
  const imageRows = useMemo(() => getImageRows(rows), [rows])
  const imageCount = imageRows.length
  const disabled = isDeleting || !id || imageCount === 0

  const deleteImages = async () => {
    if (!id || disabled) return

    const confirmed = window.confirm(
      `Delete ${imageCount} project gallery image${imageCount === 1 ? '' : 's'} from the CMS and R2? Videos and the hero image will be kept.`
    )

    if (!confirmed) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/projects/${id}/delete-gallery-images`, {
        credentials: 'include',
        method: 'POST',
      })
      const json = (await response.json()) as DeleteGalleryImagesResponse

      if (!response.ok && response.status !== 207) {
        throw new Error(json.error || 'Failed to delete project gallery images.')
      }

      const remainingRows = Array.isArray(json.remainingMedia)
        ? json.remainingMedia
        : rows.filter(row => row.type === 'video')

      setValue(remainingRows)

      if (json.failed?.length) {
        toast.warning(
          `Removed image rows, but ${json.failed.length} media file${json.failed.length === 1 ? '' : 's'} could not be deleted from storage.`
        )
        return
      }

      toast.success(
        `Deleted ${json.deletedCount ?? imageCount} project gallery image${(json.deletedCount ?? imageCount) === 1 ? '' : 's'}.`
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete project gallery images.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
      }}
    >
      <span style={{ color: 'var(--theme-elevation-600)', fontSize: '0.875rem' }}>
        {imageCount} gallery image{imageCount === 1 ? '' : 's'} selected
      </span>
      <Button
        buttonStyle="secondary"
        disabled={disabled}
        onClick={deleteImages}
        size="small"
        type="button"
      >
        {isDeleting ? 'Deleting...' : 'Delete all images'}
      </Button>
    </div>
  )
}
