-- ============================================================================
-- COMPLETE DATABASE SCHEMA FOR HERE-NOW MOBILE APP
-- Based on PRD Section 2.2
-- ============================================================================

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_or_email TEXT NOT NULL UNIQUE,
  is_verified BOOLEAN DEFAULT false,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  activity_tags TEXT[],
  neighbourhood TEXT,
  location GEOGRAPHY(POINT, 4326), -- PostGIS geography type
  is_on BOOLEAN DEFAULT false,
  last_toggled_on TIMESTAMPTZ,
  notification_settings JSONB DEFAULT '{}'::jsonb,
  blocked_user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  is_deactivated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_phone_or_email ON users(phone_or_email);
CREATE INDEX IF NOT EXISTS idx_users_is_on ON users(is_on) WHERE is_on = true;
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_users_activity_tags ON users USING GIN(activity_tags);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================================================
-- 2. ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT NOT NULL,
  location_name TEXT NOT NULL,
  approximate_location GEOGRAPHY(POINT, 4326),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_one_on_one BOOLEAN DEFAULT false,
  max_participants INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activities table
CREATE INDEX IF NOT EXISTS idx_activities_host_id ON activities(host_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_expires_at ON activities(expires_at);
CREATE INDEX IF NOT EXISTS idx_activities_approximate_location ON activities USING GIST(approximate_location);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_is_one_on_one ON activities(is_one_on_one);

-- ============================================================================
-- 3. CONNECTIONS TABLE (for 1:1 connections and activity requests)
-- ============================================================================
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('1on1', 'activity_request')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  meet_location TEXT,
  meet_time TIMESTAMPTZ,
  is_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for connections table
CREATE INDEX IF NOT EXISTS idx_connections_activity_id ON connections(activity_id);
CREATE INDEX IF NOT EXISTS idx_connections_requester_id ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_target_id ON connections(target_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_connection_type ON connections(connection_type);

-- Partial unique index: prevent duplicate connections for the same activity
CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_unique_activity 
  ON connections(requester_id, target_id, activity_id) 
  WHERE activity_id IS NOT NULL;

-- ============================================================================
-- 4. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_connection_id ON messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(connection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(connection_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- 5. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: update_user_location
DROP FUNCTION IF EXISTS update_user_location(UUID, FLOAT, FLOAT);
CREATE OR REPLACE FUNCTION update_user_location(
  user_id UUID,
  lat FLOAT,
  lng FLOAT
)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_nearby_users
-- Returns users within radius_km (default 5km) who are ON and not blocked
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
BEGIN
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
    AND ST_DWithin(
      u.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000 -- Convert km to meters
    )
  ORDER BY u.location <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_nearby_activities
-- Returns active activities within radius_km (default 5km)
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

-- Function: update_connections_updated_at
DROP FUNCTION IF EXISTS update_connections_updated_at();
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: update_users_updated_at
DROP FUNCTION IF EXISTS update_users_updated_at();
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for connections updated_at
DROP TRIGGER IF EXISTS connections_updated_at ON connections;
CREATE TRIGGER connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connections_updated_at();

-- Trigger for users updated_at
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can view other users who are ON (for feed)
DROP POLICY IF EXISTS "Users can view users who are on" ON users;
CREATE POLICY "Users can view users who are on"
  ON users FOR SELECT
  USING (
    is_on = true 
    AND is_deactivated = false
    AND (blocked_user_ids IS NULL OR auth.uid()::text != ANY(SELECT id::text FROM unnest(blocked_user_ids) AS id))
  );

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ACTIVITIES TABLE POLICIES
-- ============================================================================

-- Anyone can view active activities
DROP POLICY IF EXISTS "Anyone can view active activities" ON activities;
CREATE POLICY "Anyone can view active activities"
  ON activities FOR SELECT
  USING (status = 'active' AND expires_at > NOW());

-- Users can view their own activities (even if inactive)
DROP POLICY IF EXISTS "Users can view own activities" ON activities;
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (auth.uid() = host_id);

-- Users can create activities
DROP POLICY IF EXISTS "Users can create activities" ON activities;
CREATE POLICY "Users can create activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Users can update their own activities
DROP POLICY IF EXISTS "Users can update own activities" ON activities;
CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- ============================================================================
-- CONNECTIONS TABLE POLICIES
-- ============================================================================

-- Users can view connections they're involved in
DROP POLICY IF EXISTS "Users can view their connections" ON connections;
CREATE POLICY "Users can view their connections"
  ON connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Users can create connection requests
DROP POLICY IF EXISTS "Users can create connections" ON connections;
CREATE POLICY "Users can create connections"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Users can update connections they're part of
DROP POLICY IF EXISTS "Users can update their connections" ON connections;
CREATE POLICY "Users can update their connections"
  ON connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = target_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = target_id);

-- ============================================================================
-- MESSAGES TABLE POLICIES
-- ============================================================================

-- Users can view messages in connections they're part of
DROP POLICY IF EXISTS "Users can view messages in their connections" ON messages;
CREATE POLICY "Users can view messages in their connections"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM connections c
      WHERE c.id = messages.connection_id
      AND (c.requester_id = auth.uid() OR c.target_id = auth.uid())
    )
  );

-- Users can send messages in connections they're part of
DROP POLICY IF EXISTS "Users can send messages in their connections" ON messages;
CREATE POLICY "Users can send messages in their connections"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM connections c
      WHERE c.id = messages.connection_id
      AND (c.requester_id = auth.uid() OR c.target_id = auth.uid())
      AND c.status = 'accepted'
    )
  );

-- Users can update their own messages (e.g., mark as read)
DROP POLICY IF EXISTS "Users can update messages" ON messages;
CREATE POLICY "Users can update messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM connections c
      WHERE c.id = messages.connection_id
      AND (c.requester_id = auth.uid() OR c.target_id = auth.uid())
    )
  );

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can create notifications (handled via service role)
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION update_user_location(UUID, FLOAT, FLOAT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_users(FLOAT, FLOAT, FLOAT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_activities(FLOAT, FLOAT, FLOAT) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test PostGIS extension
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE EXCEPTION 'PostGIS extension is not enabled!';
  ELSE
    RAISE NOTICE 'PostGIS extension is enabled successfully';
  END IF;
END $$;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
