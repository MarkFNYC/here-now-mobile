# Here Now - Product Backlog

**Version:** 1.0
**Last Updated:** November 3, 2025
**Total Stories:** 62
**MVP Stories:** 60 (excludes 61-62 experimental)

---

## 📊 Backlog Status Overview

| Category | Total | Sprint | Priority |
|----------|-------|--------|----------|
| DISCOVER | 16 | Sprint 1 | P0 - Critical |
| DECIDE | 7 | Sprint 2 | P0 - Critical |
| CONNECT | 14 | Sprints 2-3 | P0 - Critical |
| MEET | 3 | Sprint 3 | P0 - Critical |
| RESET | 5 | Sprint 4 | P1 - High |
| ACCOUNT + PROFILE | 7 | Sprint 0 | P0 - Critical |
| SAFETY | 4 | Sprint 4 | P0 - Critical |
| ADMIN | 4 | Sprint 5 | P1 - High |
| EXPERIMENTAL | 2 | Sprint 6 | P3 - Low |

**Priority Levels:**
- **P0 (Critical)**: Must have for MVP launch
- **P1 (High)**: Important for launch, minor scope reduction possible
- **P2 (Medium)**: Nice to have, can defer to post-launch
- **P3 (Low)**: Experimental, validate concept first

---

## Sprint 0: Foundation & Authentication (P0)

### Story 46: Create account via phone/email
**Priority:** P0
**Effort:** 5 points
**Dependencies:** None
**Acceptance Criteria:**
- [ ] User can sign up with phone number (SMS verification)
- [ ] User can sign up with email (magic link)
- [ ] Validation for phone numbers and emails
- [ ] Auto-login after verification
- [ ] Graceful error handling

### Story 47: Verify account
**Priority:** P0
**Effort:** 8 points
**Dependencies:** Story 46
**Acceptance Criteria:**
- [ ] ID verification via third-party (Onfido/Jumio)
- [ ] Government ID + selfie verification
- [ ] Updates `is_verified = true` on success
- [ ] Unverified users have limited access
- [ ] Verification completes in <5 minutes

### Story 48: Add photo
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 46
**Acceptance Criteria:**
- [ ] In-app camera capture (preferred) or gallery upload
- [ ] AI moderation for inappropriate content
- [ ] Face detection check (clear face visible)
- [ ] Stored in Supabase Storage
- [ ] Can retake/replace anytime

### Story 49: Add bio
**Priority:** P1
**Effort:** 2 points
**Dependencies:** Story 46
**Acceptance Criteria:**
- [ ] Text input, max 150 characters
- [ ] AI moderation for inappropriate content
- [ ] Character counter visible
- [ ] No URLs or contact info allowed
- [ ] Optional but encouraged

### Story 50: Add activity tags
**Priority:** P0
**Effort:** 3 points
**Dependencies:** Story 46
**Acceptance Criteria:**
- [ ] Multi-select from predefined list (Coffee, Walks, Sport, Food, Drinks, Creative, Wellness, Professional)
- [ ] Min 1, max 5 tags
- [ ] Used for match filtering
- [ ] Can update anytime

### Story 51: Set neighbourhood
**Priority:** P0
**Effort:** 3 points
**Dependencies:** Story 46
**Acceptance Criteria:**
- [ ] Auto-detect from current location
- [ ] Allow manual selection from list
- [ ] Shows approximate area, not exact address
- [ ] Used for feed filtering

### Story 52: Manage notifications
**Priority:** P1
**Effort:** 3 points
**Dependencies:** Story 46
**Acceptance Criteria:**
- [ ] Settings screen with toggles (requests, joins, messages, reset, meetups)
- [ ] Changes apply immediately
- [ ] Respects OS notification permissions
- [ ] Warning before disabling critical notifications

---

## Sprint 1: Core Discovery (P0)

### Story 7: Toggle "I'M ON" to show availability
**Priority:** P0
**Effort:** 8 points
**Dependencies:** Story 46, 51
**Acceptance Criteria:**
- [ ] Large toggle button in header (primary action)
- [ ] Updates `is_on` and `last_toggled_on` in database
- [ ] Broadcasts presence change via Realtime
- [ ] Requests location permission if not granted
- [ ] Updates location in PostGIS format
- [ ] Confirmation message ("You're ON!")

### Story 1: See people nearby who are available today
**Priority:** P0
**Effort:** 8 points
**Dependencies:** Story 7
**Acceptance Criteria:**
- [ ] Uses `get_nearby_users()` function
- [ ] Displays users in card grid sorted by distance
- [ ] Shows: photo, name, bio snippet, distance, activity tags
- [ ] Users only appear if `is_on = true`
- [ ] Blocked users never appear
- [ ] Updates in real-time via Supabase Realtime

### Story 6: See who is currently ON
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 1, 7
**Acceptance Criteria:**
- [ ] Query `users WHERE is_on = true`
- [ ] Green indicator dot on profile photos
- [ ] Indicator appears within 2 seconds of toggle
- [ ] Works offline (shows last known state)

### Story 3: See distance/time to person or activity
**Priority:** P0
**Effort:** 3 points
**Dependencies:** Story 1
**Acceptance Criteria:**
- [ ] Calculate using PostGIS `ST_Distance()`
- [ ] Show walking time estimate (4km/hour = 15min/km)
- [ ] Display logic: 0-100m ("Nearby"), 100-500m ("X meters"), 500m-2km ("X.X km"), 2km+ ("X km")
- [ ] Distance updates if user moves >100m
- [ ] Walking time rounds to nearest 5 minutes

### Story 8: ON/OFF state resets daily
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 7
**Acceptance Criteria:**
- [ ] `midnight_reset()` function runs at 00:00 daily
- [ ] Sets all `is_on = false`
- [ ] Works across all timezones
- [ ] Push notification sent ("Your availability has been reset for today")

### Story 13: View all options (no filters)
**Priority:** P0
**Effort:** 2 points
**Dependencies:** Story 1
**Acceptance Criteria:**
- [ ] Default view shows all nearby users and activities
- [ ] "All" button selected by default
- [ ] No filters applied initially

### Story 14: Message when no one nearby
**Priority:** P1
**Effort:** 2 points
**Dependencies:** Story 1
**Acceptance Criteria:**
- [ ] Empty state message: "No one nearby right now"
- [ ] Suggestions: "Try widening your radius or come back later"
- [ ] Shows illustration or animation

### Story 15: Suggestions to turn ON
**Priority:** P1
**Effort:** 2 points
**Dependencies:** Story 7
**Acceptance Criteria:**
- [ ] If user is OFF, show prompt: "Toggle ON to see who's around"
- [ ] Prominent CTA button
- [ ] Dismissible but reappears on next session

### Story 16: Suggestions to widen filters
**Priority:** P2
**Effort:** 2 points
**Dependencies:** Story 9
**Acceptance Criteria:**
- [ ] If filtered results empty, suggest "Widen your distance" or "Show all activity types"
- [ ] One-tap to reset filters

---

## Sprint 2: 1:1 Connections (P0)

### Story 17: View lightweight profile
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 1
**Acceptance Criteria:**
- [ ] Tap user card opens detailed profile
- [ ] Shows: large photo, full bio, activity tags, approximate location, mutual spots
- [ ] "Send request" button prominent
- [ ] Back navigation

### Story 24: Send 1:1 request
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 17
**Acceptance Criteria:**
- [ ] Button: "Send request" on user profile
- [ ] Optional message (max 200 chars)
- [ ] Creates connection with `status = 'pending'`
- [ ] Sends notification to target user
- [ ] Cannot send if already have pending/active connection
- [ ] Shows confirmation: "Request sent!"

### Story 30: Receive notifications for requests
**Priority:** P0
**Effort:** 3 points
**Dependencies:** Story 24
**Acceptance Criteria:**
- [ ] Push notification on new request: "X wants to meet today"
- [ ] Badge on "Requests" tab
- [ ] In-app notification banner
- [ ] Deep links to request
- [ ] Respects notification settings

### Story 25: Accept/decline requests
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 24
**Acceptance Criteria:**
- [ ] Request appears in "Requests" tab
- [ ] Shows requester profile, message, activity suggestion
- [ ] Buttons: "Accept" (✓), "Not today" (✗)
- [ ] Accept → `status = 'accepted'`, opens DM
- [ ] Decline → `status = 'declined'`, sends polite auto-message
- [ ] Both remove from pending list

### Story 26: Message after acceptance
**Priority:** P0
**Effort:** 8 points
**Dependencies:** Story 25
**Acceptance Criteria:**
- [ ] Chat opens automatically on accept
- [ ] Real-time messaging via Supabase Realtime
- [ ] System message: "Say hi! Coordinate where and when to meet."
- [ ] Messages appear within 1 second
- [ ] Shows typing indicator
- [ ] Text only (no images in MVP)

### Story 27: Propose meet location
**Priority:** P0
**Effort:** 8 points
**Dependencies:** Story 26
**Acceptance Criteria:**
- [ ] Button in chat: "Suggest location"
- [ ] Search nearby places (Google Places API)
- [ ] Sends special message with location data
- [ ] Renders as interactive card in chat
- [ ] Shows map preview
- [ ] Tappable to open in maps app
- [ ] Other user can accept/propose alternative

### Story 28: Propose meet time
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 26
**Acceptance Criteria:**
- [ ] Button in chat: "Suggest time"
- [ ] Time picker (quick options: 30min, 1hr, 2hr, custom)
- [ ] Sends special message with time data
- [ ] Shows relative time ("In 45 minutes")
- [ ] Other user can accept/propose alternative
- [ ] Creates calendar event on confirm

### Story 29: Adjust place/time
**Priority:** P0
**Effort:** 3 points
**Dependencies:** Story 27, 28
**Acceptance Criteria:**
- [ ] Either user can propose new place/time
- [ ] Shows history of proposals in chat
- [ ] "Confirm" button appears when both agree
- [ ] Clear visual of proposal vs confirmed

### Story 36: Confirm the meet
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 29
**Acceptance Criteria:**
- [ ] Both users must confirm to lock details
- [ ] Button: "Confirm meetup"
- [ ] Updates connection: `is_confirmed = true`, `meet_time`, `meet_location`
- [ ] Sends notification to other user
- [ ] Adds to "Today's Plans" section
- [ ] Creates calendar event
- [ ] Sends reminder notification 15 min before

### Story 37: Cancel the meet
**Priority:** P0
**Effort:** 3 points
**Dependencies:** Story 36
**Acceptance Criteria:**
- [ ] Button: "Cancel meetup" (requires confirmation)
- [ ] Updates connection: `status = 'cancelled'`
- [ ] Asks for brief reason (optional)
- [ ] Sends polite message to other user
- [ ] Removes from "Today's Plans"
- [ ] Allows rescheduling

### Story 18: View activity details
**Priority:** P1
**Effort:** 3 points
**Dependencies:** Story 2
**Acceptance Criteria:**
- [ ] Tap activity card opens detailed view
- [ ] Shows: title, description, host, location, time, participant list
- [ ] "Join" button prominent

### Story 19: "Today only" indicator
**Priority:** P2
**Effort:** 1 point
**Dependencies:** Story 18
**Acceptance Criteria:**
- [ ] Badge: "Today only" on all activities
- [ ] Reinforces urgency

### Story 20: Time window display
**Priority:** P1
**Effort:** 2 points
**Dependencies:** Story 18
**Acceptance Criteria:**
- [ ] Shows start and end time clearly
- [ ] Relative time ("Starting in 2 hours")
- [ ] Countdown if within 30 minutes

### Story 21: Activity tags display
**Priority:** P1
**Effort:** 1 point
**Dependencies:** Story 18
**Acceptance Criteria:**
- [ ] Shows activity type tag (Coffee, Walk, etc.)
- [ ] Icon + text format

### Story 22: 1:1 vs pile-on indicator
**Priority:** P1
**Effort:** 1 point
**Dependencies:** Story 18
**Acceptance Criteria:**
- [ ] Badge: "1:1 only" or "Group"
- [ ] Clear visual distinction

### Story 23: Participant count
**Priority:** P1
**Effort:** 2 points
**Dependencies:** Story 18
**Acceptance Criteria:**
- [ ] Shows "X going" or "Be the first to join"
- [ ] Updates in real-time
- [ ] Shows max capacity if set (e.g., "3/5 spots")

---

## Sprint 3: Activities & Groups (P0)

### Story 2: See activities happening nearby
**Priority:** P0
**Effort:** 8 points
**Dependencies:** Story 1
**Acceptance Criteria:**
- [ ] Uses `get_nearby_activities()` function
- [ ] Displays activities in card list sorted by start time then distance
- [ ] Shows: title, type, location, time, host, participant count, distance
- [ ] Only show `status = 'active'` and `start_time > NOW()`
- [ ] "Starting soon" badge if within 30 minutes

### Story 4: See approximate location of activity
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 2
**Acceptance Criteria:**
- [ ] Store `approximate_location` within 100m of actual location
- [ ] Display on map with 100m radius circle (not precise pin)
- [ ] Show neighborhood name text
- [ ] Never show exact coordinates

### Story 5: See group size on activity
**Priority:** P0
**Effort:** 3 points
**Dependencies:** Story 2
**Acceptance Criteria:**
- [ ] Count accepted connections
- [ ] Display "X going" or "1:1 only"
- [ ] Count updates in real-time
- [ ] Shows max capacity if set

### Story 31: Join existing activity (pile-on)
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 2
**Acceptance Criteria:**
- [ ] Button: "Join activity" on activity detail
- [ ] Creates connection with `type = 'pile_on'`, `status = 'pending'`
- [ ] Host receives notification
- [ ] Cannot join if at capacity
- [ ] Cannot join own activity
- [ ] Shows "Waiting for host confirmation"

### Story 32: Host notified when someone joins
**Priority:** P0
**Effort:** 3 points
**Dependencies:** Story 31
**Acceptance Criteria:**
- [ ] Push notification: "X wants to join your activity"
- [ ] Badge on activity card
- [ ] Host sees joiner profile
- [ ] Deep links to activity management

### Story 33: Host sees who joined
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 31
**Acceptance Criteria:**
- [ ] Activity detail shows "Going" (confirmed) and "Waiting" (pending) lists
- [ ] Host can tap to view profile and accept/decline
- [ ] Updates in real-time
- [ ] Shows accept/decline buttons for host only

### Story 34: Participant messages host
**Priority:** P0
**Effort:** 8 points
**Dependencies:** Story 33
**Acceptance Criteria:**
- [ ] Accepted participants join group chat
- [ ] All participants see all messages
- [ ] Host can send broadcast messages
- [ ] Messages visible to all confirmed participants
- [ ] System messages for joins/leaves

### Story 35: Host confirms group meet details
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 34
**Acceptance Criteria:**
- [ ] Host sends final confirmation message with location & time
- [ ] All participants receive notification
- [ ] Activity status → `confirmed`
- [ ] Adds to calendar for all participants
- [ ] Shows "Confirmed" badge

### Story 38: View confirmed details
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 36
**Acceptance Criteria:**
- [ ] "Today's Plans" tab shows all confirmed meetups
- [ ] Card shows: person's photo, location, time, directions button
- [ ] Countdown timer to meetup
- [ ] Always accessible from main nav
- [ ] Quick access to chat and map

### Story 39: Edit meeting time
**Priority:** P1
**Effort:** 3 points
**Dependencies:** Story 38
**Acceptance Criteria:**
- [ ] Button in chat: "Change time"
- [ ] Requires mutual agreement
- [ ] Both users must agree to change
- [ ] Updates calendar event

### Story 40: Suggested public locations
**Priority:** P1
**Effort:** 8 points
**Dependencies:** Story 27
**Acceptance Criteria:**
- [ ] Location picker shows nearby public spaces
- [ ] Filters: Cafes, Parks, Restaurants, Bars
- [ ] Powered by Google Places API
- [ ] Shows ratings and photos
- [ ] Opening hours visible
- [ ] Safety indicators (e.g., "Busy area")

---

## Sprint 4: Filters, Safety & Reset (P0-P1)

### Story 9: Filter by distance
**Priority:** P1
**Effort:** 3 points
**Dependencies:** Story 1
**Acceptance Criteria:**
- [ ] Slider: 1km, 2km, 5km, 10km options
- [ ] Updates feed instantly
- [ ] Shows count of results
- [ ] Persists selection across sessions

### Story 10: Filter by activity type
**Priority:** P1
**Effort:** 3 points
**Dependencies:** Story 1
**Acceptance Criteria:**
- [ ] Multi-select chips (Coffee, Walk, Sport, etc.)
- [ ] Updates feed instantly
- [ ] Can select multiple types
- [ ] "Clear filters" button

### Story 11: Filter by time
**Priority:** P2
**Effort:** 3 points
**Dependencies:** Story 2
**Acceptance Criteria:**
- [ ] Options: "Now", "Within 1 hour", "This morning", "This afternoon", "This evening"
- [ ] Filters activities by start time
- [ ] Updates feed instantly

### Story 12: Filter by 1:1 vs group
**Priority:** P1
**Effort:** 2 points
**Dependencies:** Story 1
**Acceptance Criteria:**
- [ ] Toggle: "1:1 only" vs "Groups" vs "All"
- [ ] Filters both users and activities
- [ ] Updates feed instantly

### Story 41: Chats clear at midnight
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 26
**Acceptance Criteria:**
- [ ] `midnight_reset()` function archives messages
- [ ] Messages table: add `archived_at` column
- [ ] Archived messages hidden from UI
- [ ] Messages recoverable by admins for safety
- [ ] Users see fresh inbox daily

### Story 42: Activities/intent clear at midnight
**Priority:** P0
**Effort:** 3 points
**Dependencies:** Story 2
**Acceptance Criteria:**
- [ ] `midnight_reset()` marks activities as `completed` or `expired`
- [ ] Removes from active feed
- [ ] Archives for analytics
- [ ] Past activities not searchable by users

### Story 43: ON state resets at midnight
**Priority:** P0
**Effort:** 1 point
**Dependencies:** Story 8
**Acceptance Criteria:**
- [ ] Already covered in Story 8
- [ ] Resets at midnight in user's timezone
- [ ] Push notification sent (if enabled)

### Story 44: Manually clear connection early
**Priority:** P1
**Effort:** 3 points
**Dependencies:** Story 26
**Acceptance Criteria:**
- [ ] Button in chat: "End conversation"
- [ ] Confirmation modal
- [ ] Updates connection: `status = 'ended'`
- [ ] Removes from active list
- [ ] Other user sees polite message
- [ ] Can still report if needed

### Story 45: Exchange contact off-app
**Priority:** P2
**Effort:** 3 points
**Dependencies:** Story 26
**Acceptance Criteria:**
- [ ] Button in chat: "Share contact"
- [ ] Opens modal to share phone/email/Instagram
- [ ] Optional, user-initiated only
- [ ] App does not store shared contact info
- [ ] Shows disclaimer about safety

### Story 53: Block someone
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 17
**Acceptance Criteria:**
- [ ] Button in profile/chat: "Block user"
- [ ] Confirmation modal
- [ ] Adds user ID to `blocked_user_ids` array
- [ ] Immediately hides from all feeds
- [ ] Ends any active connections
- [ ] Blocked user cannot see profile or send requests
- [ ] Can unblock later in settings

### Story 54: Report someone
**Priority:** P0
**Effort:** 5 points
**Dependencies:** Story 17
**Acceptance Criteria:**
- [ ] Button in profile/chat: "Report user"
- [ ] Form: Select reason + optional details
- [ ] Reasons: Inappropriate behavior, Fake profile, Harassment, Safety concern, Other
- [ ] Creates record in `reports` table
- [ ] Triggers admin review
- [ ] Optional: Auto-block on report
- [ ] Can report even after connection ends
- [ ] Reporter identity protected

### Story 55: Limited profile exposure
**Priority:** P0
**Effort:** 3 points
**Dependencies:** Story 1
**Acceptance Criteria:**
- [ ] Profiles only visible to users who are ON, within radius, or connected
- [ ] No public profiles or profile links
- [ ] Cannot search users by name
- [ ] Cannot access profiles via URL guessing
- [ ] Profile disappears when toggle OFF

### Story 56: Precise location hidden
**Priority:** P0
**Effort:** 3 points
**Dependencies:** Story 1
**Acceptance Criteria:**
- [ ] Approximate location shown (100-500m radius)
- [ ] Never show exact coordinates
- [ ] Distance calculations accurate
- [ ] Visual representation shows uncertainty
- [ ] Privacy policy explains location handling

---

## Sprint 5: Admin & Launch Prep (P1)

### Story 57: Review reports
**Priority:** P1
**Effort:** 8 points
**Dependencies:** Story 54
**Acceptance Criteria:**
- [ ] Admin dashboard shows pending reports
- [ ] Shows reporter + reported user profiles
- [ ] Shows conversation history (if exists)
- [ ] Actions: Dismiss, Warn user, Suspend, Ban
- [ ] Admin-only access (role-based)
- [ ] Actions logged with admin ID and timestamp
- [ ] Reporter notified of outcome (generic)

### Story 58: Deactivate users
**Priority:** P1
**Effort:** 5 points
**Dependencies:** Story 57
**Acceptance Criteria:**
- [ ] Admin action: Warn, Suspend (7/30 days), Ban (permanent)
- [ ] Updates `is_deactivated = true`
- [ ] Ends all active connections
- [ ] Removes from all feeds immediately
- [ ] User sees message on next login
- [ ] Action takes effect immediately
- [ ] Deactivated users cannot create new account with same phone/email
- [ ] Audit trail logged

### Story 59: Basic analytics
**Priority:** P1
**Effort:** 8 points
**Dependencies:** None
**Acceptance Criteria:**
- [ ] Dashboard showing: DAU, toggle rate, activities created, connections made, meetup confirmation rate, retention (D1, D7, D30), geographic heat map
- [ ] Data from `events` table
- [ ] Updates daily
- [ ] Exportable as CSV
- [ ] No PII exposed

### Story 60: Manage banlist
**Priority:** P1
**Effort:** 5 points
**Dependencies:** Story 58
**Acceptance Criteria:**
- [ ] List of banned users with reason
- [ ] Can search by name, email, phone
- [ ] Can unban (with reason logged)
- [ ] Prevents re-registration
- [ ] Shows ban date, reason, admin
- [ ] Audit trail for all changes

---

## Sprint 6: Polish & Experimental (P2-P3)

### Story 61: Propose future-day meet
**Priority:** P3 (Experimental)
**Effort:** 13 points
**Dependencies:** Story 36
**Status:** Should-test (not MVP)
**Acceptance Criteria:**
- [ ] Allow activities to be created for future days (not just today)
- [ ] Changes daily reset logic to only reset today's activities
- [ ] Test with beta users first
- [ ] **Rationale:** May dilute "today only" urgency; validate concept first

### Story 62: Auto-close expired activities
**Priority:** P1
**Effort:** 3 points
**Dependencies:** Story 42
**Acceptance Criteria:**
- [ ] Activities with `end_time < NOW()` marked as `completed`
- [ ] Removed from active feed
- [ ] Runs hourly (or more frequently)
- [ ] Sends notification to participants if ended before meetup

---

## 📋 Backlog Management Guidelines

### Adding New Stories
1. Write user story in format: "As a [user], I want to [action], so that [benefit]"
2. Define acceptance criteria (measurable, testable)
3. Assign priority (P0-P3)
4. Estimate effort (Fibonacci: 1, 2, 3, 5, 8, 13)
5. Identify dependencies
6. Assign to sprint

### Story Point Reference
- **1 point**: Trivial (e.g., change button text)
- **2 points**: Small (e.g., add simple UI element)
- **3 points**: Medium (e.g., new screen with basic logic)
- **5 points**: Large (e.g., feature with API integration)
- **8 points**: Very large (e.g., complex feature with multiple components)
- **13 points**: Extra large (e.g., major system redesign)

### Definition of Ready
Before a story enters a sprint:
- [ ] User story written and understood
- [ ] Acceptance criteria defined
- [ ] Dependencies identified
- [ ] Design mockups available (if UI-heavy)
- [ ] Effort estimated by team
- [ ] Priority assigned

### Definition of Done
Before a story is marked complete:
- [ ] Code written and reviewed
- [ ] Acceptance criteria met
- [ ] Tests passing
- [ ] Deployed to staging
- [ ] Tested on iOS and Android
- [ ] Documentation updated
- [ ] Stakeholder approved

---

## 🎯 Next Actions

1. **Sprint 0 Planning:** Break down Sprint 0 stories into technical tasks
2. **Team Assignment:** Assign stories to developers
3. **Design Review:** Ensure all Sprint 0-2 screens are designed
4. **Technical Spike:** Research ID verification providers (Onfido vs Jumio)
5. **Kickoff Meeting:** Sprint 0 kickoff on Monday

---

**For JSON format of this backlog, see `backlog.json`**
