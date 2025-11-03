-- ============================================================================
-- FIX: Update get_nearby_activities function to fix timestamp type mismatch
-- ============================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS get_nearby_activities(FLOAT, FLOAT, FLOAT);

-- Recreate with explicit timestamp casts and proper GROUP BY
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
  participant_count BIGINT
) AS $$
BEGIN
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
    COUNT(DISTINCT c.id) AS participant_count
  FROM activities a
  INNER JOIN users u ON a.host_id = u.id
  LEFT JOIN connections c ON c.activity_id = a.id AND c.status = 'accepted'
  WHERE 
    a.status = 'active'
    AND a.expires_at > NOW()
    AND (
      a.approximate_location IS NULL OR
      ST_DWithin(
        a.approximate_location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        radius_km * 1000
      )
    )
  GROUP BY a.id, u.id
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
GRANT EXECUTE ON FUNCTION get_nearby_activities(FLOAT, FLOAT, FLOAT) TO authenticated;

