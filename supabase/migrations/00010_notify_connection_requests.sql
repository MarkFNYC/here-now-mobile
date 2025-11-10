-- Migration: Create notification trigger for new connection requests

CREATE OR REPLACE FUNCTION handle_new_connection_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  requester_name TEXT;
  settings JSONB;
  should_notify BOOLEAN;
BEGIN
  -- Only notify for 1:1 pending requests
  IF NEW.connection_type <> '1on1' THEN
    RETURN NEW;
  END IF;

  -- Prevent self notifications (shouldn't happen but safe-guard)
  IF NEW.requester_id = NEW.target_id THEN
    RETURN NEW;
  END IF;

  -- Only when status is pending
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT notification_settings INTO settings
  FROM users
  WHERE id = NEW.target_id;

  should_notify := COALESCE((settings ->> 'requests')::BOOLEAN, TRUE);

  IF should_notify THEN
    SELECT COALESCE(full_name, 'Someone') INTO requester_name
    FROM users
    WHERE id = NEW.requester_id;

    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.target_id,
      'request',
      'New connection request',
      requester_name || ' wants to meet today.',
      jsonb_build_object(
        'connection_id', NEW.id,
        'requester_id', NEW.requester_id,
        'requested_at', NEW.created_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_new_connection_request ON connections;
CREATE TRIGGER notify_new_connection_request
AFTER INSERT ON connections
FOR EACH ROW
EXECUTE FUNCTION handle_new_connection_notification();

