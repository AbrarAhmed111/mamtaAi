# MamtaAI Chatbot — LLM + RAG + Fine-Tuning Design

A complete design document for building an AI parenting assistant inside MamtaAI using Retrieval-Augmented Generation (RAG) and targeted fine-tuning. The assistant is grounded in MamtaAI's own data: baby profiles, activities, cry predictions, weekly insights, community blog/forum/resources, and expert content.

> **Status:** Design proposal. No production code. All examples below are illustrative.

---

## 1. Executive Summary

MamtaAI already collects rich structured parenting data: baby profiles, multi-parent caregiver relationships, feeding/sleep/diaper activities, audio recordings, cry-type predictions with confidence and urgency, weekly insights, rule-based cry guidance, and a community space (blog, forum, resources).

Today, advice surfaces as:

- Static rule-based suggestions (`src/lib/baby-health-suggestions.ts`).
- Cry-type-keyed tips (`src/lib/cry-type-guidance.ts`).
- Pre-computed weekly insights (`weekly_insights` table, `src/app/api/insights/route.ts`).

A conversational assistant ("MamtaBot") closes the gap between this data and a parent's questions in the moment ("Why is Aarav crying right now? He last fed 2 hours ago"). To stay safe, accurate, and personal, it needs:

1. **Retrieval (RAG)** over MamtaAI's own structured + community content so answers are grounded.
2. **Fine-tuning** on baby-care domain language and MamtaAI's tone so the model gives short, calm, non-medical guidance with the right disclaimers.
3. **Tool/function access** to the user's babies, recordings, and insights (with strict permissions) so answers are personalized.

This document describes the architecture, data sources, fine-tuning plan, integration, safety, and rollout.

---

## 2. Why a Chatbot for MamtaAI

### 2.1 User-facing use cases

- **In-the-moment cry support**: "Aarav is crying, he last ate 90 mins ago, his last cry was tagged 'gas' yesterday — what should I check?"
- **Profile-aware tips**: "What milestones should I expect this month for a 5-month-old breastfed baby?"
- **Insight Q&A**: "Why is my weekly cry trend marked 'increasing'?"
- **Community navigator**: "Find me forum threads where parents talked about night-waking at 4 months."
- **Resource discovery**: "Show me the best resources on baby-led weaning saved in MamtaAI."
- **Care-circle communication**: "Summarize what happened with Aarav today for grandma."
- **Onboarding helper**: "How do I add a second caregiver?"
- **Safety triage**: "He has a 39°C fever and is unusually sleepy — what should I do right now?"

### 2.2 Internal / product use cases

- **Expert dashboard assistant** for vetted experts answering parents.
- **Moderation copilot** for flagging community posts that misuse medical claims.
- **Admin analytics Q&A** for product owners ("Top 5 unmet questions this week").

---

## 3. Approach Overview: RAG + Fine-Tuning

MamtaAI uses **both** patterns because they solve different problems:

| Concern | RAG | Fine-Tuning |
|---|---|---|
| Up-to-date facts (new blog posts, new resources, the user's own babies) | ✅ excellent | ❌ stale |
| Tone / style ("calm, parent-friendly, never medically prescriptive") | ⚠️ partial | ✅ excellent |
| Domain vocabulary (cry types, cluster feeding, purple crying, wake windows) | ⚠️ via context | ✅ excellent |
| Structured-data lookup (this baby, last 7 days) | ✅ via tools | ❌ |
| Personalization (preferences, language, age) | ✅ via context | ⚠️ partial |
| Safety boundaries (no diagnosis, always advise clinician when needed) | ⚠️ via prompt | ✅ baked-in |
| Cost per query | ⚠️ token-heavy | ✅ smaller prompts |

**Decision:** Start with **RAG + strong system prompt** on a hosted model. Add **LoRA/QLoRA fine-tuning** in phase 2 once we have curated supervised examples from real (consented) chats and expert content.

---

## 4. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       MamtaAI (Next.js 15)                        │
│                                                                   │
│   /dashboard ──► <ChatBubble />  ──►  /api/chat (Edge/Node)       │
└────────────────────────────────────┬─────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Chat Orchestrator (server)                    │
│                                                                   │
│  1. AuthN/AuthZ (Supabase user, baby_parents permissions)         │
│  2. Build user/baby context (selected baby, last activities)      │
│  3. Tool-router (function calling): get_baby_summary,             │
│     get_recent_cries, get_weekly_insight, search_community...     │
│  4. RAG: embed query → pgvector ANN → top-k chunks                │
│  5. Compose prompt: system + tool results + retrieved chunks +    │
│     short conversation memory                                     │
│  6. Call LLM (fine-tuned or base) with streaming                  │
│  7. Post-process: safety filters, citations, log + telemetry      │
└────────────┬──────────────────────────┬──────────────────────────┘
             │                          │
             ▼                          ▼
┌────────────────────────┐   ┌────────────────────────────────────┐
│  Vector store           │   │  Tools (read-only SQL/services)    │
│  (Supabase pgvector)    │   │  - baby profile + last activities  │
│  - blog_chunks          │   │  - cry predictions feed            │
│  - forum_chunks         │   │  - weekly_insights row             │
│  - resource_chunks      │   │  - community search                │
│  - expert_kb_chunks     │   │  - audio backend (FastAPI proxy)   │
└────────────────────────┘   └────────────────────────────────────┘
             ▲                          ▲
             │                          │
             └──── ingestion pipeline (cron / Supabase Edge Func) ┘
                   chunks → embeddings → upsert into pgvector
```

This sits beside the existing FastAPI audio backend (`NEXT_PUBLIC_BACKEND_URL`) and reuses Supabase Auth, Row-Level Security (RLS), and storage.

---

## 5. Knowledge Sources (RAG Corpus)

MamtaAI already produces or stores everything the bot needs to be useful. The corpus is built from the existing schema.

### 5.1 Structured per-user context (live tools, not embedded)

These are queried **on demand** at chat time via tools so answers are always fresh and respect RLS:

| Source | Table(s) in `src/types/schema.sql` | Use |
|---|---|---|
| Baby profile (name, age, gender, weight/height, blood type, medical notes) | `babies`, `baby_parents` | Tailor responses to this baby. |
| Caregiver context | `baby_parents` (`is_primary`, `access_level`) | Hide actions a non-primary caregiver can't take. |
| Recent activities (last feed, sleep, diaper) | `baby_activities` | Answer "when did he last feed?" |
| Cry predictions + urgency | `recordings`, `cry_predictions` | "Yesterday's cries were tagged hunger." |
| Weekly insights | `weekly_insights` | "Your week trend is 'increasing'." |
| Health suggestions feed | `health_suggestions` | Surface AI/expert suggestions in chat. |
| Medical history | `baby_medical_conditions` | Allergy-aware feeding advice. |

### 5.2 Knowledge corpus (embedded into pgvector)

These are chunked, embedded, and stored once (with incremental updates):

1. **Community blog** — `blog_posts`, `blog_comments` (top-rated comments only).
2. **Community forum** — `forum_threads`, `forum_replies` (with category context).
3. **Community resources** — `community_resources` (titles, descriptions, extracted PDF/article text via the existing resource pipeline).
4. **Curated expert content** — a new `expert_kb_documents` table (see §11) for vetted articles by experts (`role = 'expert'`).
5. **Built-in guidance** — string libraries already in code:
   - `src/lib/cry-type-guidance.ts` (per-cry-type suggestions/tips).
   - `src/lib/baby-health-suggestions.ts` (age-based tips).
6. **MamtaAI help docs** — onboarding, family invite flow, caregiver permissions. Authored as Markdown in `/docs/help/*.md`.
7. **Safety playbooks** — "When to call a clinician" guidance authored by reviewers.

### 5.3 Chunking strategy

- **Posts/threads**: split by paragraph, target ~500 tokens per chunk, 50-token overlap.
- **Resources (PDFs)**: 800–1000 tokens with 100-token overlap, preserve section headings.
- **Code-based guidance** (`cry-type-guidance.ts`): one chunk per cry type with `{ key, suggestions, tips }`.
- **Help docs**: one chunk per H2 section.

Each chunk row stores: `id, source_type, source_id, title, content, token_count, embedding, metadata` where `metadata` includes age range, locale, baby/parent topic tags, author role, and freshness timestamps.

---

## 6. RAG Pipeline (Detailed)

### 6.1 Ingestion

A scheduled job (Supabase Edge Function, Vercel cron, or Next.js route on a cron) runs every N minutes:

1. Fetch new/updated rows since `last_indexed_at`.
2. Strip HTML/markdown.
3. Chunk.
4. Generate embeddings (e.g. `text-embedding-3-small` or open-source `bge-small-en-v1.5`).
5. Upsert into `knowledge_chunks` with pgvector.
6. Soft-delete chunks whose parent rows are deleted.

### 6.2 Retrieval

At chat time:

1. Take the user query + the last 1–2 conversation turns.
2. Generate a **single embedding** for the rewritten query (a small LLM call rewrites pronouns: "him" → "the selected baby").
3. **Hybrid search**:
   - Vector ANN top-k=20 from pgvector.
   - BM25/`pg_trgm` keyword top-k=20.
   - Reciprocal Rank Fusion → top-k=8.
4. **Filter** by metadata (age range matches baby, locale matches user, freshness window).
5. **Diversify** with MMR (Maximal Marginal Relevance) → final 4–6 chunks.

### 6.3 Tool routing (function calling)

Before/alongside retrieval, the LLM can call structured tools:

```ts
// Illustrative tool definitions
const tools = [
  {
    name: 'get_baby_summary',
    description: "Profile, age, and a 7-day activity summary for the user's selected baby",
    args: { babyId: 'uuid' },
  },
  {
    name: 'get_recent_cries',
    description: 'Cry predictions for one baby, latest N',
    args: { babyId: 'uuid', limit: 'integer' },
  },
  {
    name: 'get_weekly_insight',
    description: 'Latest row from weekly_insights for a baby',
    args: { babyId: 'uuid' },
  },
  {
    name: 'search_community',
    description: 'Search blog/forum/resources via RAG, scoped by tags',
    args: { query: 'string', tags: 'string[]' },
  },
  {
    name: 'list_health_suggestions',
    description: 'Active items from health_suggestions for a baby',
    args: { babyId: 'uuid' },
  },
]
```

Tools run **server-side** with the user's Supabase session so RLS (`baby_parents`) enforces access.

### 6.4 Prompt assembly

```
[SYSTEM]
You are MamtaBot, a calm, supportive assistant for parents of babies aged 0–24 months
on the MamtaAI platform. You are not a doctor. Always include a brief, plain-language
"call your pediatrician" pointer when symptoms could be serious. Keep replies short
and parent-friendly. Use the user's preferred language (default English).
Cite community/expert sources by title when you use them.

[USER CONTEXT]
- Caller: Sara (primary parent), preferred language: en
- Selected baby: Aarav, 5 months, A+, breastfed, no known allergies
- Last feed: 1h 50m ago (bottle, 90 ml)
- Last sleep window: 35 min, ended 25 min ago
- Recent cry predictions (24h): hunger x3, gas x1
- Weekly trend: stable

[RETRIEVED KNOWLEDGE]
1. [Cry type guide: gas] Burp mid-feed and after; upright position 15–20 minutes...
2. [Blog: "Bottle paced feeding basics"] When using a bottle, ...
3. [Help: "Logging feeds quickly"] Tap the + button on the baby card ...

[CONVERSATION]
user: He just woke and is fussing — is he hungry again?
assistant:
```

### 6.5 Streaming + citations

Stream tokens with **Server-Sent Events** to the client. At the end, append a structured `sources` payload (chunk ids + titles). Render in UI as small chips: `From: Bottle paced feeding basics`.

---

## 7. Fine-Tuning Strategy

### 7.1 Goal

Bake in:

- **Tone**: calm, second-person, short paragraphs, no medical jargon.
- **Safety reflex**: when red-flag symptoms appear (high fever in young infants, lethargy, difficulty breathing, dehydration), the response **must** include a clinician pointer.
- **Domain phrasing**: cluster feeding, purple crying, wake windows, sleep regressions, age-appropriate milestones.
- **Refusal/Deflection patterns**: never prescribe medication; never give doses; redirect to clinician.

### 7.2 Approach

- **Base model**: a small/medium open-source instruct model (e.g. Llama 3.1 8B Instruct, Qwen2.5 7B Instruct, or Mistral 7B Instruct) — chosen for cost and the ability to self-host if required for privacy.
- **Technique**: **LoRA / QLoRA** adapters (4-bit) — cheap, reversible, swappable per version.
- **Hardware**: a single 24–48 GB GPU is enough for 7B–8B LoRA.
- **Frameworks**: Hugging Face `transformers` + `peft` + `trl`; or `axolotl` for higher-level config.

If you prefer not to host: use **OpenAI / Anthropic supervised fine-tuning** (for tone) and keep RAG + tools for personalization.

### 7.3 Dataset construction (~5k–20k examples)

Build the SFT dataset from sources you already have, in this order:

1. **Bootstrap with synthetic Q&A**, generated by a strong teacher model (e.g. GPT-4 class) from each chunk of:
   - `cry-type-guidance.ts`
   - `baby-health-suggestions.ts`
   - top forum threads (privacy-stripped)
   - help docs
   Each example is `{instruction, optional context, response}`.
2. **Human-edit** each synthetic answer for tone and safety (mandatory — this is what makes the fine-tune valuable).
3. **Expert-authored** examples from MamtaAI experts (`profiles.role = 'expert'`). Maybe 500–2000 high-quality items.
4. **Adversarial / red-team set**: 200–500 prompts that try to extract diagnoses, dosing, or unsafe advice → the canonical safe refusal.
5. **Multilingual seed** (optional): mirror ~500 examples into Hindi, Urdu, etc., to expand reach.

### 7.4 Training recipe (illustrative)

```yaml
base_model: meta-llama/Llama-3.1-8B-Instruct
adapter: lora
lora_r: 16
lora_alpha: 32
lora_dropout: 0.05
target_modules: [q_proj, k_proj, v_proj, o_proj]
load_in_4bit: true
sequence_len: 4096
sample_packing: true
num_epochs: 3
learning_rate: 2e-4
warmup_ratio: 0.03
optimizer: adamw_bnb_8bit
gradient_checkpointing: true
eval_split: 5%
```

Save adapters per release: `mamtabot-tone-v1.0.safetensors`, `mamtabot-safety-v1.0.safetensors`. Compose at runtime.

### 7.5 Evaluation suite

- **Tone rubric** (1–5): warmth, brevity, parent-friendliness.
- **Safety pass-rate** on the red-team set (target ≥99%).
- **Faithfulness to retrieved chunks** (RAGAS / ARES-style).
- **Helpfulness vs. base** (LLM-as-judge head-to-head).
- **Latency** (P50/P95 time-to-first-token).
- **User thumbs ↑/↓** captured in production.

Block release if any: safety pass-rate < 99%, faithfulness drop > 5%, P95 TTFT > 1.5s.

---

## 8. LLM and Tech Stack Choices

### 8.1 Recommended starting stack

| Layer | Choice | Rationale |
|---|---|---|
| Chat LLM (phase 1) | OpenAI `gpt-4o-mini` or Anthropic `claude-3.5-haiku` | Strong instruction following, function calling, low cost, streaming. |
| Chat LLM (phase 2) | Self-hosted Llama 3.1 8B + LoRA | Privacy, cost at scale, custom tone. |
| Embeddings | `text-embedding-3-small` (OpenAI) **or** `bge-small-en-v1.5` (open) | 1536/384-dim, cheap, fast, fits pgvector. |
| Vector DB | **Supabase pgvector** | You already use Supabase — one less service. |
| Hybrid search | pgvector + `pg_trgm` (already enabled in your schema) | Native, no extra infra. |
| Reranker (optional) | `bge-reranker-base` | Boost precision on top-20. |
| Orchestration | Custom thin layer in `src/lib/chat/` (TypeScript). Optionally **Vercel AI SDK** or **LangChain.js**. | Keep it close to your existing Next.js code. |
| Streaming UI | Next.js Route Handler + `ReadableStream` + AI SDK `useChat` | Native streaming, low overhead. |
| Ingestion | Supabase Edge Functions on a schedule | Same auth/RLS surface. |
| Observability | OpenTelemetry + LangSmith / Helicone / Phoenix | Trace prompts, retrievals, costs. |

### 8.2 Why pgvector (not a separate vector DB)

- You already run Supabase Postgres with `pg_trgm` and `pgcrypto` enabled.
- RLS works on chunks tables the same way it works on `babies`/`baby_parents` — easy to scope private chunks.
- One less moving piece. You can upgrade to Pinecone / Qdrant / Weaviate later if scale demands.

---

## 9. Implementation Roadmap (Phased)

### Phase 0 — Foundations (Week 1)
- Add `knowledge_chunks` table with `vector` column.
- Pick an embedding model and store dimension.
- Author `/docs/help/*.md` for ~10 most-asked product questions.
- Pick the chat LLM provider for phase 1.

### Phase 1 — MVP RAG chatbot (Weeks 2–3)
- `/api/chat` route handler with streaming.
- One tool: `get_baby_summary`.
- Retrieval over: help docs + `cry-type-guidance.ts` + `baby-health-suggestions.ts`.
- Floating chat bubble in `DashboardLayout` (rendered like the existing notification dropdown so it scrolls with the header).
- Strict system prompt + medical disclaimer.

### Phase 2 — Personalization (Weeks 4–5)
- Tools: `get_recent_cries`, `get_weekly_insight`, `list_health_suggestions`.
- Conversation memory (`chat_sessions`, `chat_messages` tables).
- User feedback (thumbs + free text) → stored for fine-tune set.

### Phase 3 — Community RAG (Weeks 5–6)
- Ingest blog/forum/resources into `knowledge_chunks`.
- Hybrid search + MMR.
- Citations in UI.

### Phase 4 — Safety hardening (Week 7)
- Pre-LLM input classifier (emergency keywords → "call your local emergency number" overlay).
- Post-LLM safety filter (refuse to give doses, refuse to diagnose).
- Audit log of triggered safety paths.

### Phase 5 — Fine-tuning (Weeks 8–12)
- Build the SFT dataset (see §7.3).
- Train LoRA on Llama 3.1 8B.
- Shadow-deploy: run both base+RAG and fine-tuned+RAG on a sampled traffic.
- Promote when the eval suite is green.

### Phase 6 — Multilingual + expert mode (Weeks 13+)
- Add Hindi/Urdu prompts and examples.
- Expert dashboard with elevated capabilities and audit trail.

---

## 10. Integration With the Existing App

### 10.1 Route handler

Create `src/app/api/chat/route.ts`:

- `POST /api/chat` — accepts `{ messages, babyId? }`, returns a streaming response.
- Uses `createServerClient()` so RLS applies.
- Reads chat history from `chat_messages`.
- Resolves tools with the same `supabase` instance.

### 10.2 Client component

- `src/components/Chat/ChatBubble.tsx` — floating button bottom-right.
- `src/components/Chat/ChatPanel.tsx` — uses `useChat()` (AI SDK) or a small custom hook.
- Lives inside `DashboardLayout` so it inherits the sticky header pattern you already use for notifications.

### 10.3 Where the bot can be entered

- Global floating bubble on every dashboard page.
- "Ask MamtaBot" link from the cry recording result page (pre-fills "Why was this cry tagged as gas?").
- "Explain this insight" link on the weekly insight card.
- "Help" entry in the user dropdown (replaces or supplements the static help page).

### 10.4 Permissions and selection

The bot defaults to the **active baby** in the user's dashboard context. If the user is a non-primary caregiver, tools that would expose actions they cannot take (e.g. inviting another caregiver) are filtered out — same model you already use for hiding the invite icon on `dashboard/babies`.

---

## 11. Database Additions

Add these to `src/types/schema.sql`. Keep your style: `metadata JSONB`, `created_at`, indices on common filters, RLS-friendly.

```sql
-- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Knowledge corpus for RAG
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type TEXT NOT NULL CHECK (source_type IN
        ('blog', 'forum_thread', 'forum_reply', 'resource',
         'help_doc', 'cry_guidance', 'health_tip', 'expert_kb')),
    source_id TEXT,
    title TEXT,
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding vector(1536) NOT NULL,   -- match your embedding model dim
    age_min_months INTEGER,
    age_max_months INTEGER,
    locale TEXT DEFAULT 'en',
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_chunks_source ON knowledge_chunks(source_type, source_id);
CREATE INDEX idx_knowledge_chunks_locale ON knowledge_chunks(locale);
CREATE INDEX idx_knowledge_chunks_tags ON knowledge_chunks USING GIN (tags);
CREATE INDEX idx_knowledge_chunks_embedding
    ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- 2. Expert-authored articles (curated source for fine-tune + RAG)
CREATE TABLE expert_kb_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    body_markdown TEXT NOT NULL,
    age_min_months INTEGER,
    age_max_months INTEGER,
    review_status TEXT DEFAULT 'draft'
        CHECK (review_status IN ('draft', 'in_review', 'approved', 'archived')),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    locale TEXT DEFAULT 'en',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chat sessions and messages
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    baby_id UUID REFERENCES babies(id) ON DELETE SET NULL,
    title TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id, last_message_at DESC);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool', 'system')),
    content TEXT NOT NULL,
    tool_name TEXT,
    tool_args JSONB,
    tool_result JSONB,
    citations JSONB DEFAULT '[]'::jsonb,
    feedback TEXT CHECK (feedback IN ('up', 'down')),
    feedback_note TEXT,
    latency_ms INTEGER,
    model TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    safety_flags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);

-- 4. Fine-tune dataset capture (opt-in)
CREATE TABLE chat_finetune_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    edited_response TEXT,            -- after expert/human edit
    quality_score INTEGER,
    is_safety_test BOOLEAN DEFAULT FALSE,
    locale TEXT DEFAULT 'en',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.1 RLS sketch (Supabase)

- `chat_sessions`, `chat_messages`: `user_id = auth.uid()`.
- `knowledge_chunks` with `is_public = true`: readable by all authenticated users.
- Private chunks (per-user notes if you add them later): `metadata->>'owner_id' = auth.uid()`.
- `expert_kb_documents`: read when `review_status = 'approved'`; write only when `profiles.role IN ('expert', 'admin')`.

---

## 12. Safety, Privacy, Compliance

This is a baby-care product. Safety is part of the product, not a checkbox.

### 12.1 Hard rules baked into the system prompt and the fine-tune

- Never diagnose. Never give medication doses.
- For young infants with fever ≥ 38°C (100.4°F), persistent vomiting, lethargy, breathing trouble, dehydration, seizures, or non-blanching rash → **always** instruct contacting a clinician / emergency number.
- Never claim FDA/medical approval.
- Always include "This is educational only and does not replace advice from a qualified clinician." for any health response (mirrors `src/lib/baby-health-suggestions.ts`).

### 12.2 Layered safety

1. **Pre-LLM**: keyword + small classifier intercepts emergency content → return a fixed, localized "call your local emergency number" template with a soft link to logged context.
2. **System prompt**: hard rules + persona.
3. **Fine-tune**: red-team set teaches the model to refuse / redirect.
4. **Post-LLM**: regex/classifier on the response to catch dose strings ("X mg/kg"), banned phrases.
5. **Citations**: every health claim must be tied to a retrieved chunk or the response is regenerated with stricter retrieval.

### 12.3 Privacy

- All chat goes through your Supabase-authed Next.js route — no third party gets the user's identity.
- For any third-party LLM call, send only the **minimum context** needed: baby's first name, age in months, structured activity counts. Never send full names, emails, phone numbers, exact birth dates, or addresses.
- Provide **opt-in** for using chats as fine-tuning data (`profiles.metadata.chatTrainingOptIn`).
- Retention: chat messages can be auto-pruned after N days based on user setting.

### 12.4 Compliance considerations

- **Children's data**: data is about the child but owned by the parent. Make consent and retention explicit in the privacy notice.
- **HIPAA-like guidance**: if you store medical conditions (`baby_medical_conditions`), keep them out of LLM context unless they are necessary, and prefer summarization ("known nut allergy") over raw text.
- **Regional law**: GDPR/DPDP-style data export and delete must include `chat_sessions`, `chat_messages`, and `chat_finetune_examples`.

---

## 13. Evaluation & Quality

Beyond §7.5, run continuous evals in production:

- **Top-line**: thumbs-up rate, session length, return rate within 7 days.
- **Quality**: weekly sample (e.g. 200 messages) graded by 2 reviewers on a rubric (Tone / Helpfulness / Safety / Faithfulness).
- **Retrieval health**: recall@k against a labeled set of 200 queries linked to gold chunks.
- **Drift**: track answer cosine similarity to retrieved chunks over time; an unexpected drop is a regression signal.
- **A/B**: every change ships behind a flag with at least 5k message exposure before full rollout.

---

## 14. Cost & Scaling

### 14.1 Cost levers

- **Token budget per response**: cap at ~500 output tokens.
- **Retrieval k**: 4–6 chunks, not 20.
- **Cache embeddings** for repeated queries (15-minute hash cache).
- **Cache assistant responses** for the same `(prompt hash, baby revision)` for ~5 minutes (only for non-personal answers).
- **Smaller model first**: gate "use a bigger model" by query difficulty (length, presence of medical terms, retrieval confidence).

### 14.2 Indicative monthly cost (illustrative, varies by provider)

For 10 000 monthly active parents averaging 5 chats/month (50 000 chats) and ~1 500 tokens per chat:

- Hosted small model (e.g. `gpt-4o-mini`-class) for chat: a few hundred USD/month.
- Embeddings (cold start of corpus + 50 000 queries): tens of USD/month.
- Self-hosted Llama 3.1 8B on a single L4/A10 GPU: a few hundred USD/month, flat — better at higher volumes.

Re-cost with your real provider before launch.

### 14.3 Scaling path

1. **Single Supabase pgvector** index, `ivfflat lists=100` (works to a few million chunks).
2. Add a **reranker** before scaling up the index — quality often improves more than scaling k.
3. **Shard** the index by locale once you cross multiple million chunks.
4. Move to **Qdrant / Pinecone** if write throughput or low-latency ANN dominate.

---

## 15. Benefits to MamtaAI

### 15.1 User experience

- **Always-on parent companion** that already knows their baby (no re-typing context).
- **Faster decisions** in stressful moments (3 AM cry, sudden fever).
- **Lower learning curve** for first-time parents.
- **Discoverability** of community content and resources that today get buried.
- **Multilingual reach** as you add locales to the fine-tune and corpus.

### 15.2 Product

- **Engagement & retention**: a chat bubble is a sticky surface; conversations create return reasons (notifications, follow-ups).
- **Insight loop**: every chat is structured feedback on what parents actually struggle with — direct input to your blog/expert roadmap.
- **Premium upsell**: high-quality, expert-vetted answers and longer history can sit behind a paid plan (`subscription_plans` already exists in the schema).
- **Expert moat**: the curated `expert_kb_documents` corpus + fine-tuned tone become your differentiator vs generic chatbots.

### 15.3 Operations

- **Support cost ↓**: many "how do I add a caregiver?" and "what does this insight mean?" tickets disappear.
- **Moderation copilot**: same retrieval stack flags risky community posts.
- **Analytics**: `chat_messages.safety_flags` highlights emerging risk topics.

---

## 16. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Hallucinated medical advice | Hard system rules + safety classifier + RAG citations required for health claims. |
| Parent treats bot as a clinician | Persistent disclaimer; emergency-keyword interceptor; "Find a clinician" CTA. |
| PII leakage to LLM vendor | Minimum-context payloads; opt-in training; self-host option in phase 2. |
| Bias / cultural mismatch | Localized corpus, locale-specific evaluation, expert review per locale. |
| Cost spikes from long contexts | Token budgets, summarized memory, response-length caps. |
| Stale knowledge | Incremental ingestion job + freshness in metadata; eviction policy. |
| Model regressions on update | Eval gates + canary rollout + 1-click rollback (LoRA adapter swap). |
| Abuse (prompt injection in forum content) | Strip instructions from retrieved chunks; treat retrieved text as data, not instructions. |

---

## 17. Glossary

- **LLM**: Large Language Model — the underlying text-generation model (Llama 3.1, GPT-4o, Claude, etc.).
- **RAG**: Retrieval-Augmented Generation — fetch relevant chunks before generation so the model is grounded.
- **Fine-tuning**: Updating model weights on curated examples to teach style/safety/domain.
- **LoRA / QLoRA**: Cheap, reversible fine-tuning that trains small adapter matrices, often in 4-bit. Adapters can be swapped at runtime.
- **Embedding**: A numeric vector for text used for similarity search.
- **pgvector**: A Postgres extension that stores and searches embeddings; works inside Supabase.
- **Tool / function calling**: The LLM emits a structured call (e.g. `get_recent_cries`) which your server executes and feeds back into the conversation.
- **MMR**: Maximal Marginal Relevance — picks results that are both relevant and diverse.
- **Hybrid search**: Combining semantic (vector) and keyword (BM25/`pg_trgm`) retrieval.
- **SFT**: Supervised Fine-Tuning on `(prompt, response)` pairs.
- **Red-team set**: A test set of adversarial prompts used to verify safety behavior.

---

## 18. What to do next

1. Approve the architecture in this doc and the phased roadmap.
2. Apply the new tables in §11 to your Supabase project.
3. Author the first 10–15 help docs under `docs/help/`.
4. Spike `src/app/api/chat/route.ts` with one tool (`get_baby_summary`) and the help-doc corpus only — that's the smallest useful slice.
5. Add the floating chat bubble inside `DashboardLayout`.
6. Start collecting consented chats; this is the seed of your fine-tune dataset.
