# AGENTS.md

## Documentation Lookup (ctx7)

Use the `ctx7` CLI to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage.

Do not use ctx7 for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

### Steps

1. Resolve library:
   - `npx ctx7@latest library <name> "<user question>"`
2. Pick the best match (ID format: `/org/project`) by exact name match, description relevance, snippet count, source reputation, and benchmark score.
3. Fetch docs:
   - `npx ctx7@latest docs <libraryId> "<user question>"`
4. Answer using fetched documentation.

Rules:
- Always call `library` first unless user already provides `/org/project`.
- Use the user’s full question as query text.
- Do not run more than 3 ctx7 commands per question.
- Do not include sensitive information in queries.
- For version-specific docs, use `/org/project/version` when available.
- If ctx7 quota fails, tell the user and suggest `npx ctx7@latest login` or setting `CONTEXT7_API_KEY`.

## Codex Working Preferences (Project)

### Prime Directive

Review thoroughly before making code changes. For each issue or recommendation:
- explain concrete tradeoffs,
- give an opinionated recommendation,
- ask for user input before assuming direction.

### Workflow Orchestration

1. Plan Mode Default
- Use plan mode for non-trivial tasks (3+ steps or architectural decisions).
- For small, clear tasks (single file, <50 lines), execute directly.
- If execution goes sideways, stop and re-plan.
- Include verification in planning.
- Write clear specs up front.

2. Subagent Strategy
- Use subagents for parallelizable research/exploration or isolated context.
- One task per subagent.

3. Self-Improvement Loop
- After non-trivial user correction, update `tasks/lessons.md` with prevention rules.
- Review lessons at session start when relevant.

4. Verification Before Done
- Do not mark complete without proof.
- Diff behavior where relevant.
- Run tests, check logs, and demonstrate correctness.

5. Demand Elegance (Balanced)
- For non-trivial changes, do one elegance pass.
- If a fix is hacky, replace with cleaner solution.
- Skip over-engineering for simple fixes.

6. Autonomous Bug Fixing
- For bug reports, fix directly using logs/errors/failing tests.
- Resolve CI failures caused by recent changes.

### Task Management

1. Plan first in `tasks/todo.md` with checkable items.
2. Verify plan with user before implementation.
3. Track progress by marking items complete.
4. Explain changes at high level per step.
5. Add review section to `tasks/todo.md`.
6. Update `tasks/lessons.md` after corrections.

### Core Principles

- Simplicity first; minimal impact.
- Root-cause fixes over temporary patches.
- Keep scope tight to avoid regressions.
- Clear, conventional commit hygiene.
- Never add AI attribution in commits/code/docs.
- Do not add emojis in code; remove any encountered while editing.

### Engineering Preferences

- Aggressively avoid DRY violations.
- Prioritize strong test coverage.
- Prefer explicit code over clever code.
- Handle edge cases thoughtfully.
- Avoid `any` in TypeScript without justification.

### Code Review Protocol

For non-trivial reviews, ask user preference first:
1. BIG CHANGE: section-by-section (Architecture -> Code Quality -> Tests -> Performance), max 4 top issues per section.
2. SMALL CHANGE: interactive, one question per section.

For each issue:
- Number the issue and provide lettered options.
- Include concrete file/line references.
- Provide 2-3 options (including do nothing when reasonable).
- Include effort, risk, impact, maintenance burden.
- Put recommended option first with rationale.
- Ask user agreement before proceeding.

### Communication Style

- Be direct and concise.
- Give opinionated recommendations with reasoning.
- Do not assume user priorities on timeline/scale.
- Pause for feedback after major sections.

### Mistakes to Avoid

- Keep this as a living section and update after corrections.
- Current entry: none.
