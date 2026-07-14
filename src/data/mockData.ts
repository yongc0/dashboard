import { subHours, subDays, subMinutes, addHours, format } from 'date-fns'
import type {
  SensorNode, AlertState, ForecastPoint, KPIPoint,
  AvoidedLossEvent, ResidentReport, AssetHealth, TideWindow
} from '../types'
import { computeAlertLevel } from './alertFusion'

// ─── Revision 7 onsite telemetry ─────────────────────────────────────────────
// N2 is deliberately absent: it is a JPS/DID API feed, not a physical node.
export const RAINFALL_N1_MMHR = 34
export const RAINFALL_N5_MMHR: number | null = null // N5 is not yet instrumented
export const RAINFALL_MMHR = Math.max(RAINFALL_N1_MMHR, RAINFALL_N5_MMHR ?? -Infinity)

export const sensors: SensorNode[] = [
  {
    id: 'N1',
    nodeId: 'N1',
    name: 'N1 — Rain Gauge, TSM (Pluvial)',
    type: 'pluvial',
    provenance: 'onsite',
    deployment: 'installed',
    metrics: [
      { id: 'rainfall', label: 'Rain intensity', value: RAINFALL_N1_MMHR, unit: 'mm/hr', status: 'warning' },
      { id: 'drain_level', label: 'Drain level', value: 0.34, unit: 'm', status: 'good' },
      { id: 'drain_dhdt', label: 'Drain rise rate', value: 0.08, unit: 'm/hr', status: 'good' },
    ],
    waterLevel: 0.34,
    waterLevelMax: 0.8,
    dhdt: 0.08,
    lastContact: new Date(),
    confidence: 'good',
    batteryPct: 92,
    solarCharging: true,
    loraUptime: 100,
  },
  {
    id: 'N3',
    nodeId: 'N3',
    name: 'N3 — Water Gate & Pump House (Tidal/Outfall)',
    type: 'tidal',
    provenance: 'onsite',
    deployment: 'installed',
    metrics: [
      { id: 'radar_level', label: 'Radar level', value: 3.1, unit: 'm', status: 'good' },
      { id: 'pressure_level', label: 'Pressure level', value: 3.08, unit: 'm', status: 'good' },
      { id: 'sensor_delta', label: 'Sensor delta', value: 0.02, unit: 'm', status: 'good', note: 'Fault tolerance PENDING' },
      { id: 'dhdt', label: 'Validated rise rate', value: 0.22, unit: 'm/hr', status: 'warning' },
    ],
    waterLevel: 3.1,
    waterLevelMax: 4.2,
    dhdt: 0.22,
    // Stale: last contact 8 min ago — exceeds 5-min alert threshold
    lastContact: subMinutes(new Date(), 8),
    confidence: 'stale',
    batteryPct: 74,
    solarCharging: false,
    loraUptime: 96.1,
  },
  {
    id: 'N4',
    nodeId: 'N4',
    name: 'N4 — Pump Station Flow-Anomaly Node',
    type: 'flow',
    provenance: 'onsite',
    deployment: 'blocked',
    metrics: [
      { id: 'relative_flow', label: 'Relative flow', value: null, unit: '% baseline', status: 'pending' },
      { id: 'flow_anomaly', label: 'Blockage/anomaly', value: 'PENDING SENSOR', status: 'pending', note: 'Pipe diameter/material required' },
    ],
    lastContact: null,
    confidence: 'pending',
    batteryPct: 0,
    solarCharging: false,
    loraUptime: 0,
  },
  {
    id: 'N5',
    nodeId: 'N5',
    name: 'N5 — Retention Pond Level + Spatial Rain Gauge',
    type: 'basin',
    provenance: 'onsite',
    deployment: 'proposed',
    metrics: [
      { id: 'pond_level', label: 'Pond level', value: null, unit: 'm', status: 'pending' },
      { id: 'rainfall', label: 'Rain intensity', value: null, unit: 'mm/hr', status: 'pending', note: 'Second gauge confirmed; installation pending' },
    ],
    lastContact: null,
    confidence: 'pending',
    batteryPct: 0,
    solarCharging: false,
    loraUptime: 0,
  },
]

// Water-quality state lives in ./waterQuality.ts. N6 is conditional on D1 and
// N8 is monitoring-only; C1 owns local penstock control.

// Node lookups by ID — never by array index (ordering is not a contract).
export const getSensor = (nodeId: string) => sensors.find(s => s.nodeId === nodeId)
const n3 = getSensor('N3')!

// ─── Alert state (computed from fusion) ──────────────────────────────────────
const fusionResult = computeAlertLevel({
  dhdt: n3.dhdt ?? null,        // N3 validated rate of rise
  rainfallN1: RAINFALL_N1_MMHR,
  rainfallN5: RAINFALL_N5_MMHR,
  tidalLevel: n3.waterLevel ?? null,
  tidalSensorValid: true,       // demo pair agrees; tolerance still PENDING
  didRiverLevel: null,          // DID feed not configured
})

// ─── Derived system mode ──────────────────────────────────────────────────────
// Honest headline for the console: how many of the 4 signal nodes are reporting,
// which are stale, which feeds are pending. Derived from sensors — never hardcoded.
export function getSystemMode() {
  const installed = sensors.filter(s => s.deployment === 'installed')
  const reporting = installed.filter(s => s.lastContact !== null)
  const stale = installed.filter(s =>
    s.lastContact !== null && (Date.now() - s.lastContact.getTime()) / 60000 > 5)
  const pending = sensors.filter(s => s.deployment !== 'installed')
  const reduced = stale.length > 0 || pending.length > 0
  return {
    reduced,
    reportingCount: reporting.length,
    totalCount: installed.length,
    staleIds: stale.map(s => s.nodeId ?? s.id),
    pendingIds: pending.map(s => s.nodeId ?? s.id),
  }
}

export const CURRENT_ALERT_LEVEL = fusionResult.level
export const fusionState = fusionResult

export const alertState: AlertState = {
  level: fusionResult.level,
  triggeredAt: subHours(new Date(), 1.5),
  signals: fusionResult.signals
    .filter(s => s.active)
    .map(s => `${s.label}: ${s.value}`),
}

// ─── Historical + forecast data ───────────────────────────────────────────────
export const pondHistory = Array.from({ length: 25 }, (_, i) => {
  const base = 1.4
  const wave = Math.sin((i / 24) * Math.PI * 3) * 0.6
  const trend = i > 18 ? (i - 18) * 0.08 : 0
  return {
    time: format(subHours(new Date(), 24 - i), 'HH:mm'),
    level: +(base + wave + trend + Math.random() * 0.05).toFixed(2),
    rainfall: i > 16 ? Math.max(0, 25 + (i - 16) * 4 + Math.random() * 8) : Math.random() * 5,
  }
})

export const forecast72hr: ForecastPoint[] = Array.from({ length: 73 }, (_, i) => {
  const now = new Date()
  const tideCycle = Math.sin((i / 12.4) * Math.PI * 2) * 1.8 + 2.0
  const rainfallSpike = i < 8 ? 35 - i * 2 : i > 48 ? Math.random() * 10 : Math.random() * 8
  const levelTrend = i < 6 ? 2.84 + i * 0.08 : i < 12 ? 3.32 - (i - 6) * 0.05 : 2.9 + Math.sin(i / 10) * 0.3
  return {
    time: format(addHours(now, i), i % 24 === 0 ? 'EEE HH:mm' : 'HH:mm'),
    level: +Math.max(0, levelTrend + Math.random() * 0.1).toFixed(2),
    rainfall: +Math.max(0, rainfallSpike).toFixed(1),
    tide: +tideCycle.toFixed(2),
  }
})

export const tideWindows: TideWindow[] = [
  { start: format(addHours(new Date(), 2), 'HH:mm'), end: format(addHours(new Date(), 5), 'HH:mm'), risk: 'high' },
  { start: format(addHours(new Date(), 14.2), 'HH:mm'), end: format(addHours(new Date(), 17.2), 'HH:mm'), risk: 'medium' },
  { start: format(addHours(new Date(), 26.5), 'HH:mm'), end: format(addHours(new Date(), 29.5), 'HH:mm'), risk: 'low' },
]

// SLB covenant semantics: HIGHER ratio = better performance.
// ≥ 0.95 → coupon on rate (adj 0) · 0.85–0.95 → +25 bps step-up · < 0.85 → +50 bps.
export const kpiTrend: KPIPoint[] = Array.from({ length: 90 }, (_, i) => {
  const d = subDays(new Date(), 89 - i)
  // Mid-series dip (day ~35–55) demonstrates the step-up mechanism; otherwise on covenant.
  const dip = i > 35 && i < 55 ? 0.09 * Math.sin(((i - 35) / 20) * Math.PI) : 0
  const ratio = +(0.965 + Math.sin(i / 9) * 0.012 - dip).toFixed(3)
  const coupon = ratio >= 0.95 ? 0 : ratio >= 0.85 ? 0.25 : 0.5
  return {
    date: format(d, 'MMM d'),
    dhdt: ratio,
    threshold: 0.95,
    couponAdj: coupon,
  }
})

export const avoidedLossEvents: AvoidedLossEvent[] = [
  { date: '2026-03-12', alertLevel: 4, duration: 6, householdsProtected: 2847, estimatedDamagesAvoided: 4_200_000 },
  { date: '2026-04-08', alertLevel: 3, duration: 3, householdsProtected: 1_240, estimatedDamagesAvoided: 890_000 },
  { date: '2026-05-21', alertLevel: 3, duration: 4, householdsProtected: 1_580, estimatedDamagesAvoided: 1_150_000 },
  { date: '2026-06-14', alertLevel: 4, duration: 8, householdsProtected: 3_100, estimatedDamagesAvoided: 5_800_000 },
  { date: '2026-06-29', alertLevel: 3, duration: 2, householdsProtected: 980, estimatedDamagesAvoided: 620_000 },
]

export const residentReports: ResidentReport[] = [
  { id: 'R001', timestamp: subHours(new Date(), 0.5), location: 'Jalan Sri Muda 3', photo: true, status: 'verified', description: 'Air masuk ke rumah, paras 20cm' },
  { id: 'R002', timestamp: subHours(new Date(), 0.8), location: 'Blok C, Lorong 7', photo: false, status: 'received', description: 'Longkang tersumbat, air meningkat' },
  { id: 'R003', timestamp: subHours(new Date(), 1.2), location: 'Jalan Sri Muda 8', photo: true, status: 'escalated', description: 'Pokok tumbang, jalan disekat' },
  { id: 'R004', timestamp: subHours(new Date(), 2.1), location: 'Surau Al-Hidayah', photo: false, status: 'verified', description: 'Kawasan letak kereta banjir' },
]

export const assets: AssetHealth[] = [
  { id: 'p1', name: 'Main Pump A', type: 'pump', status: 'operational', lastMaintained: subDays(new Date(), 14), nextMaintenance: addHours(new Date(), 24 * 76) },
  { id: 'p2', name: 'Main Pump B', type: 'pump', status: 'operational', lastMaintained: subDays(new Date(), 7), nextMaintenance: addHours(new Date(), 24 * 83) },
  { id: 'g1a', name: 'Flap Gate 1', type: 'gate', status: 'operational', lastMaintained: subDays(new Date(), 30), nextMaintenance: addHours(new Date(), 24 * 60) },
  { id: 'g1b', name: 'Flap Gate 2', type: 'gate', status: 'maintenance', lastMaintained: subDays(new Date(), 5), nextMaintenance: addHours(new Date(), 24 * 2) },
  { id: 'gen', name: 'Backup Generator', type: 'generator', status: 'operational', lastMaintained: subDays(new Date(), 21), nextMaintenance: addHours(new Date(), 24 * 69) },
  { id: 's-N1', name: 'N1 Rain Gauge', type: 'sensor', status: 'operational', lastMaintained: subDays(new Date(), 45), nextMaintenance: addHours(new Date(), 24 * 45) },
  { id: 's-N3', name: 'N3 Tidal Node', type: 'sensor', status: 'fault', lastMaintained: subDays(new Date(), 60), nextMaintenance: new Date() },
]

export const solarStats = {
  instantKW: 4.2,
  todayKWh: 18.6,
  cumulativeMWh: 14.3,
  nemCredits: 2847,
  revenueToDate: 4_268,
  proFormaRevenue: 5_200,
}

export const multiSiteTemplates = [
  { name: 'Klang', state: 'Selangor', status: 'Feasibility study', risk: 'High' },
  { name: 'Temerloh', state: 'Pahang', status: 'Proposal stage', risk: 'High' },
  { name: 'Kota Tinggi', state: 'Johor', status: 'Interested', risk: 'Medium' },
  { name: 'Batu Pahat', state: 'Johor', status: 'Interested', risk: 'Medium' },
]
