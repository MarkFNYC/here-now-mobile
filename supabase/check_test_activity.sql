-- Check if the test activity exists and its details
SELECT 
  id,
  title,
  status,
  start_time,
  end_time,
  expires_at,
  approximate_location IS NOT NULL as has_location,
  NOW() as current_time,
  start_time > NOW() as is_future,
  expires_at > NOW() as not_expired
FROM activities
WHERE title LIKE '%Coffee%Walk%'
ORDER BY created_at DESC
LIMIT 5;





