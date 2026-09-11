-- MamtaAI coupons and promotional email support.
-- Run in Supabase SQL Editor after admin_setup.sql if these columns/tables are missing.

ALTER TABLE discount_coupons
  ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_promotion_code_id TEXT;

CREATE INDEX IF NOT EXISTS idx_discount_coupons_stripe_coupon
  ON discount_coupons(stripe_coupon_id)
  WHERE stripe_coupon_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_discount_coupons_stripe_promotion_code
  ON discount_coupons(stripe_promotion_code_id)
  WHERE stripe_promotion_code_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES discount_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  plan_slug TEXT,
  stripe_subscription_id TEXT,
  stripe_checkout_session_id TEXT,
  stripe_invoice_id TEXT,
  redemption_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_created
  ON coupon_redemptions(coupon_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_created
  ON coupon_redemptions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_subscription
  ON coupon_redemptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view coupon redemptions" ON coupon_redemptions;
CREATE POLICY "Admins view coupon redemptions" ON coupon_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS promotional_email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  audience TEXT NOT NULL CHECK (audience IN ('all', 'free', 'plus', 'pro', 'custom')),
  subject TEXT NOT NULL,
  heading TEXT NOT NULL,
  message TEXT NOT NULL,
  cta_label TEXT,
  cta_url TEXT,
  offer_code TEXT,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotional_email_campaigns_created
  ON promotional_email_campaigns(created_at DESC);

ALTER TABLE promotional_email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage promotional email campaigns" ON promotional_email_campaigns;
CREATE POLICY "Admins manage promotional email campaigns" ON promotional_email_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
