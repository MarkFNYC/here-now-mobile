# Here Now - Database Schema Quick Reference

Visual reference for all tables, relationships, and key fields.

## 📊 Entity Relationship Diagram (Text Format)

```
┌─────────────┐
│    USERS    │
└──────┬──────┘
       │
       │ 1:N
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌─────────────┐        ┌─────────────┐
│ ACTIVITIES  │        │   REPORTS   │
└──────┬──────┘        └─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│ CONNECTIONS │◄───────┐
└──────┬──────┘        │ (requester/target both reference users)
       │               │
       │ 1:N           │
       ▼               │
┌─────────────┐        │
│  MESSAGES   │        │
└─────────────┘        │
                       │
┌─────────────┐        │
│NOTIFICATIONS│◄───────┘
└─────────────┘

┌─────────────┐
│   EVENTS    │ (analytics)
└─────────────┘
```

## 📋 Table Summaries

### **users**
User profiles and availability status

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key, linked to Supabase Auth |
| `phone_or_email` | TEXT | Unique, for authentication |
| `is_verified` | BOOLEAN | ID verification status |
| `full_name` | TEXT | Display name |
| `photo_url` | TEXT | Profile picture URL |
| `bio` | TEXT | User bio (max ~500 chars) |
| `activity_tags` | TEXT[] | Array of interests |
| `neighbourhood` | TEXT | Display area name |
| `location` | GEOGRAPHY | PostGIS point (lat/lng) |
| `is_on` | BOOLEAN | **Currently available** |
| `last_toggled_on` | TIMESTAMP | Last time user went ON |
| `notification_settings` | JSONB | Push notification prefs |
| `blocked_user_ids` | UUID[] | Array of blocked users |
| `is_deactivated` | BOOLEAN | Account status |

**Key Behaviors:**
- Reset `is_on = false` at midnight (cron job)
- Location hidden unless user is ON
- Blocked users can't see or interact

---

### **activities**
Spontaneous meetup activities

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `host_id` | UUID | FK → users.id |
| `title` | TEXT | Activity name |
| `description` | TEXT | Details |
| `activity_type` | TEXT | coffee, walk, lunch, etc. |
| `location_name` | TEXT | "Mayfield Cafe" |
| `approximate_location` | GEOGRAPHY | PostGIS point |
| `start_time` | TIMESTAMP | When activity starts |
| `end_time` | TIMESTAMP | When activity ends |
| `is_one_on_one` | BOOLEAN | true = 1:1, false = pile-on |
| `max_participants` | INTEGER | NULL = unlimited |
| `status` | TEXT | active, confirmed, cancelled, completed |
| `expires_at` | TIMESTAMP | Auto-expires after 24h |

**Key Behaviors:**
- `is_one_on_one = true`: Only 1 person can join
- `is_one_on_one = false`: Multiple people can join (pile-on)
- Auto-expires after 24 hours
- Location shown as approximate (fuzzy within ~200m)

---

### **connections**
Join requests and acceptances

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `activity_id` | UUID | FK → activities.id |
| `requester_id` | UUID | FK → users.id (person joining) |
| `target_id` | UUID | FK → users.id (host) |
| `connection_type` | TEXT | '1:1' or 'pile_on' |
| `status` | TEXT | pending, accepted, declined, cancelled |
| `meet_location` | TEXT | Exact meetup spot |
| `meet_time` | TIMESTAMP | Confirmed time |
| `is_confirmed` | BOOLEAN | Both users confirmed |

**Key Behaviors:**
- `1:1` connections: requester → target (one-on-one)
- `pile_on` connections: multiple requesters → host
- Status flow: pending → accepted → (optional) is_confirmed = true
- Unique constraint prevents duplicate requests

---

### **messages**
Real-time chat within connections

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `connection_id` | UUID | FK → connections.id |
| `sender_id` | UUID | FK → users.id |
| `content` | TEXT | Message text |
| `is_system_message` | BOOLEAN | Automated messages |
| `read_at` | TIMESTAMP | When recipient read it |

**Key Behaviors:**
- Messages only exist within a connection
- Not direct user-to-user (always tied to an activity)
- System messages for status updates ("Alice joined!")

---

### **reports**
Safety and moderation

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `reporter_id` | UUID | FK → users.id |
| `reported_user_id` | UUID | FK → users.id |
| `reason` | TEXT | Report category |
| `details` | TEXT | Additional context |
| `status` | TEXT | pending, reviewed, actioned |
| `admin_notes` | TEXT | Internal notes |
| `reviewed_by` | UUID | FK → users.id (admin) |

**Key Behaviors:**
- Users can report inappropriate behavior
- Admin workflow for review
- Links to both users for context

---

### **notifications**
Push notification records

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users.id |
| `type` | TEXT | request, join, message, confirmation |
| `title` | TEXT | Notification title |
| `body` | TEXT | Notification body |
| `data` | JSONB | {connection_id, activity_id, etc.} |
| `is_read` | BOOLEAN | Read status |

**Key Behaviors:**
- Stored for 7 days (cleaned by cron)
- JSONB `data` field for flexible routing
- Triggers push notifications via Expo/FCM

---

### **events**
Analytics and tracking

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users.id (NULL allowed) |
| `event_type` | TEXT | toggle_on, activity_created, etc. |
| `metadata` | JSONB | Event-specific data |

**Key Behaviors:**
- Tracks user actions for analytics
- Kept for 30 days (configurable)
- Used for dashboards and insights

---

## 🔑 Key Relationships

### 1:1 Connection Flow
```
User A (requester) → [request] → User B (target)
User B → [accept] → Connection created
Both users → Can now message
```

### Pile-On Connection Flow
```
Host creates Activity (is_one_on_one = false)
User 1 → [join request] → Host accepts → Connection 1
User 2 → [join request] → Host accepts → Connection 2
User 3 → [join request] → Host accepts → Connection 3
All users can see group chat
```

## 🗺️ Geolocation Fields

All location data uses **PostGIS GEOGRAPHY(POINT, 4326)**:
- 4326 = WGS84 coordinate system (standard GPS)
- Format: `POINT(longitude latitude)`
- Example: `POINT(-0.1377 51.4618)` = Clapham Common

**Important:** Longitude first, then latitude! (Not the other way around)

### Distance Calculations
```sql
-- Distance in kilometers
ST_Distance(
  location1::geography,
  location2::geography
) / 1000

-- Check if within radius (in meters)
ST_DWithin(
  location1::geography,
  location2::geography,
  5000 -- 5km = 5000 meters
)
```

## 🔒 RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| **users** | Self + active users | Self only | Self only | ❌ |
| **activities** | Active only | Self as host | Host only | Host only |
| **connections** | Participants | Requester | Participant | ❌ |
| **messages** | Participants | Participants | Participants | ❌ |
| **reports** | Self (reporter) | Anyone | ❌ | ❌ |
| **notifications** | Self | System | Self | ❌ |
| **events** | Self | System | ❌ | ❌ |

**Legend:**
- ✅ = Allowed with RLS policy
- ❌ = Not allowed / No policy
- Self = User can only access their own data
- Participants = Users involved in connection
- System = Via service key or function

## 📊 Common Status Flows

### Activity Status
```
created → 'active'
         ↓
    (user requests to join)
         ↓
    'confirmed' (when host accepts)
         ↓
    (after end_time)
         ↓
    'completed'

OR: 'active' → 'cancelled' (by host)
```

### Connection Status
```
created → 'pending'
         ↓
    (target accepts)
         ↓
    'accepted'
         ↓
    (both confirm meetup)
         ↓
    is_confirmed = true

OR: 'pending' → 'declined' (by target)
OR: 'pending' → 'cancelled' (by requester)
```

## 🔍 Index Strategy

### Spatial Indexes (GIST)
- `users.location` - For nearby user queries
- `activities.approximate_location` - For nearby activity queries

### Partial Indexes (Filtered)
- `users(is_on) WHERE is_on = true` - Only index active users
- `activities(status) WHERE status = 'active'` - Only index active activities

### Composite Indexes
- `connections(requester_id, status)` - User's outgoing requests
- `connections(target_id, status)` - User's incoming requests
- `messages(connection_id, created_at)` - Chronological messages

## 🚀 Performance Tips

1. **Always filter by location first** when querying users/activities
2. **Use the provided functions** (`get_nearby_users`, `get_nearby_activities`)
3. **Limit results** - Use LIMIT for feed queries
4. **Index your queries** - Check EXPLAIN ANALYZE if slow
5. **Cache aggressively** - User locations don't change often

## 📱 Mobile App Query Examples

### Get users nearby who are ON
```javascript
const { data } = await supabase.rpc('get_nearby_users', {
  user_lat: currentLocation.latitude,
  user_lng: currentLocation.longitude,
  radius_km: 5
});
```

### Create an activity
```javascript
const { data } = await supabase
  .from('activities')
  .insert({
    host_id: userId,
    title: 'Coffee at Federation',
    activity_type: 'coffee',
    location_name: 'Federation Coffee',
    approximate_location: `POINT(${lng} ${lat})`,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    is_one_on_one: true
  })
  .select()
  .single();
```

### Request to join activity
```javascript
const { data } = await supabase
  .from('connections')
  .insert({
    activity_id: activityId,
    requester_id: userId,
    target_id: hostId,
    connection_type: isOneOnOne ? '1:1' : 'pile_on'
  })
  .select()
  .single();
```

### Subscribe to real-time messages
```javascript
supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `connection_id=eq.${connectionId}`
    },
    (payload) => {
      // Handle new message
    }
  )
  .subscribe();
```

---

**Quick Reference Version:** 1.0
**Last Updated:** November 2, 2025
