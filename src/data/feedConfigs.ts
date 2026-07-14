import type { FeedStatus } from '../types'

// External borrowed feeds. N2 is a software/API integration and has no map pin.
// Never show fake numbers — render 'not_configured' state until wired.

export const feedConfigs: FeedStatus[] = [
  {
    id: 'did_river',
    name: 'DID InfoBanjir — Sg. Klang di Taman Sri Muda',
    source: 'DID',
    stationId: '3015432',
    waterLevelStationId: '3015432',
    district: 'Klang, Selangor',
    thresholds: {
      // Provisional — read off the official hydrograph by eye (±0.1 m), DATUM UNCONFIRMED.
      normal: 2.8,
      alert: 4.4,
      warning: 4.7,
      danger: 5.0,
    },
    status: 'partial',
    datumUnconfirmed: true,
    note: 'JPS/DID API call only — no physical N2 project node. Station 3015432 is listed in Revision 7; its role/API mapping, official metadata and datum still require confirmation.',
    lastReading: null,
    crossCheckDelta: null,
  },
  {
    id: 'did_rain',
    name: 'DID Rainfall Telemetry — Sg. Klang di Taman Sri Muda',
    source: 'DID',
    stationId: '3015084',             // CONFIRMED via DID Public InfoBanjir (Selangor→Klang→TSM)
    district: 'Klang, Selangor',
    thresholds: {
      normal: null,
      alert: null,
      warning: null,
      danger: null,
    },
    status: 'partial',
    note: 'Rainfall station ID 3015084 confirmed; live telemetry/cross-check not yet wired. Cross-check: compare against N1 onsite; if delta > 20% raise a data-integrity flag.',
    lastReading: null,
    crossCheckDelta: null,
  },
  {
    id: 'met_forecast',
    name: 'MetMalaysia / JPS 72hr Rainfall Forecast',
    source: 'Met',
    stationId: null,        // PENDING: API endpoint / key configuration
    district: 'Lembah Klang',
    thresholds: {
      normal: null,
      alert: null,
      warning: null,
      danger: null,
    },
    status: 'not_configured',
    lastReading: null,
  },
  {
    id: 'tide_forecast',
    name: 'Published Tide Forecast — Automated Drawdown Input',
    source: 'JPS',
    stationId: null,
    district: 'Klang',
    thresholds: { normal: null, alert: null, warning: null, danger: null },
    status: 'not_configured',
    note: 'Revision 7 F4 input for the future Level-2 automated drawdown rule. Source, thresholds and control sequence remain PENDING.',
    lastReading: null,
  },
]

// DID official rainfall-intensity categories (citable). Used to label N1/DID rainfall readings.
export const DID_INTENSITY = [
  { label: 'Light', range: '1–10 mm/hr', min: 1, max: 10, color: '#16a34a' },
  { label: 'Moderate', range: '11–30 mm/hr', min: 11, max: 30, color: '#ca8a04' },
  { label: 'Heavy', range: '31–60 mm/hr', min: 31, max: 60, color: '#ea580c' },
  { label: 'Very Heavy', range: '> 60 mm/hr', min: 60, max: Infinity, color: '#dc2626' },
]

export function classifyIntensity(mmhr: number) {
  return DID_INTENSITY.find(c => mmhr >= c.min && mmhr <= c.max) ?? DID_INTENSITY[0]
}
