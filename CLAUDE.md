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

- `nodeConfig.ts` — **single source of truth for N1-N8.** N2 is an API-only JPS/DID reference with `null` coordinates and must not appear as a physical map pin. N6 is conditional on Decision D1; N7 coordinate/storage remain under reconciliation; N8 is monitoring-only.
- `controllerConfig.ts` — C1 industrial PLC telemetry, events, BOM and redundant-gateway status. C1 controls the arena penstock locally; N8 does not.
- `alertFusion.ts` — `computeAlertLevel()` fuses dh/dt, rainfall, outfall lock-state, DID river stage into L1–L4. `FUSION_THRESHOLDS` holds provisional values; `zinvert_m` and `did_river_alert_m` are `null` (PENDING) and the ladder degrades honestly to 2-of-4 signals.
- `feedConfigs.ts` — borrowed feeds (JPS/DID river + rainfall, MetMalaysia and pending tide forecast). N2 station references are 3015432 / 3015084, with role/API mapping and datum still pending.
- `waterQuality.ts` — continuous N8 channels are NH₃-N and TSS. BOD₅ is a semi-annual lab sample. N6 has no live readings while D1 is open. EQA Std A remains an *advisory* benchmark.
- `mockData.ts` — all demo/mock data lives here, nowhere else. Components must not embed hardcoded readings.
- `../types/index.ts` — shared types. `NodeFlags` documents the meaning of every flag; extend types here, not inline.
- `../i18n/strings.ts` — BM + EN strings for the Public View. Every user-facing Public View string goes through this file; BM is the primary language.

## Coding rules

1. **PENDING is a first-class UI state.** A `null` value means "render a visible pending/unconfigured state", never a fallback number, never an empty chart pretending to be zero. This is a competition-integrity rule, not a style preference.
2. **Caveats travel with figures.** Q_pump 10.2 m³/s is nameplate capacity, not N4 measured flow. N2 thresholds/datum and every N7 area/volume figure remain unresolved.
3. **Three-test filter before adding any feature:** saves lives / verifies the SLB KPI / wins a named judging criterion. Otherwise don't build it.
4. Public View stays glanceable — no operator density, no jargon, no m³. Operator-only concepts (covenants, provenance, confidence flags) never leak into it.
5. **C1 is the local controller.** The dashboard is supervisory/read-only until remote-command authentication, authorisation, interlocks and acknowledgement are approved. Never present N8 as an actuator or penstock controller.
6. New facts/figures enter via `nodeConfig.ts`/`feedConfigs.ts`/`waterQuality.ts` with a source; unverifiable figures get rejected (spec §8), not averaged in.

## Build-out backlog (what's needed next)

Priority order, gated on the demo (30 July) and on pending data:

1. **Wire the JPS/DID InfoBanjir API** — confirm the roles and live endpoints for 3015432 / 3015084, official thresholds and datum, then flip the feeds from `partial` to `live`.
2. **Demo polish for the three demo views** (standing recommendation: SLB-KPI tab, Lock-window forecast, Public View — ~90 s each). Other tabs stay spec-complete, not polished.
3. **Resolve N7 Decision D4** — coordinate, inundated zones, authoritative area/volume, sensor range and placement.
4. **SMS / low-bandwidth fallback** for the Public View (spec'd, not built) — the exact households the project protects.
5. **Complete C1 field design:** actuator, UPS, pump co-location/D2, warning-device quantities, PLC timers/thresholds and audit retention.
6. **On Z_invert survey:** populate `FUSION_THRESHOLDS.zinvert_m`, enabling the outfall lock-state signal → fusion ladder moves from 2-of-4 toward full 4-signal operation.
7. **Parked (do not build unless it clears the three-test filter):** evacuation-point routing on Public View.

## Session checklist

Before committing a change: `npm run build` passes, `npm run lint` passes, no new hardcoded figures outside `src/data/`, PENDING items still render as pending, and both faces still load via the demo switcher.
