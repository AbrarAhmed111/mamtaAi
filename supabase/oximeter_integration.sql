-- MamtaAI oximeter module (run in Supabase SQL Editor)
-- Extends existing oximeter_devices / oximeter_readings from schema.sql

-- Sessions for min/max/avg stats and history pages
CREATE TABLE IF NOT EXISTS oximeter_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  device_row_id UUID REFERENCES oximeter_devices(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  min_spo2 INTEGER,
  max_spo2 INTEGER,
  avg_spo2 NUMERIC(5,2),
  min_pulse INTEGER,
  max_pulse INTEGER,
  avg_pulse NUMERIC(6,2),
  reading_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'disconnected', 'error')),
  end_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oximeter_sessions_baby_time
  ON oximeter_sessions(baby_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_oximeter_sessions_user
  ON oximeter_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_oximeter_sessions_active
  ON oximeter_sessions(user_id, status) WHERE status = 'active';

-- Optional columns on devices (safe if already present)
ALTER TABLE oximeter_devices ADD COLUMN IF NOT EXISTS baby_id UUID REFERENCES babies(id) ON DELETE SET NULL;
ALTER TABLE oximeter_devices ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'disconnected';
ALTER TABLE oximeter_devices ADD COLUMN IF NOT EXISTS is_trusted BOOLEAN DEFAULT FALSE;
ALTER TABLE oximeter_devices ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMPTZ;
ALTER TABLE oximeter_devices ADD COLUMN IF NOT EXISTS last_reading_at TIMESTAMPTZ;
ALTER TABLE oximeter_devices ADD COLUMN IF NOT EXISTS battery_level INTEGER;

-- Link readings to sessions (stored in metadata if column missing on older DBs)
ALTER TABLE oximeter_readings ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES oximeter_sessions(id) ON DELETE SET NULL;
ALTER TABLE oximeter_readings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE oximeter_readings ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT TRUE;
ALTER TABLE oximeter_readings ADD COLUMN IF NOT EXISTS raw_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_oximeter_readings_session
  ON oximeter_readings(session_id, measured_at) WHERE session_id IS NOT NULL;

-- RLS
ALTER TABLE oximeter_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own oximeter sessions" ON oximeter_sessions;
CREATE POLICY "Users manage own oximeter sessions" ON oximeter_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Baby caregivers read oximeter sessions" ON oximeter_sessions;
CREATE POLICY "Baby caregivers read oximeter sessions" ON oximeter_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM baby_parents bp
      WHERE bp.baby_id = oximeter_sessions.baby_id
        AND bp.parent_id = auth.uid()
        AND bp.invitation_status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Owners manage oximeter devices" ON oximeter_devices;
CREATE POLICY "Owners manage oximeter devices" ON oximeter_devices
  FOR ALL USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Caregivers read oximeter devices for their babies" ON oximeter_devices;
CREATE POLICY "Caregivers read oximeter devices for their babies" ON oximeter_devices
  FOR SELECT USING (
    owner_id = auth.uid()
    OR (
      baby_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM baby_parents bp
        WHERE bp.baby_id = oximeter_devices.baby_id
          AND bp.parent_id = auth.uid()
          AND bp.invitation_status = 'accepted'
      )
    )
  );

DROP POLICY IF EXISTS "Caregivers read oximeter readings" ON oximeter_readings;
CREATE POLICY "Caregivers read oximeter readings" ON oximeter_readings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM baby_parents bp
      WHERE bp.baby_id = oximeter_readings.baby_id
        AND bp.parent_id = auth.uid()
        AND bp.invitation_status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Caregivers insert oximeter readings" ON oximeter_readings;
CREATE POLICY "Caregivers insert oximeter readings" ON oximeter_readings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM baby_parents bp
      WHERE bp.baby_id = oximeter_readings.baby_id
        AND bp.parent_id = auth.uid()
        AND bp.invitation_status = 'accepted'
        AND (bp.can_view_history IS NOT FALSE)
    )
  );

-- Realtime (enable in Supabase Dashboard → Database → Replication if needed)
-- ALTER PUBLICATION supabase_realtime ADD TABLE oximeter_readings;
