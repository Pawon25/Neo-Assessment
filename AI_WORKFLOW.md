# AI Workflow Note

## Tools Used

- **Claude (Anthropic)** — primary coding assistant throughout the assignment
- **GitHub Copilot** — inline completions during active coding sessions

---

## Where AI Materially Sped Up Work

**Boilerplate generation** — FastAPI route scaffolding, Pydantic model definitions, and React component shells were generated quickly. What would have taken 30–45 minutes of typing was reduced to reviewing and adjusting output.

**Tiptap integration** — The editor setup, extension configuration, and `onUpdate` debounce pattern were drafted with AI assistance. This saved significant time that would otherwise have been spent reading documentation.

**CSS-in-JS patterns** — Consistent inline style objects across all components (hover handlers, transition patterns, CSS variable usage) were accelerated by AI completing repetitive patterns once the design tokens were established.

**Test scaffolding** — The 18-test suite structure was drafted with AI help. The fixture pattern for isolated test databases and the `pytest-asyncio` setup were generated and then verified manually.

---

## What I Changed or Rejected

**Access control logic** — AI's first draft of `assert_access` used a single combined query. I rewrote it to check ownership first and fall back to the shares collection separately — cleaner logic and easier to reason about.

**SharePanel dropdown** — AI initially generated a plain text input for the username. I changed it to a `<select>` populated from `/auth/users` so users can only pick valid usernames — better UX and avoids a class of errors.

**Auto-save debounce** — The first AI draft called `handleSave` directly inside `onUpdate`. I refactored it to use a `useRef` timer that gets cleared and reset on each keystroke — the correct debounce pattern.

**`text_to_tiptap()` converter** — AI's first version collapsed all lines into a single paragraph. I rewrote it to map each line to its own paragraph node and preserve empty lines as blank paragraphs for visual spacing.

**Rejected: Zustand for state management** — AI suggested adding Zustand for global document state. I rejected this — local state per page is sufficient at this scope and keeps the codebase flatter.

**Rejected: `useQuery` from React Query** — Suggested for data fetching. Rejected to avoid an extra dependency; direct `useEffect` + `useState` is more readable for a reviewer unfamiliar with the codebase.

---

## How I Verified Correctness

- **Manual API testing** via FastAPI's Swagger UI (`/docs`) — every endpoint tested before writing frontend code
- **Browser DevTools** — network tab to verify request/response shapes matched Pydantic models
- **Cross-user testing** — logged in as Alice, Bob, and Charlie in separate browser tabs to verify sharing and access control end-to-end
- **Edge cases tested manually**: sharing with yourself (blocked), uploading a PDF (rejected with 415), refreshing the page mid-edit (content persists), opening a document URL directly without auth (redirected to login)
- **pytest suite** — 18 tests run against an isolated test database to verify backend logic independently of the frontend

---

## Honest Assessment

AI significantly accelerated the mechanical parts of this project — typing, boilerplate, and pattern repetition. The judgement calls — what to build, what to cut, how to structure access control, what the UX should feel like — were made without AI. The debugging sessions (Tiptap peer dependency conflicts, the `:id` typo in API routes, the `borderBottom` conflict) required reading error messages and reasoning about the problem, not just prompting.

AI is most useful when you already know what you want to build. It is not a substitute for that knowledge.