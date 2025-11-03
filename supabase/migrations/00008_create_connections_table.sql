-- Migration: Create connections table
-- Description: Stores connection requests between users (1:1 feature)

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connected_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_connections_user_id ON connections(user_id);
CREATE INDEX idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX idx_connections_status ON connections(status);

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own sent and received connection requests
CREATE POLICY "Users can view their own connections"
  ON connections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- Policy: Users can create connection requests
CREATE POLICY "Users can create connections"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update connections they're part of (for accepting/declining)
CREATE POLICY "Users can update their connections"
  ON connections FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connections_updated_at();
