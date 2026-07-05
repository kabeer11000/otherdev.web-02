# Lessons Learned

## Session: Payload admin theme plugin

- **Do not assume `generate:importmap` needs to be re-run** — it generates on Payload startup and auto-adds new components. ThemeProvider was already registered before I asked about it.
- **String path components DO execute CSS imports in the browser** — they are lazy in Node (no SSR evaluation), but via importMap they run in the browser where Next.js/Turbopack processes the CSS normally. The `import './admin-theme.css'` in ThemeProvider.tsx is NOT dead code.
- **`adminThemePlugin()` adds no new types** — it only wires existing components, so `payload-types.ts` doesn't need regeneration.
- **admin.group** is a simple string on the collection config — no plugin needed, put it directly on the collection.
- **`admin.components.graphics` needs a file** — can't be done with payload.config.ts alone; needs `src/plugins/Logo.tsx` or similar.
- **CLAUDE.md plugin note** — Payload admin components must use string paths `'./path#Component'` not `{ Component: Foo }` objects. The latter crashes on `parsePayloadComponent` when generating importmap. CSS imports in component files ARE valid since string paths cause lazy browser-side evaluation only.

## Session: Project media bulk deletion

- **Clarify relationship removal vs asset deletion up front** — when an admin asks to delete project images, confirm whether that means removing project gallery references only or permanently deleting media documents/storage objects. R2-backed media deletion should go through Payload's media delete flow unless there is a specific reason to bypass the configured storage adapter.
- **Prompt user for lint runs** — when verification reaches linting in this repo, ask the user to run the linter instead of running it directly.
