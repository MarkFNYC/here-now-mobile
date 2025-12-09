-- ============================================================================
-- UPDATE FUNCTIONS TO FILTER BLOCKED USERS
-- Sprint 4: Safety features - ensure blocked users are filtered in queries
-- ============================================================================

-- Update get_nearby_users to filter out users that the current user has blocked
-- and users who have blocked the current user
DROP FUNCTION IF EXISTS get_nearby_users(FLOAT, FLOAT, FLOAT);
CREATE OR REPLACE FUNCTION get_nearby_users(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 5.0
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  photo_url TEXT,
  bio TEXT,
  activity_tags TEXT[],
  distance_km FLOAT
) AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.photo_url,
    u.bio,
    u.activity_tags,
    ROUND(
      (ST_Distance(
        u.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
      ) / 1000.0)::numeric,
      2
    )::FLOAT AS distance_km
  FROM users u
  WHERE 
    u.is_on = true
    AND u.is_deactivated = false
    AND u.location IS NOT NULL
    AND u.id != current_user_id -- Don't show self
    AND ST_DWithin(
      u.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000 -- Convert km to meters
    )
    -- Filter out users that the current user has blocked
    AND (
      current_user_id IS NULL OR
      u.id != ALL(
        SELECT unnest(blocked_user_ids)
        FROM users
        WHERE id = current_user_id
      )
    )
    -- Filter out users who have blocked the current user
    AND (
      current_user_id IS NULL OR
      current_user_id != ALL(COALESCE(u.blocked_user_ids, ARRAY[]::UUID[]))
    )
  ORDER BY u.location <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_nearby_activities to filter out activities from blocked users
DROP FUNCTION IF EXISTS get_nearby_activities(FLOAT, FLOAT, FLOAT);
CREATE OR REPLACE FUNCTION get_nearby_activities(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 5.0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  activity_type TEXT,
  location_name TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_one_on_one BOOLEAN,
  host_id UUID,
  host_name TEXT,
  distance_km FLOAT,
  participant_count BIGINT,
  max_participants INTEGER
) AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.activity_type,
    a.location_name,
    a.start_time::TIMESTAMPTZ,
    a.end_time::TIMESTAMPTZ,
    a.is_one_on_one,
    a.host_id,
    u.full_name AS host_name,
    CASE 
      WHEN a.approximate_location IS NOT NULL THEN
        ROUND(
          (ST_Distance(
            a.approximate_location,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
          ) / 1000.0)::numeric,
          2
        )::FLOAT
      ELSE NULL
    END AS distance_km,
    COUNT(DISTINCT c.id) AS participant_count,
    a.max_participants
  FROM activities a
  INNER JOIN users u ON a.host_id = u.id
  LEFT JOIN connections c ON c.activity_id = a.id AND c.status = 'accepted'
  WHERE 
    a.status = 'active'
    AND a.expires_at > NOW()
    AND u.is_deactivated = false
    AND (
      a.approximate_location IS NULL OR
      ST_DWithin(
        a.approximate_location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        radius_km * 1000
      )
    )
    -- Filter out activities from users that the current user has blocked
    AND (
      current_user_id IS NULL OR
      a.host_id != ALL(
        SELECT unnest(blocked_user_ids)
        FROM users
        WHERE id = current_user_id
      )
    )
    -- Filter out activities from users who have blocked the current user
    AND (
      current_user_id IS NULL OR
      current_user_id != ALL(COALESCE(u.blocked_user_ids, ARRAY[]::UUID[]))
    )
  GROUP BY a.id, u.id, a.max_participants
  ORDER BY 
    CASE 
      WHEN a.approximate_location IS NOT NULL THEN
        a.approximate_location <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
      ELSE NULL
    END,
    a.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_nearby_users(FLOAT, FLOAT, FLOAT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_activities(FLOAT, FLOAT, FLOAT) TO authenticated;







