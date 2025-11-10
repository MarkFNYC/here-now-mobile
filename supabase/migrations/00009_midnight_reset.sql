-- Migration: Midnight reset function and archived messages

-- 1. Add archived_at column to messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_messages_archived_at ON messages(archived_at);

-- 2. Midnight reset function
CREATE OR REPLACE FUNCTION midnight_reset()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Archive all messages so the next day starts fresh
  UPDATE messages
  SET archived_at = NOW()
  WHERE archived_at IS NULL;

  -- Reset confirmed/cancelled state for daily flow
  UPDATE connections
  SET
    is_confirmed = FALSE,
    status = CASE
      WHEN status = 'cancelled' THEN 'cancelled'
      ELSE 'pending'
    END,
    updated_at = NOW(),
    meet_time = NULL,
    meet_location = NULL
  WHERE connection_type = '1on1';

  -- Reset ON state for all users
  UPDATE users
  SET
    is_on = FALSE,
    updated_at = NOW()
  WHERE is_on = TRUE;
END;
$$;

-- 3. Ensure pg_cron is available and schedule the job at midnight UTC
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  BEGIN
    PERFORM cron.unschedule(jobname := 'midnight_reset');
  EXCEPTION
    WHEN undefined_function OR undefined_table THEN
      -- pg_cron not available or no existing job, ignore
  END;

  BEGIN
    PERFORM cron.schedule(
      jobname := 'midnight_reset',
      schedule := '0 0 * * *',
      command := 'SELECT midnight_reset();'
    );
  EXCEPTION
    WHEN undefined_function OR undefined_table THEN
      -- pg_cron not available on local environment. Run manually if needed.
      NULL;
  END;
END;
$$;

