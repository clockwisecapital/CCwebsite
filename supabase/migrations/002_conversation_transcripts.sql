-- Migration: Enhance conversation transcript storage and retrieval
-- Purpose: Ensure we can create conversations before email capture, store full chat turns,
-- and render reliable timelines in the admin dashboard.

-- 1) Allow conversation creation before email capture
ALTER TABLE conversations
  ALTER COLUMN user_email DROP NOT NULL;

-- 2) Extend message_role enum to support system/tool (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'message_role' AND e.enumlabel = 'system'
  ) THEN
    ALTER TYPE message_role ADD VALUE 'system';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'message_role' AND e.enumlabel = 'tool'
  ) THEN
    ALTER TYPE message_role ADD VALUE 'tool';
  END IF;
END $$;

-- 3) Enforce at least one of content or display_spec (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'messages'
      AND constraint_name = 'messages_content_or_spec_chk'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_content_or_spec_chk
      CHECK (content IS NOT NULL OR display_spec IS NOT NULL);
  END IF;
END $$;

-- 4) Strict, monotonic ordering for messages via sequence (idempotent)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS seq BIGSERIAL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_seq
  ON messages (conversation_id, seq);

-- 5) Composite index for common timeline fetch pattern
CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON messages (conversation_id, created_at DESC);

-- Notes:
-- - Admin dashboard queries should preferentially order by (conversation_id, seq) for stability.
-- - Public chat flow can create a conversation with NULL email at session start and update later.
-- - Existing data remains valid; no destructive changes.
