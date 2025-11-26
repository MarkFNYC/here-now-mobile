-- Insert a test activity near California location (37.96, -122.49)
-- This will create an activity in the San Francisco Bay Area

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
  'Coffee & Walk in the Park',
  'Join me for a casual coffee and walk. Great way to meet neighbors!',
  'Coffee',
  'Golden Gate Park',
  ST_SetSRID(ST_MakePoint(-122.49, 37.96), 4326)::geography,  -- Near your location
  NOW() + INTERVAL '2 hours',  -- Starts in 2 hours
  NOW() + INTERVAL '3 hours',  -- Ends in 3 hours
  false,  -- Pile-on activity
  5,  -- Max 5 participants
  'active',
  DATE_TRUNC('day', NOW()) + INTERVAL '1 day'  -- Expires at end of day
FROM users
LIMIT 1;





