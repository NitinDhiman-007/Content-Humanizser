# Content Humanizer Dashboard

A runnable local dashboard with FastAPI, SQLite, Next.js and two JSON editor panels. The authoritative 100 rule document is included at the project root.

## Important scope and limitations

Local mode does **not** fully rewrite prose like a generative language model. It implements narrow deterministic edits, extracts optional comparison or process infographic specifications, counts visible words, checks exact URLs and numeric anchors, and flags editorial issues. It parses and checks all 100 rule IDs, 30 requirement IDs and 27 acceptance test IDs, but only a subset is automatically implementable. The result reports its applied rules and limited automated coverage. No detector or plagiarism checks are run.

External mode optionally calls a **remote third party service** through the `humanize_ai_text` SDK. Installing the SDK does not make rewriting local. Its public interface cannot receive the Markdown rulebook directly. The README in that repository documents an API key and API endpoint, and its implementation uses urllib HTTP calls. Obtain the provider's current valid key and endpoint directly from the provider before enabling external mode. External processing sends blog text outside your machine. Its SDK also does not expose an explicit per-request timeout, so use a hardened HTTP client before production deployments.

This is a local development MVP. SQLite results persist across reloads and server restarts. Jobs interrupted by a backend restart are marked failed with a clear retry message rather than silently running forever. BackgroundTasks is not a durable job queue; for multiple workers or production use Celery/RQ and a proper broker, add authentication, access control, data retention and encryption as required. Monaco Editor may load its worker/runtime from a CDN depending on its default loader configuration, so this is not guaranteed to be entirely offline in the browser.

## Start backend

From the project root:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Optional remote provider:

```bash
pip install -r requirements-external.txt
# Set HUMANIZE_AI_TEXT_API_KEY in your operating system environment.
```

To use the external provider from the two screen interface, set `NEXT_PUBLIC_HUMANIZER_MODE=external` in `dashboard/.env.local` and configure the backend API key. Restart the Next.js server after changing public environment variables. The first screen deliberately has no mode selector.

The API starts at http://localhost:8000. Open http://localhost:8000/docs for its interactive documentation. SQLite is stored in backend/jobs.db by default.

## Start frontend

Open another terminal from the project root:

```bash
cd dashboard
npm install
# Copy .env.example to .env.local if your backend URL is different.
npm run dev
```

Visit http://localhost:3000 and paste a blog. Click the button to create a job and navigate to the result page. The left panel displays the unchanged original in valid JSON. The right displays the actual result or a real error. Refreshing loads persisted job records.

## Tests

```bash
cd backend
python -m pytest tests -v
cd ../dashboard
npm run typecheck
npm run build
```

These commands must be run on your target machine if dependency installation is unavailable in the current environment. Test a real remote account separately and never commit a credential to this repository.

## API contracts

* POST `/api/jobs` accepts `original_text`, optional `mode`, optional `seo_keywords`.
* GET `/api/jobs/{job_id}` returns status and original content immediately and adds `result` when done.
* GET `/api/jobs/{job_id}/result` returns the result after completion, otherwise HTTP 409.

### Plagiarism & Similarity Checker contracts

* POST `/api/jobs/{job_id}/plagiarism` accepts `check_mode` (`local` or `external`), `include_revision_comparison` (boolean), and `external_consent` (boolean). Returns check ID and initial status.
* GET `/api/jobs/{job_id}/plagiarism` returns current checking status and completed report when ready.
* GET `/api/jobs/{job_id}/plagiarism/report` returns completed `PlagiarismReport` with similarity percentage, matched sources, passage offsets, and review flags.
* GET `/api/references` lists all authorized reference documents in the local SQLite collection.
* POST `/api/references` registers a new reference document via JSON payload (`title`, `content`, optional `source_url`).
* POST `/api/references/upload` multipart upload endpoint supporting `.txt`, `.md`, and `.pdf` documents with safe text extraction.
* DELETE `/api/references/{reference_id}` deletes a reference document.

### Plagiarism checking modes

* **Internal Similarity (Local Reference Collection)**: Compares final humanized text against an authorized collection of reference documents in SQLite using sentence extraction, sequence matching, and interval merging. Accurately calculates `(matched characters / assessed characters) * 100`. Returns `"Not checked: No reference documents available"` if no documents are uploaded.
* **External Provider**: Adapter interface for licensed external plagiarism verification. Strictly disabled until valid credentials and an official contract are configured in environment variables (`PLAGIARISM_API_KEY`, `PLAGIARISM_API_URL`). Requires explicit user consent before any content leaves the application.

## Files

`backend/app/pipeline.py` implements conservative local transformations, simple infographic suggestions, word counting and audits. `backend/app/rules_catalog.py` parses the authoritative rulebook and reports limited automated coverage. `backend/app/job_store.py` stores jobs in SQLite. `backend/app/plagiarism/` contains the similarity engine, document parser, local checker, external provider adapter, and SQLite store. `dashboard/app/page.tsx` is the minimal input screen. `dashboard/app/results/[jobId]/page.tsx` is the dual editor workspace with plagiarism inspection.

The supplied sample blog is in `sample_blog.md` for local testing. No sample response is substituted for actual processing.

