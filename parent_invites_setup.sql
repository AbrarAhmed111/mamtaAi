-- Parent Invite Relatives setup
-- Run this in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.baby_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'other' CHECK (relationship IN ('mother', 'father', 'guardian', 'caregiver', 'grandparent', 'other')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'approved', 'withdrawn')),
  invite_token TEXT NOT NULL UNIQUE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ NULL,
  withdrawn_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baby_invites_baby ON public.baby_invites(baby_id);
CREATE INDEX IF NOT EXISTS idx_baby_invites_email ON public.baby_invites(invited_email);
CREATE INDEX IF NOT EXISTS idx_baby_invites_status ON public.baby_invites(status);
CREATE INDEX IF NOT EXISTS idx_baby_invites_token ON public.baby_invites(invite_token);

CREATE UNIQUE INDEX IF NOT EXISTS uq_baby_invites_open_email
  ON public.baby_invites (baby_id, invited_email)
  WHERE status IN ('waiting', 'approved');

ALTER TABLE public.baby_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accepted baby members can view invites" ON public.baby_invites;
CREATE POLICY "Accepted baby members can view invites" ON public.baby_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.baby_parents bp
      WHERE bp.baby_id = baby_invites.baby_id
        AND bp.parent_id = auth.uid()
        AND bp.invitation_status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Primary parent can create invites" ON public.baby_invites;
CREATE POLICY "Primary parent can create invites" ON public.baby_invites
  FOR INSERT WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.baby_parents bp
      WHERE bp.baby_id = baby_invites.baby_id
        AND bp.parent_id = auth.uid()
        AND bp.invitation_status = 'accepted'
        AND bp.can_edit_profile = TRUE
    )
  );

DROP POLICY IF EXISTS "Primary parent can update invites" ON public.baby_invites;
CREATE POLICY "Primary parent can update invites" ON public.baby_invites
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.baby_parents bp
      WHERE bp.baby_id = baby_invites.baby_id
        AND bp.parent_id = auth.uid()
        AND bp.invitation_status = 'accepted'
        AND bp.can_edit_profile = TRUE
    )
  );

DROP POLICY IF EXISTS "Invited user can update own invite" ON public.baby_invites;
CREATE POLICY "Invited user can update own invite" ON public.baby_invites
  FOR UPDATE USING (
    LOWER(invited_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.update_baby_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_baby_invites_updated_at ON public.baby_invites;
CREATE TRIGGER trg_update_baby_invites_updated_at
BEFORE UPDATE ON public.baby_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_baby_invites_updated_at();
