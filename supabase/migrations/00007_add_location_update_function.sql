-- Migration: Add function to update user location
-- Description: Creates a function to properly save PostGIS location data

CREATE OR REPLACE FUNCTION update_user_location(
  user_id UUID,
  lat FLOAT,
  lng FLOAT
)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_location(UUID, FLOAT, FLOAT) TO authenticated;
