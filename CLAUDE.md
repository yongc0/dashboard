# CLAUDE.md — TSM Dashboard (`dashboard/`)

Dashboard-specific instructions. The current monitoring-system source is `../TSM_Monitoring_System_v11.docx`; `DASHBOARD_RECONCILIATION_V11.md` records how it maps into this dashboard. Read both before changing system facts.

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

- `nodeConfig.ts` — **single source of truth for N1-N8.** Every physical node has `mapStatus: resolved` plus a Revision 11 `siteDesign` block for enclosure, power and maintenance. N2 is API-only with `null` coordinates and never appears as a map pin. Map status is not commissioning status: open sensor, power or calibration work remains visible without making a physical node look geographically unresolved.
- `controllerConfig.ts` — separate local industrial PLCs: C1 controls the arena penstock; C2 controls the single arena sump pump. Revision 11 recommends mains + ≥72 h UPS for C1 and requires mains/genset pump power for C2; both tie-ins remain site enquiries. Neither controller depends on the dashboard or network for actuation.
- `alertFusion.ts` — `computeAlertLevel()` uses the fixed Revision 11-retained L4 3-of-4 vote: N1 rainfall, N1 drain dh/dt, N3 outfall lock/tide-high, and N5/N7 basin dh/dt. N2 and N4 are excluded. Numeric dh/dt thresholds and `zinvertM` remain `null` until the prescribed field-calibration method is completed.
- `feedConfigs.ts` — borrowed feeds (JPS/DID river + rainfall, MetMalaysia and pending tide forecast). N2 station references are 3015432 / 3015084 with official river bands; live API/data-sharing access remains pending.
- `waterQuality.ts` — N6 and N8 continuous channels are NH₃-N and TSS. BOD₅ is a semi-annual laboratory sample at N8 only. Both are monitoring/reporting evidence; N8 may hold routine release, but flood dh/dt overrides. EQA Std A remains an *advisory* benchmark.
- `mockData.ts` — all demo/mock data lives here, nowhere else. Components must not embed hardcoded readings.
- `../types/index.ts` — shared types. `NodeFlags` documents the meaning of every flag; extend types here, not inline.
- `../i18n/strings.ts` — BM + EN strings for the Public View. Every user-facing Public View string goes through this file; BM is the primary language.

## Coding rules

1. **PENDING is a first-class UI state.** A `null` value means "render a visible pending/unconfigured state", never a fallback number, never an empty chart pretending to be zero. This is a competition-integrity rule, not a style preference.
2. **Caveats travel with figures.** Q_pump 10.2 m³/s is nameplate capacity, not N4 measured flow. The N7 17,280 m² footprint, 43,200 m³ gross and ≈37,300 m³ net usable basis are locked; the exact N7 coordinate remains unverified.
3. **Three-test filter before adding any feature:** saves lives / verifies the SLB KPI / wins a named judging criterion. Otherwise don't build it.
4. Public View stays glanceable — no operator density, no jargon, no m³. Operator-only concepts (covenants, provenance, confidence flags) never leak into it.
5. **C1 and C2 are separate local controllers.** C1 owns the penstock's CLOSED/ISOLATE, ADMIT and GRAVITY-RELEASE states; C2 owns sump-pump drawdown. The dashboard is supervisory/read-only. Solar-primary must not be presented as the preferred C1/C2 design; v11 identifies mains-backed power as the resilience basis.
6. **Map status and commissioning status are separate.** All seven physical node locations render as resolved solid markers. N2 remains absent because it is an API feed. Keep pipe surveys, sensor models, calibration, power tie-ins and construction setting-out as engineering notes, not pending map pins.
7. New facts/figures enter via `nodeConfig.ts`/`feedConfigs.ts`/`waterQuality.ts` with a source; unverifiable figures get rejected (spec §8), not averaged in.

## Build-out backlog (what's needed next)

Priority order, gated on the demo (30 July) and on pending data:

1. **Wire the JPS/DID InfoBanjir API** — obtain live/data-sharing access for 3015432 / 3015084, validate payload mapping, then flip the feeds from `partial` to `live`.
2. **Demo polish for the three demo views** (standing recommendation: SLB-KPI tab, Lock-window forecast, Public View — ~90 s each). Other tabs stay spec-complete, not polished.
3. **Verify N7 construction setting-out** — the dashboard uses the documented coordinate as a resolved map position; the exact construction survey, sensor placement and range remain open. Do not reopen the locked storage basis without a newer source.
4. **SMS / low-bandwidth fallback** for the Public View (spec'd, not built) — the exact households the project protects.
5. **Complete C1/C2 field design:** confirm mains tie-ins; C1 actuator, ≥72 h UPS and warning-device quantities; C2 mains/genset pump circuit, vendor curve, motor/propeller selection and wet-well instrumentation; both PLCs' timers and audit retention.
6. **Confirm N3/N4 power tie-ins:** check grid availability at the outfall and obtain DID permission before connecting N4 at the pump station.
7. **Calibrate dh/dt thresholds:** survey Z_invert at N1/N5/N7, collect a full monsoon record, back-calculate for 60-minute lead, validate against December 2021 and approve before entering numeric values.
8. **Parked (do not build unless it clears the three-test filter):** evacuation-point routing on Public View.

## Session checklist

Before committing a change: `npm run build` passes, `npm run lint` passes, no new hardcoded figures outside `src/data/`, PENDING items still render as pending, and both faces still load via the demo switcher.
