-- Insert a test activity for development/testing
-- This creates a pile-on activity in Clapham Common that starts in 2 hours

INSERT INTO activities (
  host_id,
  title,
  description,
  activity_type,
  location_name,
  approximate_location,
  start_time,
  end_time,
  is_one_on_one,
  max_participants,
  status,
  expires_at
)
SELECT 
  id as host_id,
  'Coffee & Walk in Clapham Common' as title,
  'Join me for a casual coffee and walk around the common. Great way to meet neighbors!' as description,
  'Coffee' as activity_type,
  'Clapham Common' as location_name,
  ST_SetSRID(ST_MakePoint(-0.1476, 51.4526), 4326)::geography as approximate_location,
  -- Start time: 2 hours from now
  NOW() + INTERVAL '2 hours' as start_time,
  -- End time: 3 hours from now
  NOW() + INTERVAL '3 hours' as end_time,
  false as is_one_on_one,
  5 as max_participants,
  'active' as status,
  -- Expires at: end of today
  DATE_TRUNC('day', NOW()) + INTERVAL '1 day' as expires_at
FROM users
WHERE is_verified = true
LIMIT 1
ON CONFLICT DO NOTHING;

-- If no verified users exist, create activity for first user
INSERT INTO activities (
  host_id,
  title,
  description,
  activity_type,
  location_name,
  approximate_location,
  start_time,
  end_time,
  is_one_on_one,
  max_participants,
  status,
  expires_at
)
SELECT 
  id as host_id,
  'Coffee & Walk in Clapham Common' as title,
  'Join me for a casual coffee and walk around the common. Great way to meet neighbors!' as description,
  'Coffee' as activity_type,
  'Clapham Common' as location_name,
  ST_SetSRID(ST_MakePoint(-0.1476, 51.4526), 4326)::geography as approximate_location,
  NOW() + INTERVAL '2 hours' as start_time,
  NOW() + INTERVAL '3 hours' as end_time,
  false as is_one_on_one,
  5 as max_participants,
  'active' as status,
  DATE_TRUNC('day', NOW()) + INTERVAL '1 day' as expires_at
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM activities WHERE host_id = users.id
)
LIMIT 1
ON CONFLICT DO NOTHING;





