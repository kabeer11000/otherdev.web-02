# Project Media Bulk Delete Plan

## Goal

Add an admin CMS control that lets admins delete all image rows from a project's media gallery without manually removing each row.

## Scope

- Target the `projects.media` array field in Payload admin.
- Remove gallery rows whose media type is image or unset/default image.
- Preserve video rows and the required hero `image` field to avoid invalid project documents.
- Permanently delete the selected gallery image media documents so their R2 objects are removed by Payload storage.
- Use Payload's supported custom admin field component API with `useField`.

## Implementation

- [x] Add a server endpoint for deleting all gallery image media documents for a project.
- [x] Add a client-side Payload admin component for project media bulk actions.
- [x] Wire the component into the `projects.media` array field with access-safe behavior.
- [x] Keep the UI guarded with a confirmation prompt and disabled state when no image rows exist.
- [x] Avoid deleting videos or the required hero image media document.

## Verification

- [x] Run type checking with `bun run type-check`.
- [ ] Run lint/check with `bun run lint --cache` or the closest supported cached equivalent.
- [x] Inspect the changed diff for minimal impact and Payload import-map compatibility.

## Review

Implemented with a Payload collection endpoint and a Payload admin field component. `bun run type-check` still fails on existing repo-wide issues; the change-specific media ID type issue was fixed and no new `ProjectMediaBulkActions` type error appeared in the rerun. Lint was not run directly because the user asked to be prompted for lint runs.
