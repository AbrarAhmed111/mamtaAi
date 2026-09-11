-- Seed 3 published blog posts for author 0527d500-12c2-4b4a-ac24-7aa68a5af9a7
-- Run in Supabase SQL Editor (service role bypasses RLS)

INSERT INTO blog_posts (
  author_id,
  title,
  slug,
  excerpt,
  content,
  category,
  subcategory,
  tags,
  age_group,
  is_expert_content,
  author_credentials,
  status,
  published_at,
  is_pinned
) VALUES
(
  '0527d500-12c2-4b4a-ac24-7aa68a5af9a7',
  'Understanding Your Newborn''s Sleep Patterns',
  'understanding-newborn-sleep-patterns',
  'Newborns sleep a lot, but rarely on your schedule. Here is a practical guide to what is normal and how to build gentle routines without overstretching yourself.',
  $body1$
Newborns typically sleep 14–17 hours per day, but in short stretches of 2–4 hours. Their circadian rhythm is still developing, so day/night confusion is completely normal in the first 6–8 weeks.

**What helps:**
- Keep daytime feeds and play in bright, active environments
- Use dim lights and quiet voices during night feeds
- Swaddle safely if your baby finds it soothing
- Track sleep in MamtaAI so you can spot patterns over time

**When to worry:** If your baby is unusually lethargic, not waking for feeds, or has breathing changes during sleep, contact your pediatrician.

Remember: every baby is different. Consistency matters more than perfection. Small improvements each week add up.
$body1$,
  'Sleep',
  'Newborn sleep',
  '["newborn", "sleep", "routine", "parenting-tips"]'::jsonb,
  'newborn',
  false,
  NULL,
  'published',
  NOW() - INTERVAL '3 days',
  false
),
(
  '0527d500-12c2-4b4a-ac24-7aa68a5af9a7',
  'Breastfeeding Basics: What Every New Parent Should Know',
  'breastfeeding-basics-new-parents',
  'Breastfeeding is a learned skill for both you and your baby. These fundamentals can help you get started with confidence and know when to seek support.',
  $body2$
Breastfeeding works best when you and your baby are comfortable, fed, and calm. In the first days, colostrum is small in volume but rich in nutrients—frequent feeds are expected and healthy.

**Latch tips:**
- Bring baby to breast, not breast to baby
- Aim for a wide open mouth with lips flanged outward
- You should feel pulling, not pinching

**Supply and demand:** Milk production follows how often the baby feeds. Cluster feeding in the evening is common and does not mean you are "running out."

**Hydration and rest:** Drink water when you are thirsty and accept help with meals and housework when you can.

If you have pain, cracked nipples, or concerns about weight gain, reach out to a lactation consultant or your pediatrician early. Support makes a huge difference.
$body2$,
  'Feeding',
  'Breastfeeding',
  '["breastfeeding", "feeding", "newborn", "nutrition"]'::jsonb,
  '0-3months',
  false,
  NULL,
  'published',
  NOW() - INTERVAL '2 days',
  false
),
(
  '0527d500-12c2-4b4a-ac24-7aa68a5af9a7',
  'Tummy Time: Why It Matters and How to Start Safely',
  'tummy-time-why-it-matters',
  'Tummy time builds neck, shoulder, and core strength—skills your baby needs for rolling, sitting, and crawling. Here is how to start from day one.',
  $body3$
Pediatricians recommend supervised tummy time from birth, starting with a few minutes several times a day and building up as your baby grows stronger.

**Getting started:**
- Place baby on a firm, flat surface (never on soft beds or couches)
- Get down at eye level and talk or sing to encourage lifting the head
- Use a rolled towel under the chest for extra support if needed

**Typical milestones:**
- By 2 months: brief head lifts
- By 4 months: pushes up on forearms
- By 6 months: may roll in one or both directions

If your baby strongly dislikes tummy time, try shorter sessions more often rather than one long stretch. Always supervise and stop if they become overtired or upset.

Track developmental activities in MamtaAI alongside sleep and feeding logs to see the full picture of your baby's day.
$body3$,
  'Development',
  'Motor skills',
  '["tummy-time", "development", "milestones", "activities"]'::jsonb,
  '0-3months',
  false,
  NULL,
  'published',
  NOW() - INTERVAL '1 day',
  true
);
