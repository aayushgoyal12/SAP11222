# PRD — SAP Finance Export Reconciliation MVP

## Original problem statement
A web-based finance-operations tool that accepts SAP-exported CSV/XLSX files and reconciles them with GSTR-2B or purchase-register data. Not replacing SAP, no direct SAP connection in v1. Upload → Map Columns → Reconcile → Review Exceptions → Export. Match on GSTIN, invoice number, date, taxable value, tax amount; detect matched, missing, amount-mismatch, duplicate, invalid; configurable tolerance & date formats; review queue with source/comparison/difference/reason; full + exception-only Excel; demo mode with fictional data; clear disclaimer (review assistance only, not tax advice or SAP posting). Dashboard cards: Total records, Matched, Missing in GSTR-2B, Amount mismatches, Duplicates, Records requiring review. Immediate next action: add "SAP Export Reconciliation" mode, one fictional SAP CSV/XLSX sample, first working path SAP export + GSTR-2B → exception Excel report. (Full brief incl. phases 1–4 and open decisions provided by user.)

## Defaults chosen (user skipped questions)
No auth; comparison = GSTR-2B or purchase register; tolerance ₹1 default (configurable); dark ops UI; 7-day retention.

## Architecture
- Backend FastAPI: `server.py` (endpoints), `recon.py` (canonical schema + aliases, sheet/header detection, normalisation, matching, Excel builder), `demo_data.py` (fictional SAP B1 AP export + GSTR-2B).
- MongoDB: jobs (meta, mapping, settings, summary, assumptions, audit events), job_files (parsed rows), job_results, mapping_templates. TTL index on expires_at (RETENTION_DAYS).
- Frontend React (JS) + shadcn: Home (mode selector, demo, recent jobs), Wizard (5 steps).

## Implemented (2026-10-10)
- Upload CSV/XLSX, auto sheet & header-row detection (incl. multi-row headers), 15MB / 50k-row limits
- Auto column mapping with confidence, manual override, save/apply mapping templates
- Validation (GSTIN format, blanks, dates, numbers), duplicates per file, pairing on GSTIN + normalised invoice no, tolerance, date mismatch, missing both sides, "possible match" hints, assumptions list
- Review queue: KPI cards, filters, search, row detail with diffs, reviewer notes / mark reviewed
- Excel: exception-only and full reports (summary, disclaimer, assumptions, per-status sheets)
- Demo mode + downloadable fictional samples; delete job now; audit events
- Tested: backend 25/25, frontend flows 100%

## Iteration 2 (2026-10-10) — Real Layout Pilot + light theme
- 4 sanitized fictional SAP layouts (pilot_layouts.py): S/4 GST register, B1 query (MM/DD), ECC technical (STCD3/XBLNR/BLDAT/HWBAS/WMWST, trailing minus), S/4 Fiori (Indian digit grouping). CLI: `python backend/pilot_run.py`
- Baseline: all 4 blocked by unrecognised columns -> aliases added; now 27/37 matched on every layout
- "Ignore amount sign" option + opposite-sign hint; "Columns not used" chips in mapping; pilot downloads on Upload step
- UI switched to white/light professional theme. Tested: backend 35/35, frontend 100%

## Not done / deviations
- Frontend is JavaScript, not TypeScript; no object storage (parsed rows in MongoDB with TTL); no auth/workspaces/billing (Phase 4)

## Backlog
- P1: Pilot hardening with 3–5 real sanitized SAP layouts; accuracy/manual-correction metrics
- P1: Auth + project workspaces; object storage for original files
- P2: Purchase-register sample, GSTIN checksum validation, fuzzy invoice matching, billing
