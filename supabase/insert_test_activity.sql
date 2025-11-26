-- Quick script to insert a test activity
-- Run this in your Supabase SQL Editor
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from your users table

-- First, get a user ID to use as host:
-- SELECT id, full_name FROM users LIMIT 1;

-- Then insert the test activity (replace YOUR_USER_ID_HERE):
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
) VALUES (
  'YOUR_USER_ID_HERE'::uuid,  -- Replace with actual user ID
  'Coffee & Walk in Clapham Common',
  'Join me for a casual coffee and walk around the common. Great way to meet neighbors!',
  'Coffee',
  'Clapham Common',
  ST_SetSRID(ST_MakePoint(-0.1476, 51.4526), 4326)::geography,  -- Clapham Common coordinates
  NOW() + INTERVAL '2 hours',  -- Starts in 2 hours
  NOW() + INTERVAL '3 hours',  -- Ends in 3 hours
  false,  -- Pile-on activity (not 1:1)
  5,  -- Max 5 participants
  'active',
  DATE_TRUNC('day', NOW()) + INTERVAL '1 day'  -- Expires at end of day
);

-- Or use this version that automatically picks the first user:
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
  id,
  'Coffee & Walk in Clapham Common',
  'Join me for a casual coffee and walk around the common. Great way to meet neighbors!',
  'Coffee',
  'Clapham Common',
  ST_SetSRID(ST_MakePoint(-0.1476, 51.4526), 4326)::geography,
  NOW() + INTERVAL '2 hours',
  NOW() + INTERVAL '3 hours',
  false,
  5,
  'active',
  DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
FROM users
LIMIT 1;





