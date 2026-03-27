-- ============================================================================
-- V3 Migration: UCR CAS Authentication + Club Staff Roles
-- Run: psql $DATABASE_URL < src/db/migrate-v3-cas-auth.sql
-- ============================================================================

-- Enable UUID generation (idempotent)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. Users: Add CAS authentication fields
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS ucr_netid VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'email_code';
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

-- Backfill display_name from name for existing users
UPDATE users SET display_name = name WHERE display_name IS NULL;

-- ============================================================================
-- 2. Club Members: Expand role system
--    Old: 'admin' / 'member'
--    New: 'president' / 'vice_president' / 'officer' / 'moderator' / 'member'
-- ============================================================================

-- Migrate existing 'admin' roles to 'president'
UPDATE club_members SET role = 'president' WHERE role = 'admin';

-- Note: PostgreSQL doesn't support ALTER CHECK easily,
-- so we drop and re-add. The column stays.
ALTER TABLE club_members DROP CONSTRAINT IF EXISTS club_members_role_check;
-- Add the new constraint allowing expanded roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'club_members_role_check'
  ) THEN
    ALTER TABLE club_members ADD CONSTRAINT club_members_role_check
      CHECK (role IN ('president', 'vice_president', 'officer', 'moderator', 'member'));
  END IF;
END $$;

-- ============================================================================
-- 3. Club Staff Invitations
-- ============================================================================
CREATE TABLE IF NOT EXISTS club_staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  invited_email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('vice_president', 'officer', 'moderator')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  UNIQUE(club_id, invited_email, status)
);

CREATE INDEX IF NOT EXISTS idx_staff_invites_club ON club_staff_invites(club_id);
CREATE INDEX IF NOT EXISTS idx_staff_invites_email ON club_staff_invites(invited_email);

-- ============================================================================
-- 4. CAS Sessions (for ticket validation tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cas_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket VARCHAR(255) UNIQUE NOT NULL,
  netid VARCHAR(50) NOT NULL,
  validated_at TIMESTAMPTZ DEFAULT now(),
  ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_cas_sessions_netid ON cas_sessions(netid);

-- ============================================================================
-- Done
-- ============================================================================
