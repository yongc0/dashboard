# TSM Flood Monitoring Dashboard

Live monitoring and early-warning dashboard for the Taman Sri Muda (TSM) compound-flood mitigation project — RIFAR Marathon Challenge 2026. Demo target: **30 July 2026**.

## What it is

**Two faces, one data layer:**

- **Public View** — no login, single glanceable screen for residents. Public alert levels 2–4 in plain language (BM/EN/ZH/TA), recommended action, warning-level legend, incident reporting and share-alert. Level 1 maintenance remains operator-only.
- **Operator/Judge Console** — 8 tabs: Overview, Live System, Infrastructure Health, Flood Risk Forecast (incl. lock-window forecast), SLB KPI/Finance, Reports, Community Ops, Scalability.

Revision 11 retains the Level-4 **3-of-4** vote and adds an enclosure, power-supply and maintenance-access basis for every physical node. All seven physical nodes have resolved dashboard map locations; N2 remains off-map as a JPS/DID API-only reference. Separate C1 and C2 PLCs control the arena penstock and sump pump locally, with mains-backed power now identified as the resilient design basis. Unconfirmed engineering inputs still render as **PENDING** — no invented numbers anywhere.

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
| `src/data/nodeConfig.ts` | Single source of truth for nodes N1–N8, map status and v11 site-design assumptions |
| `src/data/controllerConfig.ts` | Separate C1 penstock and C2 sump-pump PLCs, interlocks, events and gateway status |
| `src/data/alertFusion.ts` | L1–L4 alert ladder |
| `src/data/feedConfigs.ts` | Borrowed feeds (DID, MetMalaysia) |
| `src/data/waterQuality.ts` | N6 probe-only monitoring + N8 continuous/semiannual-lab WQ data |
| `src/data/mockData.ts` | All demo data |
| `src/i18n/strings.ts` | BM/EN strings |

## Before contributing

Read `CLAUDE.md` (this folder) for coding rules and the build-out backlog. The latest reconciliation is in `DASHBOARD_RECONCILIATION_V11.md`, based on `../TSM_Monitoring_System_v11.docx`.
