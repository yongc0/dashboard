# CLAUDE.md — TSM Dashboard (`dashboard/`)

Dashboard-specific instructions. The root `../CLAUDE.md` holds project context (thesis, locked facts, judging criteria); `../TSM_Dashboard_Upgrade_Spec.md` is the source of truth for every LOCKED/PENDING item — **read it before any change**.

## Stack & commands

React 19 + TypeScript 6 + Vite 8 + Tailwind 3. Leaflet/react-leaflet (maps), Recharts (charts), lucide-react (icons), date-fns. Lint is oxlint, not eslint.

- `npm run dev` — local dev
- `npm run build` — `tsc -b && vite build` (must pass typecheck)
- `npm run lint` — oxlint
- Deploy: `dist/` is a Vercel project (`dist/.vercel/project.json`). After a build, redeploy from `dist/`.

No test framework is set up. Verification = `npm run build` + `npm run lint` + visual check in dev.

## Architecture — two faces, one data layer

`src/App.tsx` (34 lines) toggles between the two faces with a fixed demo-switcher pill. No router in use (react-router-dom is installed but unused — don't add routes unless a real need appears).

| Face | File | Audience | Design constraint |
|---|---|---|---|
| Public View | `src/components/public/PublicView.tsx` | B40 residents, RT/RW, surau | Glanceable, single screen, no login, bilingual, low-bandwidth |
| Operator Console | `src/components/operator/OperatorConsole.tsx` | Operator, bond investor, judges | Dense, tabbed, audit-ready |

Operator tabs (`src/components/operator/tabs/`): OverviewTab, LiveSystemTab, InfraHealthTab, FloodRiskTab, SLBKPITab, ReportsTab, CommunityOpsTab, ScalabilityTab. Each tab is a self-contained component importing from `src/data/`.

Maps: `src/components/map/NodeMap.tsx` (operator, per-node popups with specs/caveats) and `PublicMap.tsx` (public, simplified).

## Data layer (`src/data/`) — where all facts live

- `nodeConfig.ts` — **single source of truth for all 8 nodes.** Coordinates are EXACT, do not adjust. Each node carries `flags`, `specs[]` (with `caveat` fields that render as warnings), and `designNote`. N6 (discharge compliance, reporting-only) and N8 (pond-gate release control) are distinct nodes — never merge/rename/overwrite either.
- `alertFusion.ts` — `computeAlertLevel()` fuses dh/dt, rainfall, outfall lock-state, DID river stage into L1–L4. `FUSION_THRESHOLDS` holds provisional values; `zinvert_m` and `did_river_alert_m` are `null` (PENDING) and the ladder degrades honestly to 2-of-4 signals.
- `feedConfigs.ts` — borrowed feeds (DID InfoBanjir river + rainfall, MetMalaysia). Station IDs `null` = PENDING; status renders `not_configured`/`partial`. Never show fake numbers.
- `waterQuality.ts` — N6/N8 parameters: NH₃-N, BOD, TSS **only**. MSMA Table 1.4 design basis; EQA Std A is an *advisory* benchmark and must keep its caveat.
- `mockData.ts` — all demo/mock data lives here, nowhere else. Components must not embed hardcoded readings.
- `../types/index.ts` — shared types. `NodeFlags` documents the meaning of every flag; extend types here, not inline.
- `../i18n/strings.ts` — BM + EN strings for the Public View. Every user-facing Public View string goes through this file; BM is the primary language.

## Coding rules

1. **PENDING is a first-class UI state.** A `null` value means "render a visible pending/unconfigured state", never a fallback number, never an empty chart pretending to be zero. This is a competition-integrity rule, not a style preference.
2. **Caveats travel with figures.** Q_pump 10.2 m³/s (nameplate, not head-derated), N2 thresholds (datum unconfirmed), N7 storage ≈33,700 m³ (provisional, inherits datum caveat) — wherever these display, the caveat displays.
3. **Three-test filter before adding any feature:** saves lives / verifies the SLB KPI / wins a named judging criterion. Otherwise don't build it.
4. Public View stays glanceable — no operator density, no jargon, no m³. Operator-only concepts (covenants, provenance, confidence flags) never leak into it.
5. N8 gating logic is state-machine: auto-suspends at Alert Level ≥3, human-in-the-loop during routine ops only. Its timeout/fallback behaviour is PENDING — render as an open decision, do not invent a default.
6. New facts/figures enter via `nodeConfig.ts`/`feedConfigs.ts`/`waterQuality.ts` with a source; unverifiable figures get rejected (spec §8), not averaged in.

## Build-out backlog (what's needed next)

Priority order, gated on the demo (30 July) and on pending data:

1. **Wire real DID InfoBanjir feed** — capture the water-level station ID (DID portal renders via client-side JS; the real path is the underlying JSON XHR endpoint). Flip `feedConfigs.ts` `did_river` from `partial` to `live`. Note DID terms restrict commercial republication — screenshot-and-cite is fine for the competition.
2. **Demo polish for the three demo views** (standing recommendation: SLB-KPI tab, Lock-window forecast, Public View — ~90 s each). Other tabs stay spec-complete, not polished.
3. **N7 live level-vs-rim signal** — freeboard is not constant; N7 needs its own level display rather than assumed-full storage.
4. **SMS / low-bandwidth fallback** for the Public View (spec'd, not built) — the exact households the project protects.
5. **On datum confirmation (LUAS/DID reply):** update N2 thresholds display, N7 freeboard math, and remove `datumUnconfirmed` flags — one change, three places.
6. **On Z_invert survey:** populate `FUSION_THRESHOLDS.zinvert_m`, enabling the outfall lock-state signal → fusion ladder moves from 2-of-4 toward full 4-signal operation.
7. **Parked (do not build unless it clears the three-test filter):** evacuation-point routing on Public View.

## Session checklist

Before committing a change: `npm run build` passes, `npm run lint` passes, no new hardcoded figures outside `src/data/`, PENDING items still render as pending, and both faces still load via the demo switcher.
