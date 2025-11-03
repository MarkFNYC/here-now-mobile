-- ============================================================================
-- TEST QUERIES FOR HERE-NOW MOBILE DATABASE
-- ============================================================================

-- 1. Verify PostGIS extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify it's enabled
SELECT 
  extname AS extension_name,
  extversion AS version
FROM pg_extension
WHERE extname = 'postgis';

-- 2. Test get_nearby_users function
-- Using coordinates for London (51.4615, -0.1685) with 5km radius
SELECT * FROM get_nearby_users(51.4615, -0.1685, 5);

-- 3. Alternative test with different radius
SELECT * FROM get_nearby_users(51.4615, -0.1685, 10);

-- 4. Test get_nearby_activities function
SELECT * FROM get_nearby_activities(51.4615, -0.1685, 5);

-- 5. Check all tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 6. Check all functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_nearby_users', 'get_nearby_activities', 'update_user_location')
ORDER BY routine_name;

