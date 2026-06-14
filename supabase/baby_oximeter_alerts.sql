-- Oximeter alert limits are stored in babies.metadata->oximeterAlerts (JSONB).
-- Run in Supabase SQL Editor if alerts fail to persist or caregivers cannot save.

ALTER TABLE babies ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Allow any accepted caregiver with edit permission to update baby profiles (matches API).
DROP POLICY IF EXISTS "Primary parents can update babies" ON babies;
DROP POLICY IF EXISTS "Caregivers with edit access can update babies" ON babies;
CREATE POLICY "Caregivers with edit access can update babies" ON babies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM baby_parents
      WHERE baby_parents.baby_id = babies.id
        AND baby_parents.parent_id = auth.uid()
        AND baby_parents.invitation_status = 'accepted'
        AND baby_parents.can_edit_profile = TRUE
    )
  );
