-- ============================================================================
-- Highlander Events — Database Schema
-- Run: node src/db/migrate.js
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL CHECK (email LIKE '%@ucr.edu'),
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  push_token TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Login Codes (short-lived, for @ucr.edu email verification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_codes_email ON login_codes(email);

-- ============================================================================
-- Clubs
-- ============================================================================
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  category VARCHAR(50) NOT NULL,
  instagram VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clubs_category ON clubs(category);

-- ============================================================================
-- Club Members (admin = officer, member = regular)
-- ============================================================================
CREATE TABLE IF NOT EXISTS club_members (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, club_id)
);

-- ============================================================================
-- Events
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  location VARCHAR(255),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  max_attendees INTEGER,
  views INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- ============================================================================
-- RSVPs
-- ============================================================================
CREATE TABLE IF NOT EXISTS rsvps (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);

-- ============================================================================
-- Follows (user follows club)
-- ============================================================================
CREATE TABLE IF NOT EXISTS follows (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, club_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_user_id ON follows(user_id);

-- ============================================================================
-- Friendships
-- ============================================================================
CREATE TABLE IF NOT EXISTS friendships (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, friend_id)
);

-- ============================================================================
-- Event Photos (V1.1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);

-- ============================================================================
-- V2: Club Chat Messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS club_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_messages_club ON club_messages(club_id, created_at DESC);

-- ============================================================================
-- V2: Event Tickets
-- ============================================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_type VARCHAR(20) DEFAULT 'free';
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_quantity INTEGER;

CREATE TABLE IF NOT EXISTS user_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticket_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_user_tickets_user ON user_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tickets_event ON user_tickets(event_id);

-- ============================================================================
-- V2: Attendance Points / Rewards
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  reason VARCHAR(50) NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);
