export type AlertLevel = 1 | 2 | 3 | 4

export type Provenance = 'onsite' | 'DID' | 'Met' | 'JPS'

export type NodeId = 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'N7' | 'N8'

export interface NodeFlags {
  locationUnderReview?: boolean  // N1 — project anchor, not confirmed worst bottleneck
  proposed?: boolean             // N5 — inclusion pending SLB decision
  reportingOnly?: boolean        // N6 — environmental logging only, never a flood-control signal
  pending?: boolean              // N2 — no geographic fix yet
  auxiliaryDetention?: boolean   // N7 — tidally-connected wet basin (auxiliary storage)
  releaseControl?: boolean       // N8 — pond-gate release-control node (conditional hold authority)
  governmentAsset?: boolean      // N5 — existing government retention pond
  datumUnconfirmed?: boolean     // N2/N7 — values inherit unconfirmed vertical datum
  approximate?: boolean          // N2 — placeholder position, NOT a confirmed coordinate
}

// Node-specific spec lines shown in the operator popup. caveat renders as a warning.
export interface NodeSpec {
  label: string
  value: string
  caveat?: string
}

export interface NodePin {
  nodeId: NodeId
  label: string
  type: string
  sensorType: string
  lat: number | null   // null = PENDING (N2)
  lng: number | null
  flags: NodeFlags
  provenance: Provenance
  reading: { value: string; unit: string } | null
  lastContact: Date | null
  confidence: 'good' | 'degraded' | 'stale' | 'pending'
  batteryPct?: number
  loraUptime?: number
  specs?: NodeSpec[]    // node-specific engineering parameters (Q_pump, footprint, etc.)
  designNote?: string   // locked design rationale / standing caveat
}

export interface FeedStatus {
  id: string
  name: string
  source: Provenance
  stationId: string | null            // null = PENDING
  waterLevelStationId?: string | null // separate water-level station ID where station has both
  district?: string
  thresholds: {
    normal: number | null       // null = PENDING (from DID official values)
    alert: number | null
    warning: number | null
    danger: number | null
  }
  // 'partial' = station identified but not fully wired / values provisional
  status: 'live' | 'not_configured' | 'partial'
  datumUnconfirmed?: boolean     // thresholds read off hydrograph; datum not confirmed AMSL
  note?: string
  lastReading: { value: number; unit: string; ts: Date } | null
  crossCheckDelta?: number | null  // owned N1 vs DID telemetry delta; null if feed unconnected
}

export interface SensorNode {
  id: string
  nodeId?: NodeId
  name: string
  type: 'fluvial' | 'pluvial' | 'tidal' | 'pump'
  provenance?: Provenance
  waterLevel: number
  waterLevelMax: number
  dhdt: number
  lastContact: Date | null
  confidence: 'good' | 'degraded' | 'warning' | 'stale' | 'pending'
  batteryPct: number
  solarCharging: boolean
  loraUptime: number
}

export interface AlertState {
  level: AlertLevel
  triggeredAt: Date
  signals: string[]
}

export interface ForecastPoint {
  time: string
  level: number
  rainfall: number
  tide: number
}

export interface TideWindow {
  start: string
  end: string
  risk: 'low' | 'medium' | 'high'
}

export interface KPIPoint {
  date: string
  dhdt: number
  threshold: number
  couponAdj: number
}

export interface AvoidedLossEvent {
  date: string
  alertLevel: AlertLevel
  duration: number
  householdsProtected: number
  estimatedDamagesAvoided: number
}

export interface ResidentReport {
  id: string
  timestamp: Date
  location: string
  photo: boolean
  status: 'received' | 'verified' | 'escalated'
  description: string
}

export interface AssetHealth {
  id: string
  name: string
  type: 'pump' | 'gate' | 'generator' | 'sensor'
  status: 'operational' | 'maintenance' | 'fault'
  lastMaintained: Date
  nextMaintenance: Date
}

export interface Lang {
  alertTitle: string
  levels: Record<AlertLevel, { label: string; action: string; color: string }>
  timeRemaining: string
  timeActionNow: string
  timeEstimatePending: string
  timeEstimatePendingDetail: string
  reportIncident: string
  reportStatus: string
  shareAlert: string
  watchLevel: string
  prepare: string
  lastUpdated: string
  currentLevel: string
  sensorLabels: {
    riverStage: string
    rainfallNow: string
    tidalLevel: string
    riseRate: string
    pending: string
  }
  // Modals, buttons, and footer — every Public View string lives here (BM primary)
  areaMap: string
  mapCaption: string
  coordinators: string
  coordinatorChain: string
  coordinatorAutoNote: string
  reportModalTitle: string
  reportPlaceholder: string
  addPhoto: string
  addLocation: string
  attached: string
  cancel: string
  submit: string
  close: string
  reportReceived: string
  sharedWithZoneD: string
  reportStatusTitle: string
  linkCopied: string
  communityCredit: string
  notified: string
  notNotified: string
  acknowledged: string
  waiting: string
  reportStatuses: { received: string; verified: string; escalated: string }
}
