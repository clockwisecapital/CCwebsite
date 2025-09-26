# Conversation Transcripts & Admin Dashboard Modal — Implementation Notes

Date: 2025-09-26 (local)

## Overview
We implemented end-to-end persistence and viewing of full chat transcripts, from the user’s first message through analysis, and exposed them in the Admin Dashboard via a click-to-view modal. This document summarizes what changed, where, why, and how to test.

## Goals
- Persist every user and assistant message under a single conversation, even before email capture.
- Ensure conversations link to a user once email is captured (without duplicating conversations).
- Provide an Admin UI to view the full, ordered transcript with timeline and lead score.

---

## Database Changes
- File: `supabase/migrations/002_conversation_transcripts.sql`
- Summary:
  - Allow creating conversations before email capture:
    - `ALTER TABLE conversations ALTER COLUMN user_email DROP NOT NULL;`
  - Robust message roles (future friendly): add `system`, `tool` enum values (idempotent).
  - Enforce at least one of `content` or `display_spec` on `messages`:
    - `CHECK (content IS NOT NULL OR display_spec IS NOT NULL)`
  - Add monotonic ordering to `messages`:
    - `seq BIGSERIAL`, index `(conversation_id, seq)`
  - Add composite index for common timeline fetch:
    - `(conversation_id, created_at DESC)`

Indexes already present (for reference):
- `messages(conversation_id)`, `messages(created_at DESC)`, `messages(role)`
- `conversations(session_id)`, `conversations(user_email)`, `conversations(created_at DESC)`

Optional backfill (older messages):
```sql
WITH ordered AS (
  SELECT id, row_number() OVER (PARTITION BY conversation_id ORDER BY created_at ASC) AS rn
  FROM messages
  WHERE seq IS NULL
)
UPDATE messages m
SET seq = o.rn
FROM ordered o
WHERE m.id = o.id;
```

---

## Server/Backend Changes

### Conversation Detail API (Admin)
- File: `src/app/api/admin/conversation/[id]/route.ts`
- Changes:
  - Fetch messages ordered by `seq` then `created_at` (stable timeline).
  - Coalesce null message arrays to `[]` before mapping.
  - Return `display_spec` (structured assistant responses), and enriched timeline/lead score.

### Dashboard Data API (Admin)
- File: `src/app/api/admin/dashboard/route.ts`
- Changes (previously):
  - Use Supabase `count: 'exact'` with `head: true` for accurate totals.
  - Use `user_data.analysis_results IS NOT NULL` for completed analysis count.

### Supabase DB Utilities
- File: `src/lib/supabase/database.ts`
- Changes:
  - `createConversation(...)` now allows `userEmail` to be undefined; sets `user_email = NULL` initially.
  - `updateConversation(...)` can update `user_email` later.
  - `getConversationMessages(...)` orders by `seq` then `created_at`.
  - `saveMessage(...)` always satisfies the DB check: either `content` or `display_spec` is present.
  - `initializeSession(...)` and `saveSessionState(...)` update `user_email` later when available.

### FSM (Conversation Orchestrator)
- File: `src/lib/fsm.ts`
- Key updates:
  - Persist USER turn at the start of `processMessage()` via `saveSessionState({ lastMessage: { role: 'user', content } })`.
  - Persist ASSISTANT turn after stage handling via `saveSessionState({ lastMessage: { role: 'assistant', displaySpec, content: <flattened text> } })`.
  - Helper `flattenDisplaySpecToText()` produces a readable plaintext from `display_spec` blocks for `messages.content` (useful for search/export) while keeping the full structured JSON in `messages.display_spec`.
  - `handleEmailCaptureStage(...)` continues to update the conversation with the email (linking the session to the user going forward).

---

## Frontend (Admin Dashboard)
- File: `src/app/admin/dashboard/page.tsx`
- Changes:
  - Added click-to-view modal for conversations.
  - Fetches `/api/admin/conversation/[id]` and renders:
    - Lead score (+ breakdown if present)
    - Timeline (Started → Goals → Portfolio → Analysis)
    - Full message history
  - Rendering for assistant messages now supports `display_spec` blocks:
    - `summary_bullets`, `conversation_text`, `cta_group` directly rendered.
    - Fallback JSON viewer for `table`, `stat_group`, `chart`, `sources` (or unknown blocks).

---

## Linkage Guarantee (Email to Conversation)
- Conversations are created with `user_email = NULL` at the first message.
- When email is later captured, we call `updateConversation` to set `user_email` on the same `conversation.id`.
- All earlier/later messages remain linked by `conversation_id`, so the full transcript is tied to the email.

---

## Testing Checklist
1. Start a new chat and send a few messages (before email capture).
   - Expect: `conversations` row created with `user_email = NULL`.
   - Expect: `messages` rows for each turn, ordered with `seq`.
2. Provide email in chat.
   - Expect: `conversations.user_email` updates from NULL to your email (same conversation id).
3. Go to `/admin/dashboard` and click your conversation row.
   - Expect: Full transcript rendered; assistant messages show content (plaintext) and structured blocks.
4. Verify stats on dashboard reflect non-zero totals and completed analyses.

---

## Rollback Plan
- Revert the feature branch (see Git steps below) or selectively revert files.
- (DB) To undo the `user_email` nullable change or the `messages` constraints/seq, create a new migration that drops/changes those, but this is generally not recommended once data relies on it.

---

## Notes & Next Steps
- Optional backfill: populate `messages.content` for historic assistant messages using the same flatten logic.
- Optional: add a `users` table and `user_id` FK for richer per-user analytics; not required for v1.
- Optional: case-normalize emails to lowercase on write to avoid duplicates.

---

## Ownership
- Frontend Admin UI: `src/app/admin/dashboard/page.tsx`
- APIs: `src/app/api/admin/*`
- DB Utilities: `src/lib/supabase/*`
- DB Schema: `supabase/schema.sql` & `supabase/migrations/002_conversation_transcripts.sql`

