# TSM Flood Monitoring Dashboard

Live monitoring and early-warning dashboard for the Taman Sri Muda (TSM) compound-flood mitigation project — RIFAR Marathon Challenge 2026. Demo target: **30 July 2026**.

## What it is

**Two faces, one data layer:**

- **Public View** — no login, single glanceable screen for residents. Alert level 1–4 in plain language (BM/EN), recommended action, "time you have" indicator, incident reporting, share-alert.
- **Operator/Judge Console** — 8 tabs: Overview, Live System, Infrastructure Health, Flood Risk Forecast (incl. lock-window forecast), SLB KPI/Finance, Reports, Community Ops, Scalability.

The system fuses validated **dh/dt (rate of rise)**, either-gauge rainfall, tidal condition and the JPS/DID API reference. A separate C1 industrial PLC controls the arena penstock locally; the cloud dashboard is supervisory. Unconfirmed parameters render as **PENDING** — no invented numbers anywhere.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build → dist/
npm run lint     # oxlint
```

Deploy: `dist/` is wired to Vercel (`dist/.vercel/project.json`).

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind 3 · Leaflet (maps) · Recharts (charts) · lucide-react · date-fns · oxlint.

## Where things live

| Path | Purpose |
|---|---|
| `src/App.tsx` | Face switcher (Public ↔ Operator) |
| `src/components/public/` | Public View |
| `src/components/operator/` | Console + `tabs/` |
| `src/components/map/` | Leaflet maps (operator + public) |
| `src/data/nodeConfig.ts` | Single source of truth for nodes N1–N8 |
| `src/data/controllerConfig.ts` | C1 PLC, interlocks, events and gateway status |
| `src/data/alertFusion.ts` | L1–L4 alert ladder |
| `src/data/feedConfigs.ts` | Borrowed feeds (DID, MetMalaysia) |
| `src/data/waterQuality.ts` | Conditional N6 decision + N8 continuous/lab WQ data |
| `src/data/mockData.ts` | All demo data |
| `src/i18n/strings.ts` | BM/EN strings |

## Before contributing

Read `CLAUDE.md` (this folder) for coding rules and the build-out backlog, and `../TSM_Dashboard_Upgrade_Spec.md` — the source of truth marking every item LOCKED or PENDING.
