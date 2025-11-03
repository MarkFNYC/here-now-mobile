# Here Now - MVP Product Requirements Document

**Version:** 1.0 \
 **Last Updated:** November 2, 2025 \
 **Status:** In Development \
 **Target Audience:** Engineering Team


## **1. Executive Summary**

### **1.1 Product Vision**

Here Now enables spontaneous, real-world connections between neighbors through time-bound, location-based availability. The core principle is "Go Online, to Get Offline" — using technology to facilitate immediate, same-day meetups within walking distance.

### **1.2 Current State**

- **Frontend:** React Native with Expo (in planning/early development)

- **UI/UX:** Design system established with Charcoal/Amber/Orange color scheme

- **Backend:** Supabase with PostGIS for geolocation

- **Data:** Moving from mock data to real implementation

### **1.3 MVP Scope**

This PRD covers 62 user stories required to ship a functional beta with real users. Focus is on core density-first launch in Clapham, London with 200-300 target users.

### **1.4 Success Criteria**

- **Primary:** 200-300 active users in single geographic cluster

- **Engagement:** 35%+ daily toggle rate

- **Conversion:** 25%+ of connections result in confirmed meetups

- **Safety:** <1% reported incidents, 100% ID verification


## **2. Technical Architecture**

### **2.1 Technology Stack**

**Frontend:**

- React Native with Expo

- React Navigation for routing

- Expo Location for geolocation

- Expo Notifications for push notifications

- AsyncStorage for local state

**Backend:**

- Supabase (PostgreSQL + PostGIS)

- Supabase Auth for authentication

- Supabase Realtime for live updates

- Supabase Storage for images

- Row Level Security (RLS) for data protection

**Services:**

- Firebase (supplementary services if needed)

- AI moderation for content safety

- ID verification service (e.g., Onfido, Jumio)

### **2.2 Database Schema**

#### **Core Tables**

#### ```
-- Users table`CREATE`` ``TABLE`` ``users`` ``(`
`  ``id`` ``UUID`` ``PRIMARY`` ``KEY`` ``DEFAULT`` ``uuid_generate_v4(),`
`  ``phone_or_email`` ``TEXT`` ``UNIQUE`` ``NOT`` ``NULL``,`
`  ``is_verified`` ``BOOLEAN`` ``DEFAULT`` ``FALSE``,`
`  ``full_name`` ``TEXT,`
`  ``photo_url`` ``TEXT,`
`  ``bio`` ``TEXT,`
`  ``activity_tags`` ``TEXT[],`
`  ``neighbourhood`` ``TEXT,`
`  ``location`` ``GEOGRAPHY(POINT,`` ``4326``),`` ``-- PostGIS for geolocation`
`  ``is_on`` ``BOOLEAN`` ``DEFAULT`` ``FALSE``,`
`  ``last_toggled_on`` ``TIMESTAMP``,`
`  ``notification_settings`` ``JSONB`` ``DEFAULT`` ``'{"requests": true, "joins": true, "messages": true}'``,`
`  ``created_at`` ``TIMESTAMP`` ``DEFAULT`` ``NOW(),`
`  ``updated_at`` ``TIMESTAMP`` ``DEFAULT`` ``NOW(),`
`  ``blocked_user_ids`` ``UUID[],`
`  ``is_deactivated`` ``BOOLEAN`` ``DEFAULT`` ``FALSE`
);-- Activities table`CREATE`` ``TABLE`` ``activities`` ``(`
`  ``id`` ``UUID`` ``PRIMARY`` ``KEY`` ``DEFAULT`` ``uuid_generate_v4(),`
`  ``host_id`` ``UUID`` ``REFERENCES`` ``users(id)`` ``ON`` ``DELETE`` ``CASCADE``,`
`  ``title`` ``TEXT`` ``NOT`` ``NULL``,`
`  ``description`` ``TEXT,`
`  ``activity_type`` ``TEXT,`` ``-- 'coffee', 'walk', 'lunch', etc.`
`  ``location_name`` ``TEXT,`` ``-- "Mayfield Cafe"`
`  ``approximate_location`` ``GEOGRAPHY(POINT,`` ``4326``),`
`  ``start_time`` ``TIMESTAMP`` ``NOT`` ``NULL``,`
`  ``end_time`` ``TIMESTAMP`` ``NOT`` ``NULL``,`
`  ``is_one_on_one`` ``BOOLEAN`` ``DEFAULT`` ``TRUE``,`` ``-- true = 1:1 only, false = pile-on allowed`
`  ``max_participants`` ``INTEGER``,`` ``-- null = unlimited`
`  ``status`` ``TEXT`` ``DEFAULT`` ``'active'``,`` ``-- 'active', 'confirmed', 'cancelled', 'completed'`
`  ``created_at`` ``TIMESTAMP`` ``DEFAULT`` ``NOW(),`
`  ``expires_at`` ``TIMESTAMP`` ``DEFAULT`` ``(NOW()`` ``+`` ``INTERVAL`` ``'1 day'``)`
);-- Connections table (handles both 1:1 requests and pile-on joins)`CREATE`` ``TABLE`` ``connections`` ``(`
`  ``id`` ``UUID`` ``PRIMARY`` ``KEY`` ``DEFAULT`` ``uuid_generate_v4(),`
`  ``activity_id`` ``UUID`` ``REFERENCES`` ``activities(id)`` ``ON`` ``DELETE`` ``CASCADE``,`
`  ``requester_id`` ``UUID`` ``REFERENCES`` ``users(id)`` ``ON`` ``DELETE`` ``CASCADE``,`
`  ``target_id`` ``UUID`` ``REFERENCES`` ``users(id)`` ``ON`` ``DELETE`` ``CASCADE``,`` ``-- host for pile-on, other user for 1:1`
`  ``connection_type`` ``TEXT`` ``NOT`` ``NULL``,`` ``-- '1:1' or 'pile_on'`
`  ``status`` ``TEXT`` ``DEFAULT`` ``'pending'``,`` ``-- 'pending', 'accepted', 'declined', 'cancelled'`
`  ``meet_location`` ``TEXT,`
`  ``meet_time`` ``TIMESTAMP``,`
`  ``is_confirmed`` ``BOOLEAN`` ``DEFAULT`` ``FALSE``,`
`  ``created_at`` ``TIMESTAMP`` ``DEFAULT`` ``NOW(),`
`  ``updated_at`` ``TIMESTAMP`` ``DEFAULT`` ``NOW(),`
`  ``expires_at`` ``TIMESTAMP``,`
`  ``UNIQUE``(activity_id,`` ``requester_id,`` ``target_id)`
);-- Messages table`CREATE`` ``TABLE`` ``messages`` ``(`
`  ``id`` ``UUID`` ``PRIMARY`` ``KEY`` ``DEFAULT`` ``uuid_generate_v4(),`
`  ``connection_id`` ``UUID`` ``REFERENCES`` ``connections(id)`` ``ON`` ``DELETE`` ``CASCADE``,`
`  ``sender_id`` ``UUID`` ``REFERENCES`` ``users(id)`` ``ON`` ``DELETE`` ``CASCADE``,`
`  ``content`` ``TEXT`` ``NOT`` ``NULL``,`
`  ``is_system_message`` ``BOOLEAN`` ``DEFAULT`` ``FALSE``,`
`  ``created_at`` ``TIMESTAMP`` ``DEFAULT`` ``NOW(),`
`  ``read_at`` ``TIMESTAMP`
);-- Reports table`CREATE`` ``TABLE`` ``reports`` ``(`
`  ``id`` ``UUID`` ``PRIMARY`` ``KEY`` ``DEFAULT`` ``uuid_generate_v4(),`
`  ``reporter_id`` ``UUID`` ``REFERENCES`` ``users(id)`` ``ON`` ``DELETE`` ``CASCADE``,`
`  ``reported_user_id`` ``UUID`` ``REFERENCES`` ``users(id)`` ``ON`` ``DELETE`` ``CASCADE``,`
`  ``reason`` ``TEXT`` ``NOT`` ``NULL``,`
`  ``details`` ``TEXT,`
`  ``status`` ``TEXT`` ``DEFAULT`` ``'pending'``,`` ``-- 'pending', 'reviewed', 'actioned'`
`  ``admin_notes`` ``TEXT,`
`  ``created_at`` ``TIMESTAMP`` ``DEFAULT`` ``NOW(),`
`  ``reviewed_at`` ``TIMESTAMP``,`
`  ``reviewed_by`` ``UUID`` ``REFERENCES`` ``users(id)`
);-- Notifications table`CREATE`` ``TABLE`` ``notifications`` ``(`
`  ``id`` ``UUID`` ``PRIMARY`` ``KEY`` ``DEFAULT`` ``uuid_generate_v4(),`
`  ``user_id`` ``UUID`` ``REFERENCES`` ``users(id)`` ``ON`` ``DELETE`` ``CASCADE``,`
`  ``type`` ``TEXT`` ``NOT`` ``NULL``,`` ``-- 'request', 'join', 'message', 'confirmation', etc.`
`  ``title`` ``TEXT`` ``NOT`` ``NULL``,`
`  ``body`` ``TEXT`` ``NOT`` ``NULL``,`
`  ``data`` ``JSONB,`` ``-- Additional data (connection_id, activity_id, etc.)`
`  ``is_read`` ``BOOLEAN`` ``DEFAULT`` ``FALSE``,`
`  ``created_at`` ``TIMESTAMP`` ``DEFAULT`` ``NOW()`
);-- Analytics/Events table`CREATE`` ``TABLE`` ``events`` ``(`
`  ``id`` ``UUID`` ``PRIMARY`` ``KEY`` ``DEFAULT`` ``uuid_generate_v4(),`
`  ``user_id`` ``UUID`` ``REFERENCES`` ``users(id)`` ``ON`` ``DELETE`` ``SET`` ``NULL``,`
`  ``event_type`` ``TEXT`` ``NOT`` ``NULL``,`` ``-- 'toggle_on', 'activity_created', 'connection_requested', etc.`
`  ``metadata`` ``JSONB,`
`  ``created_at`` ``TIMESTAMP`` ``DEFAULT`` ``NOW()`
);
```
#### **Indexes for Performance**

#### ```
-- Location-based queries`CREATE`` ``INDEX`` ``idx_users_location`` ``ON`` ``users`` ``USING`` ``GIST(location);`
`CREATE`` ``INDEX`` ``idx_activities_location`` ``ON`` ``activities`` ``USING`` ``GIST(approximate_location);`
-- Time-based queries`CREATE`` ``INDEX`` ``idx_users_is_on`` ``ON`` ``users(is_on)`` ``WHERE`` ``is_on`` ``=`` ``true;`
`CREATE`` ``INDEX`` ``idx_activities_active`` ``ON`` ``activities(status,`` ``start_time)`` ``WHERE`` ``status`` ``=`` ``'active'``;`
`CREATE`` ``INDEX`` ``idx_connections_status`` ``ON`` ``connections(status,`` ``created_at);`
-- User-specific queries`CREATE`` ``INDEX`` ``idx_connections_requester`` ``ON`` ``connections(requester_id,`` ``status);`
`CREATE`` ``INDEX`` ``idx_connections_target`` ``ON`` ``connections(target_id,`` ``status);`
`CREATE`` ``INDEX`` ``idx_messages_connection`` ``ON`` ``messages(connection_id,`` ``created_at);`
`CREATE`` ``INDEX`` ``idx_notifications_user`` ``ON`` ``notifications(user_id,`` ``is_read,`` ``created_at);`

```
#### **Database Functions**

#### ```
-- Function to find nearby users who are ON`CREATE`` ``OR`` ``REPLACE`` ``FUNCTION`` ``get_nearby_users(`
`  ``user_lat`` ``FLOAT``,`
`  ``user_lng`` ``FLOAT``,`
`  ``radius_km`` ``FLOAT`` ``DEFAULT`` ``5`
)`RETURNS`` ``TABLE`` ``(`
`  ``id`` ``UUID,`
`  ``full_name`` ``TEXT,`
`  ``photo_url`` ``TEXT,`
`  ``bio`` ``TEXT,`
`  ``activity_tags`` ``TEXT[],`
`  ``distance_km`` ``FLOAT`
`)`` ``AS`` ``$$`
BEGIN`  ``RETURN`` ``QUERY`
`  ``SELECT`` `
`    ``u.id,`
`    ``u.full_name,`
`    ``u.photo_url,`
`    ``u.bio,`
`    ``u.activity_tags,`
`    ``ST_Distance(`
`      ``u.location::geography,`
`      ``ST_SetSRID(ST_MakePoint(user_lng,`` ``user_lat),`` ``4326``)::geography`
`    ``)`` ``/`` ``1000`` ``AS`` ``distance_km`
`  ``FROM`` ``users`` ``u`
`  ``WHERE`` `
`    ``u.is_on`` ``=`` ``true`
`    ``AND`` ``u.is_deactivated`` ``=`` ``false`
`    ``AND`` ``ST_DWithin(`
`      ``u.location::geography,`
`      ``ST_SetSRID(ST_MakePoint(user_lng,`` ``user_lat),`` ``4326``)::geography,`
`      ``radius_km`` ``*`` ``1000`
`    ``)`
`  ``ORDER`` ``BY`` ``distance_km;`
`END``;`
`$$`` ``LANGUAGE`` ``plpgsql;`
-- Function to find nearby activities`CREATE`` ``OR`` ``REPLACE`` ``FUNCTION`` ``get_nearby_activities(`
`  ``user_lat`` ``FLOAT``,`
`  ``user_lng`` ``FLOAT``,`
`  ``radius_km`` ``FLOAT`` ``DEFAULT`` ``5`
)`RETURNS`` ``TABLE`` ``(`
`  ``id`` ``UUID,`
`  ``title`` ``TEXT,`
`  ``description`` ``TEXT,`
`  ``activity_type`` ``TEXT,`
`  ``location_name`` ``TEXT,`
`  ``start_time`` ``TIMESTAMP``,`
`  ``end_time`` ``TIMESTAMP``,`
`  ``is_one_on_one`` ``BOOLEAN``,`
`  ``host_id`` ``UUID,`
`  ``host_name`` ``TEXT,`
`  ``distance_km`` ``FLOAT``,`
`  ``participant_count`` ``BIGINT`
`)`` ``AS`` ``$$`
BEGIN`  ``RETURN`` ``QUERY`
`  ``SELECT`` `
`    ``a.id,`
`    ``a.title,`
`    ``a.description,`
`    ``a.activity_type,`
`    ``a.location_name,`
`    ``a.start_time,`
`    ``a.end_time,`
`    ``a.is_one_on_one,`
`    ``a.host_id,`
`    ``u.full_name`` ``AS`` ``host_name,`
`    ``ST_Distance(`
`      ``a.approximate_location::geography,`
`      ``ST_SetSRID(ST_MakePoint(user_lng,`` ``user_lat),`` ``4326``)::geography`
`    ``)`` ``/`` ``1000`` ``AS`` ``distance_km,`
`    ``COUNT``(c.id)`` ``AS`` ``participant_count`
`  ``FROM`` ``activities`` ``a`
`  ``JOIN`` ``users`` ``u`` ``ON`` ``a.host_id`` ``=`` ``u.id`
`  ``LEFT`` ``JOIN`` ``connections`` ``c`` ``ON`` ``a.id`` ``=`` ``c.activity_id`` ``AND`` ``c.status`` ``=`` ``'accepted'`
`  ``WHERE`` `
`    ``a.status`` ``=`` ``'active'`
`    ``AND`` ``a.start_time`` ``>`` ``NOW()`
`    ``AND`` ``a.expires_at`` ``>`` ``NOW()`
`    ``AND`` ``ST_DWithin(`
`      ``a.approximate_location::geography,`
`      ``ST_SetSRID(ST_MakePoint(user_lng,`` ``user_lat),`` ``4326``)::geography,`
`      ``radius_km`` ``*`` ``1000`
`    ``)`
`  ``GROUP`` ``BY`` ``a.id,`` ``u.full_name`
`  ``ORDER`` ``BY`` ``distance_km;`
`END``;`
`$$`` ``LANGUAGE`` ``plpgsql;`
-- Function for midnight reset (run via cron job)`CREATE`` ``OR`` ``REPLACE`` ``FUNCTION`` ``midnight_reset()`
`RETURNS`` ``void`` ``AS`` ``$$`
BEGIN`  ``-- Reset all users to OFF`
`  ``UPDATE`` ``users`` ``SET`` ``is_on`` ``=`` ``false`` ``WHERE`` ``is_on`` ``=`` ``true;`
  `  ``-- Mark expired activities as completed`
`  ``UPDATE`` ``activities`` `
`  ``SET`` ``status`` ``=`` ``'completed'`` `
`  ``WHERE`` ``status`` ``=`` ``'active'`` ``AND`` ``end_time`` ``<`` ``NOW();`
  `  ``-- Clear old messages (optional - keep for now for history)`
`  ``-- DELETE FROM messages WHERE created_at < NOW() - INTERVAL '1 day';`
  `  ``-- Clear old notifications`
`  ``DELETE`` ``FROM`` ``notifications`` ``WHERE`` ``created_at`` ``<`` ``NOW()`` ``-`` ``INTERVAL`` ``'7 days'``;`
`END``;`
`$$`` ``LANGUAGE`` ``plpgsql;`

```
### **2.3 Row Level Security (RLS) Policies**

### ```
-- Enable RLS on all tables`ALTER`` ``TABLE`` ``users`` ``ENABLE`` ``ROW`` ``LEVEL`` ``SECURITY``;`
`ALTER`` ``TABLE`` ``activities`` ``ENABLE`` ``ROW`` ``LEVEL`` ``SECURITY``;`
`ALTER`` ``TABLE`` ``connections`` ``ENABLE`` ``ROW`` ``LEVEL`` ``SECURITY``;`
`ALTER`` ``TABLE`` ``messages`` ``ENABLE`` ``ROW`` ``LEVEL`` ``SECURITY``;`
`ALTER`` ``TABLE`` ``reports`` ``ENABLE`` ``ROW`` ``LEVEL`` ``SECURITY``;`
`ALTER`` ``TABLE`` ``notifications`` ``ENABLE`` ``ROW`` ``LEVEL`` ``SECURITY``;`
-- Users policies`CREATE`` ``POLICY`` ``"Users can view non-blocked users"`
`  ``ON`` ``users`` ``FOR`` ``SELECT`
`  ``USING`` ``(`
`    ``auth.uid()`` ``=`` ``id`` `
`    ``OR`` ``(is_on`` ``=`` ``true`` ``AND`` ``NOT`` ``(auth.uid()`` ``=`` ``ANY``(blocked_user_ids)))`
`  ``);`
`CREATE`` ``POLICY`` ``"Users can update their own profile"`
`  ``ON`` ``users`` ``FOR`` ``UPDATE`
`  ``USING`` ``(auth.uid()`` ``=`` ``id);`
-- Activities policies`CREATE`` ``POLICY`` ``"Anyone can view active activities"`
`  ``ON`` ``activities`` ``FOR`` ``SELECT`
`  ``USING`` ``(status`` ``=`` ``'active'`` ``AND`` ``expires_at`` ``>`` ``NOW());`
`CREATE`` ``POLICY`` ``"Users can create activities"`
`  ``ON`` ``activities`` ``FOR`` ``INSERT`
`  ``WITH`` ``CHECK`` ``(auth.uid()`` ``=`` ``host_id);`
`CREATE`` ``POLICY`` ``"Hosts can update their activities"`
`  ``ON`` ``activities`` ``FOR`` ``UPDATE`
`  ``USING`` ``(auth.uid()`` ``=`` ``host_id);`
-- Connections policies`CREATE`` ``POLICY`` ``"Users can view their connections"`
`  ``ON`` ``connections`` ``FOR`` ``SELECT`
`  ``USING`` ``(auth.uid()`` ``=`` ``requester_id`` ``OR`` ``auth.uid()`` ``=`` ``target_id);`
`CREATE`` ``POLICY`` ``"Users can create connections"`
`  ``ON`` ``connections`` ``FOR`` ``INSERT`
`  ``WITH`` ``CHECK`` ``(auth.uid()`` ``=`` ``requester_id);`
`CREATE`` ``POLICY`` ``"Target users can update connection status"`
`  ``ON`` ``connections`` ``FOR`` ``UPDATE`
`  ``USING`` ``(auth.uid()`` ``=`` ``target_id);`
-- Messages policies`CREATE`` ``POLICY`` ``"Users can view messages in their connections"`
`  ``ON`` ``messages`` ``FOR`` ``SELECT`
`  ``USING`` ``(`
`    ``EXISTS`` ``(`
`      ``SELECT`` ``1`` ``FROM`` ``connections`` ``c`
`      ``WHERE`` ``c.id`` ``=`` ``connection_id`` `
`      ``AND`` ``(c.requester_id`` ``=`` ``auth.uid()`` ``OR`` ``c.target_id`` ``=`` ``auth.uid())`
`    ``)`
`  ``);`
`CREATE`` ``POLICY`` ``"Users can send messages in their connections"`
`  ``ON`` ``messages`` ``FOR`` ``INSERT`
`  ``WITH`` ``CHECK`` ``(`
`    ``auth.uid()`` ``=`` ``sender_id`
`    ``AND`` ``EXISTS`` ``(`
`      ``SELECT`` ``1`` ``FROM`` ``connections`` ``c`
`      ``WHERE`` ``c.id`` ``=`` ``connection_id`` `
`      ``AND`` ``c.status`` ``=`` ``'accepted'`
`      ``AND`` ``(c.requester_id`` ``=`` ``auth.uid()`` ``OR`` ``c.target_id`` ``=`` ``auth.uid())`
`    ``)`
`  ``);`
-- Notifications policies`CREATE`` ``POLICY`` ``"Users can view their own notifications"`
`  ``ON`` ``notifications`` ``FOR`` ``SELECT`
`  ``USING`` ``(auth.uid()`` ``=`` ``user_id);`
`CREATE`` ``POLICY`` ``"Users can update their own notifications"`
`  ``ON`` ``notifications`` ``FOR`` ``UPDATE`
`  ``USING`` ``(auth.uid()`` ``=`` ``user_id);`

```
## **3. Feature Requirements by User Story**

### **3.1 DISCOVER (Stories 1-16)**

#### **Location + Presence (1-6)**

**Story 1: See people nearby who are available today**

- **Implementation:**

- Use `get_nearby_users()` function with user's current location

- Display users in card grid sorted by distance

- Show: photo, name, bio snippet, distance, activity tags

- **Frontend Components:** `NearbyUsersList`, `UserCard`

- **API Endpoint:** `GET /api/users/nearby?lat={lat}&lng={lng}&radius={km}`

- **Acceptance Criteria:**

- Users only appear if `is_on = true`

- Distance shown in meters (<1km) or km (>1km)

- Blocked users never appear

- Updates in real-time as users toggle ON/OFF

**Story 2: See activities happening nearby**

- **Implementation:**

- Use `get_nearby_activities()` function

- Display activities in card list sorted by start time then distance

- Show: title, activity type, location name, time window, host name, participant count, distance

- **Frontend Components:** `NearbyActivitiesList`, `ActivityCard`

- **API Endpoint:** `GET /api/activities/nearby?lat={lat}&lng={lng}&radius={km}`

- **Acceptance Criteria:**

- Only show activities with `status = 'active'` and `start_time > NOW()`

- Show "Starting soon" badge if within 30 minutes

- Show "Later today" badge if >2 hours away

**Story 3: See distance/time to person or activity**

- **Implementation:**

- Calculate using PostGIS `ST_Distance()`

- Show walking time estimate (4km/hour = 15min/km)

- **Display Logic:**

- 0-100m: "Nearby" (🚶 <5 min)

- 100-500m: "X meters" (🚶 Y min)

- 500m-2km: "X.X km" (🚶 Y min)

- 2km+: "X km" (🚶 Y min)

- **Acceptance Criteria:**

- Distance updates if user moves >100m

- Walking time rounds to nearest 5 minutes

**Story 4: See approximate location of activity**

- **Implementation:**

- Store `approximate_location` as point within 100m of actual location

- Display on map with 100m radius circle (not precise pin)

- Show neighborhood name text

- **Frontend Components:** `ActivityMap`, `LocationCircle`

- **Privacy:** Never show exact coordinates, only approximate area

- **Acceptance Criteria:**

- Map shows general area, not precise location

- Clicking map shows activity details

**Story 5: See group size on activity**

- **Implementation:**

- Count accepted connections: `SELECT COUNT(*) FROM connections WHERE activity_id = X AND status = 'accepted'`

- Display "X going" or "1:1 only"

- **Display Logic:**

- 1:1 mode: Show "1:1 meetup" badge

- Pile-on with 0: Show "Be the first to join"

- Pile-on with N: Show "N going"

- **Acceptance Criteria:**

- Count updates in real-time as people join

- Shows max capacity if set (e.g., "3/5 spots")

**Story 6: See who is currently ON**

- **Implementation:**

- Query `users WHERE is_on = true`

- Subscribe to Supabase Realtime for instant updates

- Show green indicator dot on profile photos

- **Frontend Components:** `OnlineIndicator`, `OnlineUsersList`

- **Realtime Channel:** `presence:nearby`

- **Acceptance Criteria:**

- Indicator appears within 2 seconds of toggle

- Indicator disappears within 2 seconds of toggle OFF or midnight reset

- Works offline (shows last known state)

#### **Availability (7-8)**

**Story 7: Toggle "I'M ON" to show availability**

- **Implementation:**

- Toggle button in header (primary action)

- Updates `users.is_on` and `users.last_toggled_on`

- Broadcasts presence change via Realtime

- Requests location permission if not granted

- Updates user location on toggle ON

- **Frontend Components:** `OnToggle` button with animation

- **API Endpoint:** `POST /api/users/toggle-on`

- **Acceptance Criteria:**

- Button is prominent and always visible

- Shows confirmation modal first time ("This shares your approximate location")

- Provides haptic feedback on toggle

- Updates location in background every 5 minutes while ON

**Story 8: ON/OFF state resets daily**

- **Implementation:**

- Cron job runs `midnight_reset()` at 00:00 local time

- Sets all `is_on = false`

- Sends push notification: "Here Now reset. Toggle ON to be visible today."

- **Backend Job:** Supabase Edge Function triggered by pg_cron

- **Acceptance Criteria:**

- Resets at midnight in user's timezone

- Users receive notification (if enabled)

- App reflects new state on next open

#### **Filters (9-13)**

**Story 9: Filter by distance**

- **Implementation:**

- Slider: 500m, 1km, 2km, 5km, 10km

- Updates `radius` parameter in queries

- Persists preference locally

- **Frontend Components:** `DistanceFilter` slider

- **Acceptance Criteria:**

- Default is 2km

- Results update immediately on change

- Shows "X people/activities within Y km"

**Story 10: Filter by activity type**

- **Implementation:**

- Multi-select chips: Coffee, Walk, Lunch, Drinks, Sport, Creative, etc.

- Filters activities by `activity_type`

- Filters users by matching `activity_tags`

- **Frontend Components:** `ActivityTypeFilter` chip group

- **Acceptance Criteria:**

- Can select multiple types

- "Clear all" option

- Shows count of results per type

**Story 11: Filter by time**

- **Implementation:**

- Tabs: "Now" (<30 min), "Later Today" (30min - midnight)

- Filters activities by `start_time`

- **Frontend Components:** `TimeFilter` tabs

- **Acceptance Criteria:**

- Default shows all

- "Now" prioritizes urgent activities

**Story 12: Filter by 1:1 vs group**

- **Implementation:**

- Tabs: "All", "1:1 Only", "Groups"

- Filters activities by `is_one_on_one`

- **Frontend Components:** `MeetupTypeFilter` tabs

- **Acceptance Criteria:**

- Default shows all

- Clear visual difference between types

**Story 13: View all options (no filters)**

- **Implementation:**

- "Clear all filters" button

- Resets to default state

- **Acceptance Criteria:**

- Single tap clears all filters

- Shows confirmation of reset

#### **Fallback (14-16)**

**Story 14: Message when no one nearby**

- **Implementation:**

- Empty state component when query returns 0 results

- Show friendly message + suggestions

- **Frontend Components:** `EmptyState`

- **Copy:**

- "No one nearby right now"

- "Be the first! Toggle ON to be visible to others"

- "Or try widening your distance"

- **Acceptance Criteria:**

- Shows illustration

- Provides actionable next steps

**Story 15: Suggestions to turn ON**

- **Implementation:**

- If user is OFF, show prompt: "Toggle ON to see who's around"

- After 3 days inactive: push notification

- **Acceptance Criteria:**

- Non-intrusive suggestion

- Easy one-tap action

**Story 16: Suggestions to widen filters**

- **Implementation:**

- If results < 3, show: "Only X nearby. Try 5km?"

- Button to expand to next distance tier

- **Acceptance Criteria:**

- Smart suggestions based on current filters

- One-tap expansion


### **3.2 DECIDE (Stories 17-23)**

**Story 17: View lightweight profile**

- **Implementation:**

- Modal or new screen with user details

- Shows: photo, full name, bio, activity tags, neighborhood, "ON today" indicator

- Hides: precise location, contact info

- **Frontend Components:** `UserProfile` modal

- **API Endpoint:** `GET /api/users/:id/profile`

- **Acceptance Criteria:**

- Opens from user card tap

- Shows "Send request" or "Create activity" CTA

- Cannot access if blocked

**Story 18: View activity details**

- **Implementation:**

- Modal or new screen with activity info

- Shows: title, description, activity type, location name, map, time window, host profile, participants list

- **Frontend Components:** `ActivityDetail` modal

- **API Endpoint:** `GET /api/activities/:id`

- **Acceptance Criteria:**

- Opens from activity card tap

- Shows "Request to join" or "Join activity" CTA

- Shows participant avatars

**Story 19: "Today only" indicator**

- **Implementation:**

- Badge on all activities: "Today only"

- Countdown if <1 hour: "Starts in 45 min"

- **Frontend Components:** `TodayBadge`, `CountdownTimer`

- **Acceptance Criteria:**

- Visually prominent

- Creates urgency without anxiety

**Story 20: Time window display**

- **Implementation:**

- Show start-end: "3:00 PM - 5:00 PM"

- Show duration: "(2 hours)"

- Show relative time: "In 45 minutes"

- **Acceptance Criteria:**

- Uses 12-hour format (configurable)

- Shows timezone if different from user

**Story 21: Activity tags display**

- **Implementation:**

- Show chips for activity type: ☕ Coffee, 🚶 Walk, etc.

- Color-coded by category

- **Frontend Components:** `ActivityTags` chip group

- **Acceptance Criteria:**

- Max 3 visible, "+X more" if needed

- Tappable to filter by tag

**Story 22: 1:1 vs pile-on indicator**

- **Implementation:**

- Badge: "1:1 meetup" or "Group activity"

- Icon: 👤 for 1:1, 👥 for group

- **Acceptance Criteria:**

- Clear visual difference

- Explains behavior difference

**Story 23: Participant count**

- **Implementation:**

- Show "X going" with avatar stack

- Show max capacity if set: "3/5 spots"

- **Acceptance Criteria:**

- Updates in real-time

- Shows "Full" if at capacity


### **3.3 CONNECT (Stories 24-37)**

#### **1:1 Flow (24-30)**

**Story 24: Send 1:1 request**

- **Implementation:**

- Button: "Send request" on user profile

- Optional message (max 200 chars)

- Creates connection record with `status = 'pending'`

- Sends notification to target user

- **Frontend Components:** `SendRequestButton`, `RequestModal`

- **API Endpoint:** `POST /api/connections/request`

- `{``  ``"target_user_id"``:`` ``"uuid"``,``  ``"message"``:`` ``"Hey! Want to grab coffee?"``}`

- **Acceptance Criteria:**

- Cannot send if already have pending/active connection

- Shows confirmation: "Request sent!"

- Target receives notification within 5 seconds

**Story 25: Accept/decline requests**

- **Implementation:**

- Request appears in notifications and "Requests" tab

- Shows requester profile, message, activity suggestion

- Buttons: "Accept" (✓), "Not today" (✗)

- Accept → `status = 'accepted'`, opens DM

- Decline → `status = 'declined'`, sends polite auto-message

- **Frontend Components:** `RequestCard`, `AcceptDeclineButtons`

- **API Endpoints:**

- ```
POST /api/connections/:id/accept
POST /api/connections/:id/decline
```
- **Acceptance Criteria:**

- Accept opens chat immediately

- Decline sends message: "Not today, but thanks for reaching out!"

- Both remove from pending list

**Story 26: Message after acceptance**

- **Implementation:**

- Chat opens automatically on accept

- Standard messaging UI with real-time updates

- System message: "Say hi! Coordinate where and when to meet."

- **Frontend Components:** `ChatScreen`, `MessageList`, `MessageInput`

- **API Endpoints:**

- ```
GET /api/connections/:id/messages
POST /api/connections/:id/messages
Realtime: Subscribe to `connection:${id}:messages`

```
- **Acceptance Criteria:**

- Messages appear within 1 second

- Shows typing indicator

- Supports text only (no images in MVP)

**Story 27: Propose meet location**

- **Implementation:**

- Button in chat: "Suggest location"

- Search nearby places (cafes, parks, etc.)

- Sends special message with location data

- Renders as interactive card in chat

- **Frontend Components:** `LocationPicker`, `LocationMessageCard`

- **API Endpoint:** `POST /api/connections/:id/messages` with `type: 'location'`

- **Data Structure:**

- `{``  ``"type"``:`` ``"location"``,``  ``"location_name"``:`` ``"Mayfield Cafe"``,``  ``"location_address"``:`` ``"123 High St"``,``  ``"location_coordinates"``:`` ``{``"lat"``:`` ``51``.``5``,`` ``"lng"``:`` ``-0``.``1``}}`

- **Acceptance Criteria:**

- Shows map preview

- Tappable to open in maps app

- Other user can accept/propose alternative

**Story 28: Propose meet time**

- **Implementation:**

- Button in chat: "Suggest time"

- Time picker (quick options: 30min, 1hr, 2hr, custom)

- Sends special message with time data

- **Frontend Components:** `TimePicker`, `TimeMessageCard`

- **API Endpoint:** `POST /api/connections/:id/messages` with `type: 'time'`

- **Acceptance Criteria:**

- Shows relative time ("In 45 minutes")

- Other user can accept/propose alternative

- Creates calendar event on confirm

**Story 29: Adjust place/time**

- **Implementation:**

- Either user can propose new place/time

- Shows history of proposals in chat

- "Confirm" button appears when both agree

- **Acceptance Criteria:**

- Clear visual of proposal vs confirmed

- Easy to see current plan

**Story 30: Receive notifications for requests**

- **Implementation:**

- Push notification on new request

- Badge on "Requests" tab

- In-app notification banner

- **Notification Copy:** "X wants to meet today"

- **Acceptance Criteria:**

- Notification sent within 5 seconds

- Deep links to request

- Respects notification settings

#### **Pile-On Flow (31-35)**

**Story 31: Join existing activity (pile-on)**

- **Implementation:**

- Button: "Join activity" on activity detail

- Creates connection with `type = 'pile_on'`, `status = 'pending'`

- Host receives notification

- User added to "waiting for confirmation" list

- **Frontend Components:** `JoinActivityButton`

- **API Endpoint:** `POST /api/activities/:id/join`

- **Acceptance Criteria:**

- Cannot join if at capacity

- Cannot join own activity

- Shows "Waiting for host confirmation"

**Story 32: Host notified when someone joins**

- **Implementation:**

- Push notification: "X wants to join your activity"

- Badge on activity card

- Host sees joiner profile

- **Acceptance Criteria:**

- Notification sent within 5 seconds

- Deep links to activity management

**Story 33: Host sees who joined**

- **Implementation:**

- Activity detail shows two lists:

- "Going" (confirmed participants)

- "Waiting" (pending participants)

- Host can tap to view profile and accept/decline

- **Frontend Components:** `ParticipantsList`, `ParticipantCard`

- **API Endpoint:** `GET /api/activities/:id/participants`

- **Acceptance Criteria:**

- Updates in real-time

- Shows accept/decline buttons for host only

**Story 34: Participant messages host**

- **Implementation:**

- Accepted participants join group chat

- All participants see all messages

- Host can send broadcast messages

- **Frontend Components:** `GroupChat`

- **API Endpoints:**

- ```
GET /api/activities/:id/chat
POST /api/activities/:id/chat
Realtime: Subscribe to `activity:${id}:chat`

```
- **Acceptance Criteria:**

- Messages visible to all confirmed participants

- Shows sender name/avatar

- System messages for joins/leaves

**Story 35: Host confirms group meet details**

- **Implementation:**

- Host sends final confirmation message with location & time

- All participants receive notification

- Activity status → `confirmed`

- Adds to calendar

- **Frontend Components:** `ConfirmDetailsButton`, `FinalDetailsCard`

- **API Endpoint:** `POST /api/activities/:id/confirm`

- **Acceptance Criteria:**

- Sends notification to all participants

- Creates calendar event for all

- Shows "Confirmed" badge

#### **Confirm (36-37)**

**Story 36: Confirm the meet**

- **Implementation:**

- Both users must confirm to lock details

- Button: "Confirm meetup"

- Updates connection: `is_confirmed = true`, `meet_time`, `meet_location`

- Sends notification to other user

- Adds to "Today's Plans" section

- **Frontend Components:** `ConfirmButton`, `ConfirmationModal`

- **API Endpoint:** `POST /api/connections/:id/confirm`

- **Acceptance Criteria:**

- Both users see confirmation

- Creates calendar event

- Sends reminder notification 15 min before

**Story 37: Cancel the meet**

- **Implementation:**

- Button: "Cancel meetup" (requires confirmation)

- Updates connection: `status = 'cancelled'`

- Sends notification with reason option

- System message in chat

- **Frontend Components:** `CancelButton`, `CancelModal`

- **API Endpoint:** `POST /api/connections/:id/cancel`

- **Acceptance Criteria:**

- Asks for brief reason (optional)

- Sends polite message to other user

- Removes from "Today's Plans"

- Allows rescheduling


### **3.4 MEET (Stories 38-40)**

**Story 38: View confirmed details**

- **Implementation:**

- "Today's Plans" tab shows all confirmed meetups

- Card shows: other person's photo, location, time, directions button

- Countdown timer to meetup

- **Frontend Components:** `TodaysPlans`, `ConfirmedMeetupCard`

- **API Endpoint:** `GET /api/connections/today`

- **Acceptance Criteria:**

- Always accessible from main nav

- Shows real-time countdown

- Quick access to chat and map

**Story 39: Edit meeting time**

- **Implementation:**

- Button in chat: "Change time"

- Requires mutual agreement (same as proposal flow)

- Sends notification to other user

- **Acceptance Criteria:**

- Both users must agree to change

- Updates calendar event

- Shows clear confirmation

**Story 40: Suggested public locations**

- **Implementation:**

- Location picker shows nearby public spaces

- Filters: Cafes, Parks, Restaurants, Bars

- Powered by Google Places API

- Prioritizes well-lit, public areas

- **Frontend Components:** `PublicLocationList`

- **API Endpoint:** `GET /api/locations/nearby?type={type}`

- **Acceptance Criteria:**

- Shows ratings and photos

- Opening hours visible

- Safety indicators (e.g., "Busy area")


### **3.5 RESET (Stories 41-45)**

**Story 41: Chats clear at midnight**

- **Implementation:**

- `midnight_reset()` function archives messages

- Messages table: add `archived_at` column

- Archived messages hidden from UI but kept for safety/moderation

- **Acceptance Criteria:**

- Users see fresh inbox daily

- Chat history recoverable by admins if needed for safety

**Story 42: Activities/intent clear at midnight**

- **Implementation:**

- `midnight_reset()` marks activities as `completed` or `expired`

- Removes from active feed

- Archives for analytics

- **Acceptance Criteria:**

- Feed is fresh daily

- Past activities not searchable by users

**Story 43: ON state resets at midnight**

- **Implementation:**

- Already covered in Story 8

- `midnight_reset()` sets all `is_on = false`

- **Acceptance Criteria:**

- Resets at midnight in user's timezone

- Push notification sent (if enabled)

**Story 44: Manually clear connection early**

- **Implementation:**

- Button in chat: "End conversation"

- Confirmation modal

- Updates connection: `status = 'ended'`

- Removes from active list

- **Frontend Components:** `EndConversationButton`

- **API Endpoint:** `POST /api/connections/:id/end`

- **Acceptance Criteria:**

- Requires confirmation

- Other user sees polite message

- Can still report if needed

**Story 45: Exchange contact off-app**

- **Implementation:**

- Button in chat: "Share contact"

- Opens modal to share phone/email/Instagram

- Optional, user-initiated only

- App does not store shared contact info

- **Frontend Components:** `ShareContactButton`, `ShareContactModal`

- **Acceptance Criteria:**

- Purely user-driven (no prompts)

- App does not track off-platform communication

- Shows disclaimer about safety


### **3.6 ACCOUNT + PROFILE (Stories 46-52)**

**Story 46: Create account via phone/email**

- **Implementation:**

- Supabase Auth with phone or email

- Phone: SMS verification code

- Email: Magic link

- Creates user record in `users` table

- **Frontend Components:** `SignUpScreen`, `PhoneInput`, `EmailInput`

- **API:** Supabase Auth API

- **Acceptance Criteria:**

- Phone numbers validated before sending SMS

- Email addresses validated before sending link

- Auto-login after verification

- Graceful error handling

**Story 47: Verify account**

- **Implementation:**

- ID verification via third-party service (Onfido, Jumio)

- Verifies government ID + selfie

- Updates `users.is_verified = true`

- Unverified users have limited access

- **Frontend Components:** `IDVerificationFlow`

- **API Endpoint:** `POST /api/users/verify` (initiates verification)

- **Acceptance Criteria:**

- Verification within 5 minutes (target)

- Clear instructions and examples

- Privacy policy visible

- Cannot be bypassed

**Story 48: Add photo**

- **Implementation:**

- Take photo in-app (preferred) or upload from gallery

- AI moderation for inappropriate content

- Stored in Supabase Storage

- URL saved in `users.photo_url`

- **Frontend Components:** `PhotoUpload`, `CameraCapture`

- **API Endpoint:** `POST /api/users/photo`

- **Acceptance Criteria:**

- Photo required to complete profile

- AI rejects inappropriate images

- Clear face visible (face detection check)

- Can retake/replace anytime

**Story 49: Add bio**

- **Implementation:**

- Text input, max 150 characters

- AI moderation for inappropriate content

- Saved in `users.bio`

- **Frontend Components:** `BioInput`

- **API Endpoint:** `PATCH /api/users/profile`

- **Acceptance Criteria:**

- Optional but encouraged

- Character counter visible

- No URLs or contact info allowed (validation)

- AI flags suspicious content

**Story 50: Add activity tags**

- **Implementation:**

- Multi-select from predefined list

- Categories: Coffee, Walks, Sport, Food, Drinks, Creative, Wellness, Professional

- Saved in `users.activity_tags` array

- **Frontend Components:** `ActivityTagPicker`

- **API Endpoint:** `PATCH /api/users/profile`

- **Acceptance Criteria:**

- Min 1, max 5 tags

- Used for match filtering

- Can update anytime

**Story 51: Set neighbourhood**

- **Implementation:**

- Auto-detect from current location

- Allow manual selection from list

- Saved in `users.neighbourhood`

- **Frontend Components:** `NeighbourhoodPicker`

- **API Endpoint:** `PATCH /api/users/profile`

- **Acceptance Criteria:**

- Shows approximate area, not exact address

- Used for feed filtering

- Can update anytime

**Story 52: Manage notifications**

- **Implementation:**

- Settings screen with toggles:

- New requests

- Someone joins your activity

- New messages

- Daily reset reminder

- Meetup reminders

- Saved in `users.notification_settings` JSONB

- **Frontend Components:** `NotificationSettings`

- **API Endpoint:** `PATCH /api/users/settings`

- **Acceptance Criteria:**

- Changes apply immediately

- Respects OS notification permissions

- Reminder before disabling critical notifications


### **3.7 SAFETY (Stories 53-56)**

**Story 53: Block someone**

- **Implementation:**

- Button in profile/chat: "Block user"

- Confirmation modal

- Adds user ID to `users.blocked_user_ids` array

- Immediately hides from all feeds

- Ends any active connections

- Blocked user cannot see your profile or send requests

- **Frontend Components:** `BlockButton`, `BlockConfirmationModal`

- **API Endpoint:** `POST /api/users/block/:id`

- **Acceptance Criteria:**

- Takes effect immediately

- Blocked user not notified

- Can unblock later in settings

- Blocked users never appear in feeds

**Story 54: Report someone**

- **Implementation:**

- Button in profile/chat: "Report user"

- Form: Select reason + optional details

- Reasons: Inappropriate behavior, Fake profile, Harassment, Safety concern, Other

- Creates record in `reports` table

- Triggers admin review

- Optional: Auto-block on report

- **Frontend Components:** `ReportButton`, `ReportForm`

- **API Endpoint:** `POST /api/reports`

- **Request Body:**

- `{``  ``"reported_user_id"``:`` ``"uuid"``,``  ``"reason"``:`` ``"harassment"``,``  ``"details"``:`` ``"Optional description"``}`

- **Acceptance Criteria:**

- Can report even after connection ends

- User receives confirmation

- Report visible to admins within 1 minute

- Reporter identity protected

**Story 55: Limited profile exposure**

- **Implementation:**

- Profiles only visible to:

- Users who are ON

- Users within radius

- Users you've connected with (history)

- No public profiles or profile links

- No real names visible to non-connected users (optional: first name only)

- **Acceptance Criteria:**

- Cannot search users by name

- Cannot access profiles via URL guessing

- Profile disappears when toggle OFF

**Story 56: Precise location hidden**

- **Implementation:**

- Approximate location shown (100-500m radius)

- Never show exact coordinates

- Location services permission required but coordinates fuzzy

- Map shows area, not pin

- **Acceptance Criteria:**

- Distance calculations accurate

- Visual representation shows uncertainty

- Privacy policy explains location handling


### **3.8 ADMIN (Stories 57-60)**

**Story 57: Review reports**

- **Implementation:**

- Admin dashboard shows pending reports

- Shows reporter + reported user profiles

- Shows conversation history (if exists)

- Actions: Dismiss, Warn user, Suspend, Ban

- **Frontend Components:** `AdminReportsList`, `ReportDetailView`

- **API Endpoints:**

- ```
GET /api/admin/reports?status=pending
GET /api/admin/reports/:id
POST /api/admin/reports/:id/action
```
- **Acceptance Criteria:**

- Admin-only access (role-based)

- Shows all context needed for decision

- Actions logged with admin ID and timestamp

- Reporter notified of outcome (generic)

**Story 58: Deactivate users**

- **Implementation:**

- Admin action: Warn, Suspend (7/30 days), Ban (permanent)

- Updates `users.is_deactivated = true`

- Ends all active connections

- Removes from all feeds immediately

- User sees message on next login

- **API Endpoint:** `POST /api/admin/users/:id/deactivate`

- **Request Body:**

- `{``  ``"action"``:`` ``"ban"``,``  ``"reason"``:`` ``"Violation of community guidelines"``,``  ``"duration_days"``:`` ``null``}`

- **Acceptance Criteria:**

- Action takes effect immediately

- User can appeal (contact support)

- Deactivated users cannot create new account with same phone/email

- Audit trail logged

**Story 59: Basic analytics**

- **Implementation:**

- Dashboard showing:

- Daily active users

- Toggle rate (% users ON daily)

- Activities created

- Connections made

- Meetup confirmation rate

- Retention (D1, D7, D30)

- Geographic heat map

- Data from `events` table

- **Frontend Components:** `AdminDashboard`, charts

- **API Endpoint:** `GET /api/admin/analytics?range=7d`

- **Acceptance Criteria:**

- Updates daily

- Exportable as CSV

- No PII exposed

**Story 60: Manage banlist**

- **Implementation:**

- List of banned users with reason

- Can search by name, email, phone

- Can unban (with reason logged)

- Prevents re-registration

- **Frontend Components:** `BanlistView`

- **API Endpoints:**

- ```
GET /api/admin/banlist
POST /api/admin/users/:id/unban
```
- **Acceptance Criteria:**

- Shows ban date, reason, admin

- Prevents re-registration with same credentials

- Audit trail for all changes


### **3.9 EXPERIMENTAL (Stories 61-62)**

**Story 61: Propose future-day meet**

- **Status:** Should-test (not MVP)

- **Implementation:**

- Allow activities to be created for future days (not just today)

- Changes daily reset logic to only reset today's activities

- Requires additional complexity in expiry logic

- **Rationale:** May dilute "today only" urgency; test after MVP proves same-day concept

**Story 62: Auto-close expired activities**

- **Implementation:**

- Already covered in midnight reset

- Activities with `end_time < NOW()` marked as `completed`

- Removed from active feed

- **Acceptance Criteria:**

- Runs hourly (or more frequently)

- Sends notification to participants if ended before meetup


## **4. User Flows**

### **4.1 New User Onboarding**

1. Download app

2. Create account (phone/email + verification code)

3. ID verification (gov ID + selfie)

4. Add photo (in-app camera)

5. Add bio (optional)

6. Select activity tags (min 1)

7. Set neighbourhood (auto-detect or manual)

8. Grant location permission

9. Complete profile → See feed

10. Tutorial: "Toggle ON to be visible and see who's around"

### **4.2 Daily Usage Flow**

1. Open app

2. See prompt: "Toggle ON to get started"

3. Toggle ON → Location updated

4. Browse feed:

- Nearby people

- Nearby activities

- Apply filters (distance, activity type, time, 1:1 vs group)

- Tap user/activity card to view details

- Send request or join activity

- Wait for acceptance/confirmation

- Chat to coordinate

- Confirm meetup details

- Meet IRL

- (Optional) Share contact to continue off-app

- Midnight: Everything resets

### **4.3 1:1 Connection Flow**

1. User A sees User B in nearby list (both ON)

2. User A views User B's profile

3. User A sends request: "Want to grab coffee?"

4. User B receives notification

5. User B views User A's profile

6. User B accepts request → Chat opens

7. Both users coordinate:

- A: "Mayfield Cafe at 3pm?"

- B: "Perfect, see you there!"

- Both users confirm meetup

- App creates calendar event + sends reminders

- They meet IRL

- (Optional) Share contact

- Midnight: Connection archived

### **4.4 Pile-On Activity Flow**

1. User A (host) creates activity:

- "Coffee @ Mayfield, 3-5pm"

- Type: Coffee

- Mode: Pile-on (group)

- Activity appears in feed for nearby users

- User B sees activity, taps to view details

- User B taps "Join activity"

- User A receives notification: "B wants to join"

- User A views B's profile

- User A accepts → B joins group chat

- User C also joins

- Group chat active with A, B, C

- User A confirms details: "Mayfield at 3pm sharp!"

- All receive notification + calendar event

- They meet IRL

- Midnight: Activity archived

### **4.5 Safety Flow (Block & Report)**

1. User A has negative interaction with User B

2. User A opens User B's profile or chat

3. User A taps "Block" or "Report"

4. If block:

- Confirmation modal

- User B immediately hidden

- Connection ended

- If report:

- Select reason

- Add details (optional)

- Submit → Admin review triggered

- Option to also block

- Admin reviews report within 24 hours

- Admin takes action (warn, suspend, ban)

- User A notified of outcome (generic)


## **5. API Specification**

### **5.1 Authentication**

- **Provider:** Supabase Auth

- **Methods:** Phone (SMS), Email (Magic Link)

- **Sessions:** JWT tokens, refresh tokens

- **Permissions:** Role-based (user, admin)

### **5.2 Core Endpoints**

#### **Users**

**GET /api/users/me**

- Returns current user profile

- Response:

- `{``  ``"id"``:`` ``"uuid"``,``  ``"full_name"``:`` ``"Alex Chen"``,``  ``"photo_url"``:`` ``"https://..."``,``  ``"bio"``:`` ``"Coffee enthusiast..."``,``  ``"activity_tags"``:`` ``[``"coffee"``,`` ``"walks"``],``  ``"neighbourhood"``:`` ``"Clapham"``,``  ``"is_on"``:`` ``true,``  ``"is_verified"``:`` ``true,``  ``"notification_settings"``:`` ``{...}}`

**PATCH /api/users/profile**

- Updates user profile

- Body: Partial user object

- Returns: Updated user

**POST /api/users/toggle-on**

- Toggles user ON/OFF

- Body: `{ "is_on": true, "location": {"lat": 51.5, "lng": -0.1} }`

- Returns: Updated user with new status

**POST /api/users/photo**

- Uploads profile photo

- Body: FormData with image file

- Returns: `{ "photo_url": "https://..." }`

**GET /api/users/nearby**

- Returns nearby users who are ON

- Query params:

- `lat` (required)

- `lng` (required)

- `radius` (default: 2000 meters)

- `activity_tags` (optional filter)

- Response:

- `{``  ``"users"``:`` ``[``    ``{``      ``"id"``:`` ``"uuid"``,``      ``"full_name"``:`` ``"Alex Chen"``,``      ``"photo_url"``:`` ``"https://..."``,``      ``"bio"``:`` ``"Coffee enthusiast..."``,``      ``"activity_tags"``:`` ``[``"coffee"``,`` ``"walks"``],``      ``"distance_km"``:`` ``0``.``8``    ``}``  ``],``  ``"total"``:`` ``12``}`

**POST /api/users/block/:id**

- Blocks a user

- Returns: Success message

**GET /api/users/:id/profile**

- Returns public profile of user

- Limited info unless connected

- Returns: User object (filtered)

#### **Activities**

**GET /api/activities/nearby**

- Returns nearby activities

- Query params:

- `lat` (required)

- `lng` (required)

- `radius` (default: 2000 meters)

- `activity_type` (optional filter)

- `time_filter` ('now' | 'later' | 'all')

- `is_one_on_one` (optional filter)

- Response:

- `{``  ``"activities"``:`` ``[``    ``{``      ``"id"``:`` ``"uuid"``,``      ``"title"``:`` ``"Coffee @ Mayfield"``,``      ``"description"``:`` ``"Casual coffee chat"``,``      ``"activity_type"``:`` ``"coffee"``,``      ``"location_name"``:`` ``"Mayfield Cafe"``,``      ``"approximate_location"``:`` ``{...},``      ``"start_time"``:`` ``"2025-11-02T15:00:00Z"``,``      ``"end_time"``:`` ``"2025-11-02T17:00:00Z"``,``      ``"is_one_on_one"``:`` ``false,``      ``"host"``:`` ``{``        ``"id"``:`` ``"uuid"``,``        ``"full_name"``:`` ``"Alex Chen"``,``        ``"photo_url"``:`` ``"https://..."``      ``},``      ``"participant_count"``:`` ``2``,``      ``"max_participants"``:`` ``5``,``      ``"distance_km"``:`` ``1``.``2``    ``}``  ``],``  ``"total"``:`` ``8``}`

**POST /api/activities**

- Creates new activity

- Body:

- `{``  ``"title"``:`` ``"Coffee @ Mayfield"``,``  ``"description"``:`` ``"Casual coffee chat"``,``  ``"activity_type"``:`` ``"coffee"``,``  ``"location_name"``:`` ``"Mayfield Cafe"``,``  ``"approximate_location"``:`` ``{``"lat"``:`` ``51``.``5``,`` ``"lng"``:`` ``-0``.``1``},``  ``"start_time"``:`` ``"2025-11-02T15:00:00Z"``,``  ``"end_time"``:`` ``"2025-11-02T17:00:00Z"``,``  ``"is_one_on_one"``:`` ``false,``  ``"max_participants"``:`` ``5``}`

- Returns: Created activity

**GET /api/activities/:id**

- Returns activity details with participants

- Response: Activity object + participant list

**PATCH /api/activities/:id**

- Updates activity (host only)

- Body: Partial activity object

- Returns: Updated activity

**DELETE /api/activities/:id**

- Deletes activity (host only)

- Returns: Success message

**POST /api/activities/:id/join**

- Join pile-on activity

- Creates connection with `status = 'pending'`

- Returns: Connection object

**POST /api/activities/:id/confirm**

- Host confirms final details

- Updates activity status to `confirmed`

- Sends notifications to all participants

- Returns: Updated activity

**GET /api/activities/:id/participants**

- Returns list of participants

- Response:

- `{``  ``"confirmed"``:`` ``[``    ``{``      ``"id"``:`` ``"uuid"``,``      ``"user"``:`` ``{...},``      ``"joined_at"``:`` ``"2025-11-02T14:30:00Z"``    ``}``  ``],``  ``"pending"``:`` ``[``    ``{``      ``"id"``:`` ``"uuid"``,``      ``"user"``:`` ``{...},``      ``"joined_at"``:`` ``"2025-11-02T14:35:00Z"``    ``}``  ``]}`

**GET /api/activities/:id/chat**

- Returns group chat messages

- Query params:

- `limit` (default: 50)

- `before` (cursor for pagination)

- Response: Array of messages

**POST /api/activities/:id/chat**

- Sends message to group chat

- Body: `{ "content": "Looking forward to this!" }`

- Returns: Created message

#### **Connections**

**POST /api/connections/request**

- Sends 1:1 request

- Body:

- `{``  ``"target_user_id"``:`` ``"uuid"``,``  ``"activity_id"``:`` ``"uuid"``,`` ``//`` ``optional``  ``"message"``:`` ``"Hey! Want to grab coffee?"``}`

- Returns: Connection object

**GET /api/connections**

- Returns user's connections

- Query params:

- `status` ('pending' | 'accepted' | 'confirmed' | 'all')

- Response: Array of connections

**GET /api/connections/today**

- Returns today's confirmed meetups

- Response: Array of confirmed connections

**GET /api/connections/:id**

- Returns connection details

- Response: Connection object with user info

**POST /api/connections/:id/accept**

- Accepts connection request

- Updates status to `accepted`

- Returns: Updated connection

**POST /api/connections/:id/decline**

- Declines connection request

- Updates status to `declined`

- Sends polite auto-message

- Returns: Success message

**POST /api/connections/:id/confirm**

- Confirms meetup details

- Body:

- `{``  ``"meet_location"``:`` ``"Mayfield Cafe"``,``  ``"meet_time"``:`` ``"2025-11-02T15:00:00Z"``}`

- Updates `is_confirmed = true`

- Creates calendar event

- Returns: Updated connection

**POST /api/connections/:id/cancel**

- Cancels meetup

- Body: `{ "reason": "Something came up" }` (optional)

- Updates status to `cancelled`

- Returns: Success message

**POST /api/connections/:id/end**

- Ends connection early

- Updates status to `ended`

- Returns: Success message

**GET /api/connections/:id/messages**

- Returns chat messages

- Query params:

- `limit` (default: 50)

- `before` (cursor for pagination)

- Response: Array of messages

**POST /api/connections/:id/messages**

- Sends message in chat

- Body:

- `{``  ``"content"``:`` ``"Looking forward to meeting!"``,``  ``"type"``:`` ``"text"`` ``//`` ``or`` ``"location"``,`` ``"time"``}`

- Returns: Created message

#### **Notifications**

**GET /api/notifications**

- Returns user's notifications

- Query params:

- `unread_only` (boolean, default: false)

- `limit` (default: 20)

- Response: Array of notifications

**PATCH /api/notifications/:id/read**

- Marks notification as read

- Returns: Success message

**POST /api/notifications/read-all**

- Marks all notifications as read

- Returns: Success message

#### **Reports**

**POST /api/reports**

- Creates report

- Body:

- `{``  ``"reported_user_id"``:`` ``"uuid"``,``  ``"reason"``:`` ``"harassment"``,``  ``"details"``:`` ``"Optional description"``}`

- Returns: Report object

#### **Admin**

**GET /api/admin/reports**

- Returns reports (admin only)

- Query params:

- `status` ('pending' | 'reviewed' | 'all')

- Response: Array of reports

**GET /api/admin/reports/:id**

- Returns report details with full context

- Response: Report + user profiles + conversation history

**POST /api/admin/reports/:id/action**

- Takes action on report

- Body:

- `{``  ``"action"``:`` ``"ban"``,`` ``//`` ``"dismiss"``,`` ``"warn"``,`` ``"suspend"``,`` ``"ban"``  ``"admin_notes"``:`` ``"Reason for action"``,``  ``"duration_days"``:`` ``null`` ``//`` ``for`` ``suspensions}`

- Returns: Success message

**POST /api/admin/users/:id/deactivate**

- Deactivates user

- Body:

- `{``  ``"action"``:`` ``"ban"``,``  ``"reason"``:`` ``"Violation of guidelines"``,``  ``"duration_days"``:`` ``null``}`

- Returns: Success message

**GET /api/admin/analytics**

- Returns analytics dashboard data

- Query params:

- `range` ('7d' | '30d' | '90d' | 'all')

- Response: Analytics object with metrics

**GET /api/admin/banlist**

- Returns banned users

- Response: Array of banned users with ban details

**POST /api/admin/users/:id/unban**

- Unbans user

- Body: `{ "reason": "Appeal approved" }`

- Returns: Success message

### **5.3 Realtime Channels**

**Presence Channel: **`presence:nearby`

- Broadcasts user ON/OFF status

- Subscribe to see real-time updates of nearby users

- Payload:

- `{``  ``"user_id"``:`` ``"uuid"``,``  ``"is_on"``:`` ``true,``  ``"location"``:`` ``{``"lat"``:`` ``51``.``5``,`` ``"lng"``:`` ``-0``.``1``}}`

**Connection Chat: **`connection:{connection_id}:messages`

- Real-time chat messages for 1:1 connections

- Subscribe on chat open

- Payload: Message object

**Activity Chat: **`activity:{activity_id}:chat`

- Real-time group chat for pile-on activities

- Subscribe on activity detail open

- Payload: Message object

**Activity Updates: **`activity:{activity_id}:updates`

- Real-time updates for activity (joins, confirmations, etc.)

- Subscribe on activity detail open

- Payload: Activity update event

**Notifications: **`user:{user_id}:notifications`

- Real-time notifications

- Subscribe on app launch

- Payload: Notification object


## **6. Success Metrics & KPIs**

### **6.1 Activation Metrics**

- **Signup completion rate:** % who complete full profile (target: 70%)

- **ID verification rate:** % who complete ID verification (target: 100%)

- **First toggle rate:** % who toggle ON within 24 hours (target: 60%)

- **First connection attempt:** % who send request within 48 hours (target: 40%)

### **6.2 Engagement Metrics**

- **Daily Active Users (DAU):** Target 35% of registered users

- **Toggle rate:** % users who toggle ON daily (target: 35%)

- **Session frequency:** Average sessions per day (target: 2.5)

- **Session duration:** Average time in app (target: 8 minutes)

- **Feed browsing:** % users who scroll through feed (target: 90%)

### **6.3 Connection Metrics**

- **Request rate:** Requests sent per active user per day (target: 1.5)

- **Acceptance rate:** % of requests accepted (target: 60%)

- **Activity creation rate:** Activities created per 100 active users (target: 20)

- **Pile-on join rate:** % of activities with 2+ participants (target: 40%)

- **Chat initiation rate:** % of accepted connections that start chatting (target: 85%)

### **6.4 Meetup Metrics (PRIMARY)**

- **Confirmation rate:** % of connections that confirm meetup (target: 50%)

- **Completion rate:** % of confirmed meetups that happen (target: 80%)

- **Same-day meetup rate:** % of connections that meet same day (target: 60%)

- **Repeat meetup rate:** % users who meet 2+ times per week (target: 25%)

### **6.5 Retention Metrics**

- **D1 retention:** % who return next day (target: 60%)

- **D7 retention:** % who return after 7 days (target: 40%)

- **D30 retention:** % who return after 30 days (target: 25%)

- **Weekly active users (WAU):** Target 60% of registered users

### **6.6 Safety Metrics**

- **Report rate:** Reports per 1000 users (target: <10)

- **Block rate:** Blocks per 1000 users (target: <20)

- **Verification rate:** % verified users (target: 100%)

- **Response time:** Average admin review time (target: <24 hours)

- **Ban rate:** Bans per 1000 users (target: <5)

### **6.7 Density Metrics (CRITICAL FOR LAUNCH)**

- **Geographic concentration:** % of users in target neighborhood (target: 80%)

- **Concurrent ON users:** Average users ON simultaneously (target: 20-30)

- **Nearby users per session:** Average users visible when ON (target: 8-12)

- **Activity density:** Activities per km² (target: 2-3)


## **7. Technical Considerations**

### **7.1 Performance Requirements**

- **Feed load time:** <2 seconds

- **Real-time message delivery:** <1 second

- **Location update frequency:** Every 5 minutes while ON

- **Offline support:** Cache last feed state, queue messages

- **Image loading:** Lazy load with placeholders

- **Database queries:** All location queries use spatial indexes

### **7.2 Privacy & Security**

- **Authentication:** Supabase Auth with JWT

- **Data encryption:** At rest and in transit (TLS)

- **Location privacy:** Fuzzed coordinates, no exact locations stored

- **RLS policies:** Enforce data access at database level

- **API rate limiting:** Prevent abuse

- **Content moderation:** AI + human review

- **GDPR compliance:** Data export, deletion, consent management

### **7.3 Scalability**

- **Database:** PostgreSQL with connection pooling

- **Storage:** Supabase Storage with CDN

- **Realtime:** Supabase Realtime (WebSockets)

- **Push notifications:** Expo Push Notifications

- **Caching:** Redis for session data (if needed)

- **Background jobs:** Supabase Edge Functions + pg_cron

### **7.4 Monitoring & Logging**

- **Error tracking:** Sentry

- **Analytics:** Mixpanel or Amplitude

- **Performance monitoring:** Supabase metrics

- **User feedback:** In-app feedback form

- **Admin dashboard:** Real-time analytics

### **7.5 Testing Strategy**

- **Unit tests:** Critical business logic

- **Integration tests:** API endpoints

- **E2E tests:** Key user flows (Detox)

- **Manual testing:** Beta user feedback

- **Load testing:** Simulate concurrent users


## **8. Launch Plan**

### **8.1 Beta Phase (Weeks 1-4)**

**Week 1-2: Core Features + Auth**

- Supabase setup with PostGIS

- User authentication and profile creation

- ID verification integration

- ON/OFF toggle with location

- Basic feed (nearby users and activities)

**Week 2-3: Connections + Chat**

- 1:1 request flow

- Pile-on join flow

- Real-time chat (1:1 and group)

- Notifications (push and in-app)

- Meet confirmation flow

**Week 3: Activities**

- Activity creation

- Activity detail view

- Host management (accept/decline joiners)

- Group chat for activities

**Week 4: Safety + Admin + Polish**

- Block and report functionality

- Admin dashboard (basic)

- Midnight reset (cron job)

- Bug fixes and polish

- Beta testing with 20-30 users

### **8.2 Pilot Launch (Weeks 5-8)**

- Launch in Clapham, London (single neighborhood)

- Target: 200-300 users

- Focus on density over breadth

- Local ambassador program (5-10 power users)

- Weekly feedback sessions

- Iterate based on metrics

### **8.3 Success Criteria for Expansion**

- 200+ active users in pilot area

- 35%+ daily toggle rate

- 25%+ meetup confirmation rate

- 60%+ D7 retention

- <1% reported incidents

- NPS >40


## **9. Migration from V0**

### **9.1 Current V0 State**

- Frontend built in Next.js with mock data

- 50+ shadcn/ui components

- Landing page, feed, activities, dashboard, profile screens

- No backend integration

### **9.2 Migration Strategy**

**Phase 1: Backend Setup**

1. Set up Supabase project

2. Create database schema (tables, indexes, functions, RLS)

3. Test PostGIS queries

4. Set up Supabase Auth

5. Set up Supabase Storage for images

**Phase 2: API Development**

1. Create API layer (Next.js API routes or separate backend)

2. Implement core endpoints (users, activities, connections, messages)

3. Add authentication middleware

4. Test with Postman/Insomnia

**Phase 3: Frontend Integration**

1. Replace mock data with API calls

2. Add Supabase client to frontend

3. Implement real-time subscriptions

4. Add authentication flow

5. Add loading states and error handling

**Phase 4: Testing & Deployment**

1. End-to-end testing

2. Beta user testing

3. Deploy backend to Supabase

4. Deploy frontend to Vercel/production

5. Monitor and iterate


## **10. Open Questions & Decisions Needed**

### **10.1 Technical Decisions**

- [ ] Use Next.js API routes or separate backend service?

- [ ] Image compression strategy (client-side or server-side)?

- [ ] Push notification service (Expo, OneSignal, or FCM directly)?

- [ ] ID verification provider (Onfido, Jumio, Stripe Identity)?

- [ ] Content moderation API (OpenAI Moderation, Hive, Perspective)?

### **10.2 Product Decisions**

- [ ] Should users see past connections after midnight reset?

- [ ] Allow users to "save" someone to connect later?

- [ ] Show "last ON" timestamp for users currently OFF?

- [ ] Allow activities to have waitlists if full?

- [ ] Allow users to propose alternative times for activities?

### **10.3 Safety Decisions**

- [ ] Should first meetups have safety check-in requirement?

- [ ] Allow users to share live location with trusted contact?

- [ ] Require photo moderation before profile goes live?

- [ ] Ban users after X reports automatically?

### **10.4 Monetization (Future)**

- [ ] Premium features (e.g., more ON time, extended radius)?

- [ ] Local business partnerships (cafe sponsors)?

- [ ] Event hosting fees for large activities?


## **11. Appendix**

### **11.1 Glossary**

- **ON/OFF:** User availability status (visible vs hidden)

- **Pile-on:** Group activity that multiple users can join

- **1:1:** Private connection between two users

- **Connection:** Link between two users (request → acceptance → chat)

- **Activity:** Event created by host that others can join

- **Toggle:** Switch between ON and OFF status

- **Midnight reset:** Daily clearing of all ON states, chats, and activities

### **11.2 Related Documents**

- User Story List (62 stories)

- Technical Architecture Spec

- Design System Documentation

- 6-Week Sprint Plan

### **11.3 Changelog**

- **v1.0 (Nov 2, 2025):** Initial PRD based on 62 user stories


**Document Owner:** Engineering Team \
 **Last Reviewed:** November 2, 2025 \
 **Next Review:** After Beta Phase (Week 4)
