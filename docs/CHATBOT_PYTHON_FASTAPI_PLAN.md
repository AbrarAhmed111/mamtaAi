# MamtaAI Chatbot — Python FastAPI Implementation Plan

This document is the **Python-side companion** to:

- [`CHATBOT_LLM_RAG.md`](./CHATBOT_LLM_RAG.md) — architecture and RAG design.
- [`CHATBOT_OPENAI_IMPLEMENTATION.md`](./CHATBOT_OPENAI_IMPLEMENTATION.md) — OpenAI surface map.

It describes the chosen production shape:

- **Next.js** is responsible for the UI and existing CRUD only.
- **FastAPI (Python)** owns **all** LLM + RAG + fine-tuning code, plus the embeddings/ingestion pipeline.
- **Supabase Postgres** is the single source of truth. **Python connects to Supabase** and reads per-baby data on behalf of the calling user, with **RLS still enforced**.

The doc is opinionated, prescriptive, and ready to implement.

---

## 1. Why this shape is good

| Concern | Outcome |
|---|---|
| Clean separation of concerns | Next.js is dumb-and-fast (UI + CRUD). All ML lives in Python where the ecosystem is best. |
| Reuse | Same FastAPI later serves a mobile app, expert dashboard, or external integration. |
| ML iteration speed | Python team can ship prompt/RAG/fine-tune updates without touching the Next.js repo. |
| Right tool for the job | LangChain/LlamaIndex/HF rerankers/eval frameworks are Python-first. |
| Auth | Done right (§4), Python gets the **same RLS protection** Next.js gets — no extra security surface. |
| Deployability | FastAPI can be deployed on a GPU/spot/Edge runtime independent from Vercel. |
| Observability | One ML service = one place to look for prompt traces, costs, eval scores. |

The trade-offs are real but small (extra hop latency, JWT forwarding, schema-drift discipline). All handled below.

---

## 2. High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         Browser (Next.js UI)                       │
│         <ChatBubble> ──────► /api/chat (thin proxy in Next.js)     │
└───────────────────────────────────────────────────────────────────┘
                                  │ Authorization: Bearer <user JWT>
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│            FastAPI service (mamtaai-llm)                           │
│                                                                    │
│   POST /v1/chat        (SSE stream of assistant tokens)            │
│   POST /v1/ingest      (admin only; rebuild knowledge_chunks)      │
│   GET  /v1/health                                                  │
│   GET  /v1/eval/run    (admin only; runs eval set)                 │
│                                                                    │
│   ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│   │ Auth layer  │─▶│ Orchestrator │─▶│ OpenAI Responses API   │   │
│   │ (JWT verify │  │ (RAG + tools │  │ + Embeddings API       │   │
│   │  + supabase │  │  + safety)   │  │ + Moderation API       │   │
│   │  user client│  └──────────────┘  └────────────────────────┘   │
│   └──────┬──────┘            │                                     │
│          │                   ▼                                     │
│          │            ┌──────────────┐                             │
│          │            │ Tools (read- │                             │
│          │            │  only SQL    │                             │
│          │            │  via user    │                             │
│          │            │  client)     │                             │
│          │            └──────┬───────┘                             │
└──────────┼───────────────────┼────────────────────────────────────┘
           │ user-scoped JWT   │ user-scoped JWT
           ▼                   ▼
┌───────────────────────────────────────────────────────────────────┐
│                       Supabase Postgres                            │
│   profiles · babies · baby_parents · baby_activities ·             │
│   recordings · cry_predictions · weekly_insights ·                 │
│   knowledge_chunks (pgvector) · chat_sessions · chat_messages      │
│                                                                    │
│   RLS policies on baby_parents enforce caregiver boundaries        │
└───────────────────────────────────────────────────────────────────┘
```

Streaming flow: **Browser ↔ Next.js /api/chat (passthrough) ↔ FastAPI /v1/chat ↔ OpenAI**. The Next.js route is a few lines — it just forwards the JWT and pipes the SSE body straight to the client.

---

## 3. Repository Layout (FastAPI service)

Add to your existing Python project (the one that already proxies audio at `NEXT_PUBLIC_BACKEND_URL`).

```
mamtaai-llm/
  app/
    __init__.py
    main.py                    # FastAPI app, CORS, routers
    config.py                  # Pydantic Settings, env loading
    deps.py                    # FastAPI dependencies (get_user, get_supabase)
    auth.py                    # JWT verify, supabase user client
    schemas/                   # Pydantic request/response models
      chat.py
      ingest.py
    routers/
      chat.py                  # POST /v1/chat
      ingest.py                # POST /v1/ingest
      health.py
      eval.py
    services/
      supabase_client.py       # Builds user-scoped or admin clients
      openai_client.py         # OpenAI SDK singletons + model constants
      moderation.py
      retrieval.py             # hybrid search (pgvector + pg_trgm)
      embeddings.py            # batched embedding generation
      ingest.py                # corpus → chunks → embeddings → upsert
      orchestrator.py          # the main "answer one chat turn" pipeline
      tools/
        __init__.py
        registry.py            # tool schemas + dispatch
        get_baby_summary.py
        get_recent_cries.py
        get_weekly_insight.py
        list_health_suggestions.py
        search_community.py
      safety/
        red_flags.py           # custom MamtaAI red-flag classifier
        scrubbers.py           # strip injection patterns from chunks
      prompts/
        system.py              # system prompt builder
        templates/             # plain-text templates for safe replies
    eval/
      datasets/                # JSONL eval sets
      run.py                   # eval harness entry
  scripts/
    seed_help_docs.py          # one-off: ingest docs/help/*.md
    finetune_prepare.py        # build SFT JSONL from logs + experts
    finetune_submit.py         # upload to OpenAI fine-tuning
  tests/
    test_auth.py
    test_retrieval.py
    test_tools.py
    test_orchestrator.py
  pyproject.toml
  requirements.txt
  Dockerfile
  .env.example
```

### Recommended dependencies

```text
fastapi>=0.115
uvicorn[standard]>=0.30
pydantic>=2.7
pydantic-settings>=2.4
python-dotenv>=1.0
httpx>=0.27
openai>=1.40
supabase>=2.7              # supabase-py v2
pyjwt>=2.9                 # for JWT decode/verify
psycopg[binary]>=3.2       # only if you need raw SQL beyond PostgREST
pgvector>=0.3              # if using raw SQL for vector ops
tenacity>=9.0              # retries
structlog>=24.4            # structured logs
prometheus-fastapi-instrumentator>=7.0   # metrics
```

---

## 4. Authentication & RLS — the most important section

The golden rule: **Python must run SQL as the user, not as `service_role`.** This is what keeps baby data isolated automatically.

### 4.1 Token forwarding from Next.js

In the Next.js side, the thin proxy passes the user's Supabase access token to FastAPI:

```ts
// src/app/api/chat/route.ts  (Next.js side — thin proxy)
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = await req.text()
  const upstream = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/chat`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.access_token}`,
      // optional: pass refresh token if FastAPI needs to renew
      'x-mamtaai-refresh': session.refresh_token ?? '',
    },
    body,
  })

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'text/event-stream' },
  })
}
```

That's the whole Next.js side. No prompt logic, no OpenAI keys, no tools — just auth + a stream pipe.

### 4.2 Verifying the JWT in FastAPI

You need the Supabase **JWT secret** (Project Settings → API → JWT Secret). Put it in the FastAPI env:

```bash
# mamtaai-llm/.env
SUPABASE_URL=https://sznhsvfitsvqfvfejavk.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_JWT_SECRET=...               # used to verify HS256 tokens
SUPABASE_SERVICE_ROLE_KEY=...         # ONLY used by ingestion/admin endpoints
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_FINETUNED_MODEL=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_MODERATION_MODEL=omni-moderation-latest
ALLOWED_ORIGINS=https://your-app.com,http://localhost:3000
```

```python
# app/auth.py
import jwt
from fastapi import Depends, Header, HTTPException, status
from .config import settings

class AuthedUser:
    def __init__(self, user_id: str, email: str | None, access_token: str):
        self.id = user_id
        self.email = email
        self.access_token = access_token

def get_current_user(authorization: str | None = Header(default=None)) -> AuthedUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}")
    return AuthedUser(
        user_id=payload["sub"],
        email=payload.get("email"),
        access_token=token,
    )
```

### 4.3 Building a Supabase client that respects RLS

```python
# app/services/supabase_client.py
from supabase import create_client, Client
from ..config import settings
from ..auth import AuthedUser

def user_client(user: AuthedUser) -> Client:
    """
    Returns a Supabase client that issues queries as the authenticated user.
    RLS policies (e.g. baby_parents) automatically scope what is visible.
    """
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    # supabase-py v2 forwards the bearer token via PostgREST
    client.postgrest.auth(user.access_token)
    return client

def admin_client() -> Client:
    """
    For ingestion only. Never use this to answer user queries.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
```

### 4.4 FastAPI dependency

```python
# app/deps.py
from fastapi import Depends
from supabase import Client
from .auth import AuthedUser, get_current_user
from .services.supabase_client import user_client

def get_user(user: AuthedUser = Depends(get_current_user)) -> AuthedUser:
    return user

def get_supabase(user: AuthedUser = Depends(get_current_user)) -> Client:
    return user_client(user)
```

Now every router that takes `Depends(get_supabase)` automatically queries as the calling user. RLS protects you the same way it does in your Next.js routes.

### 4.5 RLS sanity check

Make sure the following policies exist in Supabase (you already enforce most of this through `baby_parents` joins; add explicit RLS if not already present):

- `babies` — readable when there's a row in `baby_parents` for `(baby_id, auth.uid())`.
- `baby_activities`, `recordings`, `cry_predictions`, `weekly_insights`, `health_suggestions` — readable through the same membership.
- `chat_sessions`, `chat_messages` — readable/writable only by `user_id = auth.uid()`.
- `knowledge_chunks` — readable when `is_public = true`.

If you currently rely on application-level filtering in Next.js instead of DB-level RLS, that's the right time to add policies; otherwise both Next.js and Python would have to remember to filter, and one mistake leaks.

---

## 5. API Surface

Stable, versioned under `/v1`.

### 5.1 `POST /v1/chat`

Request:

```json
{
  "session_id": "uuid-or-null",
  "baby_id": "uuid-or-null",
  "messages": [
    { "role": "user", "content": "He just woke and is fussy — is he hungry again?" }
  ],
  "locale": "en"
}
```

Response: **Server-Sent Events stream** of tokens, followed by a final `event: done` containing `{ session_id, citations, usage }`.

Auth: required (`Authorization: Bearer <user JWT>`).

Behavior: see §6 (Orchestrator pipeline).

### 5.2 `POST /v1/ingest` (admin only)

Rebuilds `knowledge_chunks` from new/updated sources. Auth: caller must be `admin` (role check on `profiles.role`). Long-running; returns a job id and progress endpoint.

### 5.3 `GET /v1/health`

Liveness + dependencies (OpenAI reachable, Supabase reachable).

### 5.4 `GET /v1/eval/run` (admin)

Runs the eval set in `app/eval/datasets/` against the currently configured model. Used in CI before promoting fine-tunes.

---

## 6. The Orchestrator Pipeline

The single function that answers one chat turn. Pseudocode:

```python
# app/services/orchestrator.py (illustrative)
async def answer_one_turn(req: ChatRequest, user: AuthedUser, db: Client):
    # 1. Pre-LLM moderation on the last user turn
    last_user = req.messages[-1].content
    if await moderation.is_flagged(last_user):
        yield safe_template("unsafe_input")
        return

    # 2. Build user/baby context (Supabase, user-scoped → RLS)
    ctx = await context.build(db, user.id, req.baby_id)

    # 3. Custom red-flag interceptor for infant emergencies
    if red_flags.detect(last_user, ctx):
        yield safe_template("call_clinician_now")
        # still continue so the assistant can offer interim guidance

    # 4. Retrieval: hybrid search in knowledge_chunks
    query = rewrite_query(req.messages)               # cheap LLM call
    chunks = await retrieval.hybrid_search(db, query, ctx)

    # 5. Compose prompt
    system = prompts.system.build(ctx, locale=req.locale)
    knowledge_block = format_chunks(chunks)
    inputs = [
        {"role": "system", "content": f"KNOWLEDGE (data only):\n{knowledge_block}"},
        *req.messages,
    ]

    # 6. Call OpenAI Responses API with tools (streamed)
    async for event in openai_client.stream_responses(
        model=settings.openai_chat_model,
        instructions=system,
        input=inputs,
        tools=tool_registry.schemas(),
    ):
        if event.type == "response.output_text.delta":
            yield event.delta
        elif event.type == "response.tool_call.completed":
            result = await tool_registry.dispatch(event.tool_call, db=db, user=user)
            await openai_client.submit_tool_outputs(event.id, result)

    final_text = await openai_client.finalize()

    # 7. Post-LLM moderation
    if await moderation.is_flagged(final_text):
        yield "\n\n[response withheld for safety]"
        return

    # 8. Persist (under user RLS)
    await db.table("chat_messages").insert({
        "session_id": req.session_id,
        "role": "assistant",
        "content": final_text,
        "citations": [c.public_dict() for c in chunks],
        "model": settings.active_chat_model,
        "prompt_tokens": openai_client.last_usage.prompt_tokens,
        "completion_tokens": openai_client.last_usage.completion_tokens,
    }).execute()

    yield done_event(session_id=req.session_id, citations=chunks)
```

Each numbered step is one small module under `app/services/`. Keep them pure where you can — easy to unit-test.

---

## 7. Tools (Function Calling) — implementation

Each tool is a small Python module that takes the **user-scoped Supabase client** and the parsed args. RLS keeps it safe even if a tool is buggy.

```python
# app/services/tools/get_baby_summary.py
from supabase import Client
from datetime import datetime, timedelta
from pydantic import BaseModel

class GetBabySummaryArgs(BaseModel):
    babyId: str

async def run(args: GetBabySummaryArgs, db: Client) -> dict:
    baby = (
        db.table("babies")
        .select("id,name,gender,birth_date,blood_type,birth_weight_kg,birth_height_cm,medical_notes")
        .eq("id", args.babyId)
        .single()
        .execute()
    ).data
    if not baby:
        return {"error": "Baby not found or not accessible"}

    seven_days = (datetime.utcnow() - timedelta(days=7)).isoformat()
    activities = (
        db.table("baby_activities")
        .select("activity_type, started_at, ended_at, feeding_type, amount_ml, notes")
        .eq("baby_id", baby["id"])
        .gte("started_at", seven_days)
        .order("started_at", desc=True)
        .limit(40)
        .execute()
    ).data

    return {
        "baby": _redact_for_llm(baby),
        "recent_activities": activities,
    }

def _redact_for_llm(baby: dict) -> dict:
    # Send only what the LLM needs. Avoid full birth_date, etc.
    bd = baby.get("birth_date")
    return {
        "first_name": baby["name"],
        "gender": baby.get("gender"),
        "age_months": _months_since(bd),
        "blood_type": baby.get("blood_type"),
        "birth_weight_kg": baby.get("birth_weight_kg"),
        "birth_height_cm": baby.get("birth_height_cm"),
        "medical_notes_excerpt": (baby.get("medical_notes") or "")[:300],
    }
```

The registry exposes JSON schemas to OpenAI exactly as in the OpenAI doc:

```python
# app/services/tools/registry.py
from .get_baby_summary import run as run_get_baby_summary, GetBabySummaryArgs
# ... import others

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_baby_summary",
            "description": "Profile and 7-day activity summary for the user's baby",
            "parameters": GetBabySummaryArgs.model_json_schema(),
        },
    },
    # get_recent_cries, get_weekly_insight, list_health_suggestions, search_community
]

DISPATCH = {
    "get_baby_summary": (GetBabySummaryArgs, run_get_baby_summary),
    # ...
}

async def dispatch(tool_call, db, user):
    cls, fn = DISPATCH[tool_call.name]
    args = cls.model_validate_json(tool_call.arguments)
    return await fn(args, db)
```

Because `db` was built with the user's JWT, **none of these queries can leak data from another family**.

---

## 8. RAG in Python (Supabase pgvector)

Everything in §6 of `CHATBOT_OPENAI_IMPLEMENTATION.md` translates 1:1 into Python.

### 8.1 SQL helper (one-time)

Create the same `match_knowledge_chunks` function in Supabase SQL Editor (as in the OpenAI doc). Both Next.js and Python can call it; Python calls it via PostgREST RPC:

```python
# app/services/retrieval.py
from supabase import Client
from .embeddings import embed_one

async def hybrid_search(db: Client, query: str, ctx, k: int = 8) -> list[dict]:
    emb = await embed_one(query)  # OpenAI text-embedding-3-small
    rpc = db.rpc("match_knowledge_chunks", {
        "query_embedding": emb,
        "query_text": query,
        "match_count": k,
        "locale_filter": ctx.locale,
    }).execute()
    return rpc.data or []
```

### 8.2 Ingestion

The ingestion job (`/v1/ingest`) uses **`admin_client()`** because it needs to write public `knowledge_chunks` and read all public source rows. Keep ingestion logic isolated in `app/services/ingest.py`, behind an admin role check. Never call it from `/v1/chat`.

Sources to ingest (start small, expand):

1. `docs/help/*.md` (authored in Next.js repo; copied or fetched by Python at ingest).
2. Exports of `src/lib/cry-type-guidance.ts` and `src/lib/baby-health-suggestions.ts` (serialize to JSON in Next.js, commit alongside).
3. `blog_posts`, `forum_threads`, `community_resources` — read with admin client, but only insert public-safe content.
4. `expert_kb_documents` (when added).

---

## 9. Streaming (SSE) End-to-End

FastAPI's `StreamingResponse` works perfectly:

```python
# app/routers/chat.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from ..deps import get_user, get_supabase
from ..schemas.chat import ChatRequest
from ..services import orchestrator

router = APIRouter()

@router.post("/v1/chat")
async def chat(req: ChatRequest, user=Depends(get_user), db=Depends(get_supabase)):
    async def event_stream():
        async for chunk in orchestrator.answer_one_turn(req, user, db):
            yield f"data: {chunk.json()}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

Next.js pipes `upstream.body` straight to the browser (see §4.1) — no parsing, no buffering. Client uses `EventSource` or Vercel AI SDK `useChat` pointed at `/api/chat`.

---

## 10. Schema Drift Discipline (small but critical)

Supabase schema lives with Next.js (`src/types/supabase.ts` generated by `supabase gen types`). Python doesn't have generated types automatically. Two clean options:

1. **Trust PostgREST + Pydantic models** (recommended). Define the shape you need per tool in `app/schemas/`. If a column rename breaks a tool, the Pydantic parse fails loudly in tests + telemetry.
2. **Generate Python types**: there are community tools (e.g. `supabase-py-codegen`) but they aren't as polished. Skip unless schema churn is high.

Add a CI step: a tiny Python script that runs `select 1` against each table the bot touches; it fails the build if a referenced column is missing.

---

## 11. Deployment

The FastAPI service is a stateless web app. Easy options:

- **Fly.io / Render / Railway**: simple, autoscaling, region-pinning. Ideal for "1 service, low ops".
- **Vercel** (Python serverless): works for short calls but **not for SSE streaming** in many regions. Avoid.
- **Container on AWS / GCP / Azure**: fine; pin to a region near Supabase to keep DB round-trips fast.
- **Hugging Face Spaces**: cheap for prototypes; not for production traffic.

Production checklist:

- Behind your existing domain (e.g. `https://api.mamtaai.com`).
- HTTPS termination at the platform; `Strict-Transport-Security` header.
- CORS allowlist = your web origin(s) only.
- Rate limits per `user_id` (chat is expensive).
- Structured logs with `request_id`, `user_id`, `model`, latency, tokens.
- Sentry (or equivalent) for exception tracking.
- `/v1/health` for uptime monitoring; **fail closed** if OpenAI or Supabase unreachable.
- Secrets in the platform's secret store; never in the image.

---

## 12. Phased Roadmap (Python-first)

### Phase 0 — Setup (Day 1–2)
- Add the new modules in §3 to your existing Python project (or create `mamtaai-llm/` as a sibling service).
- Add env vars in §4.2.
- Verify JWT decode + RLS read end-to-end with a `GET /v1/health/whoami` that returns `{ user_id, can_read_babies: <count> }`.
- Add minimal `match_knowledge_chunks` SQL function and `knowledge_chunks` table to Supabase.

### Phase 1 — MVP RAG chatbot (Week 1)
- `POST /v1/chat` with streaming.
- One tool: `get_baby_summary`.
- Ingest `docs/help/*.md` only (5–10 docs).
- Pre/post Moderation.
- Next.js: drop in the thin proxy + `<ChatBubble />`.

### Phase 2 — Personalization (Week 2)
- Tools: `get_recent_cries`, `get_weekly_insight`, `list_health_suggestions`.
- Persist `chat_sessions` / `chat_messages`.
- Thumbs ↑/↓ feedback in UI → persisted.

### Phase 3 — Community RAG (Week 3)
- Ingest blog/forum/resources via admin client into `knowledge_chunks`.
- Hybrid search + MMR.
- Citations in UI.

### Phase 4 — Safety hardening (Week 4)
- Custom red-flag classifier (`safety/red_flags.py`).
- Prompt-injection scrubber for retrieved content (`safety/scrubbers.py`).
- Eval harness baseline (200 prompts).

### Phase 5 — Fine-tune v1 (Weeks 5–7)
- `scripts/finetune_prepare.py` builds SFT JSONL from logs (opt-in) + experts.
- `scripts/finetune_submit.py` uploads + starts job.
- Promote by setting `OPENAI_FINETUNED_MODEL` in FastAPI env.
- Eval gates from §13 of the architecture doc.

### Phase 6 — DPO + Multilingual (Week 8+)
- DPO training pairs mined from `chat_messages.feedback`.
- Localize system prompt + 500 examples to Hindi/Urdu.

---

## 13. Honest Trade-offs (don't skip)

| Concern | Mitigation |
|---|---|
| Extra network hop (Next.js → FastAPI) adds 20–80 ms | OK; streaming hides it. Pin FastAPI region near Supabase. |
| JWT forwarding bug = auth break | One small, well-tested module (`app/auth.py`). Integration test: forward a real JWT, expect 200; tamper one byte, expect 401. |
| RLS misconfiguration leaks data | Mandatory: enable RLS policies on every readable table; add a SQL test that runs each RLS policy with two fake users. |
| Service-role accidentally used in user flow | Only one place imports `admin_client()` (ingestion router). Add a lint rule / grep check in CI. |
| Schema drift between TS and Python | Pydantic per-tool models + a CI smoke that queries each table. |
| Cold start on serverless | Use Fly.io/Render with min instances ≥ 1 (cheap). |
| Cost spikes from long contexts | Already mitigated in OpenAI doc (token caps, retrieval k, caches). |
| Two services to monitor | One dashboard with `request_id` correlated between Next.js and FastAPI. |

---

## 14. Verdict

**Yes — this is a good, professional architecture for MamtaAI.**

It is the same shape used by serious products that combine a Next.js front-end with an ML microservice. The two non-negotiables that turn "OK" into "professional":

1. **JWT forwarding + user-scoped Supabase client in Python (§4).** This is the difference between safe-by-default and a security incident waiting to happen. Spend time here.
2. **Service-role isolation (§4.3, §8.2).** Only ingestion uses it. Tools never do.

Get those right and the rest is normal engineering. The Next.js app stays small, the Python ML service can evolve fast, and Supabase stays the single source of truth.

---

## 15. Next Concrete Steps

1. **Confirm RLS** is enabled on `babies`, `baby_parents`, `baby_activities`, `recordings`, `cry_predictions`, `weekly_insights`, `health_suggestions`. If not, write the policies first.
2. Add `app/auth.py` + `app/services/supabase_client.py` and ship a `GET /v1/health/whoami` endpoint to prove the auth + RLS chain works.
3. Create `knowledge_chunks` table and `match_knowledge_chunks` SQL function in Supabase.
4. Implement `POST /v1/chat` with one tool (`get_baby_summary`) and Moderation pre/post.
5. Add the thin Next.js proxy in `src/app/api/chat/route.ts` (§4.1) and a `<ChatBubble />` component inside `DashboardLayout`.

Everything else (more tools, community RAG, fine-tuning) layers cleanly on top.
