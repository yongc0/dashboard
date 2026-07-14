export type AlertLevel = 1 | 2 | 3 | 4

export type Provenance = 'onsite' | 'DID' | 'Met' | 'JPS'

export type NodeId = 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'N7' | 'N8'

export type ControllerId = 'C1' | 'C2'

export type DeploymentStatus = 'installed' | 'conditional' | 'proposed' | 'blocked' | 'not_configured'

export interface NodeFlags {
  locationUnderReview?: boolean  // N1 — project anchor, not confirmed worst bottleneck
  proposed?: boolean
  reportingOnly?: boolean
  pending?: boolean
  conditional?: boolean          // N6 — Decision D1; not currently installed
  arenaStorage?: boolean         // N7 — storage zones/volume still under reconciliation
  waterQuality?: boolean         // N8, plus N6 if Decision D1 reinstates it
  governmentAsset?: boolean      // N5 — existing government retention pond
  datumUnconfirmed?: boolean
  coordinateUnconfirmed?: boolean
  apiOnly?: boolean              // N2 — JPS/DID software integration, never plotted as a project node
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
  deployment: DeploymentStatus
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
  type: 'pluvial' | 'tidal' | 'flow' | 'basin'
  provenance?: Provenance
  deployment: DeploymentStatus
  metrics: TelemetryMetric[]
  waterLevel?: number
  waterLevelMax?: number
  dhdt?: number
  lastContact: Date | null
  confidence: 'good' | 'degraded' | 'warning' | 'stale' | 'pending'
  batteryPct: number
  solarCharging: boolean
  loraUptime: number
}

export interface TelemetryMetric {
  id: string
  label: string
  value: number | string | null
  unit?: string
  status?: 'good' | 'warning' | 'fault' | 'pending'
  note?: string
}

export type PLCMode = 'AUTO' | 'MANUAL_LOCKOUT' | 'EMERGENCY_HOLD' | 'FAULT'
export type GatePosition = 'OPEN' | 'CLOSED' | 'INTERMEDIATE' | 'INVALID'
export type GateCommand = 'OPEN' | 'CLOSE' | 'HOLD' | 'NONE'
export type TransitionState = 'CONFIRMED' | 'TRANSITIONING' | 'INTERLOCK_BLOCKED' | 'TIMEOUT' | 'JAMMED'

export interface ControllerTelemetry {
  controllerId: ControllerId
  name: string
  location: string
  plcClass: string
  deployment: DeploymentStatus
  mode: PLCMode
  command: GateCommand
  confirmedPosition: GatePosition
  transition: TransitionState
  gateSideLevelM: number
  gateSideDhdtMhr: number
  downstreamLevelM: number
  backflowInterlock: boolean
  gateMotorCurrentA: number
  motorJam: boolean
  manualLockout: boolean
  emergencyHold: boolean
  mainsAvailable: boolean
  upsState: 'ONLINE' | 'ON_BATTERY' | 'PENDING'
  plcHealthy: boolean
  telemetryHealthy: boolean
  modbusHealthy: boolean
  lastContact: Date
  programRevision: string
  localLogRetention: string
}

export interface ControllerEvent {
  id: string
  controllerId: ControllerId
  timestamp: Date
  type: string
  message: string
  source: 'PLC_LOCAL' | 'OPERATOR' | 'SYSTEM'
  acknowledged: boolean
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

// Public View languages: Bahasa Melayu (primary), English, Chinese, Tamil —
// the four working languages of the TSM community.
export type LangCode = 'bm' | 'en' | 'zh' | 'ta'

export interface Lang {
  nativeName: string   // language's own name, shown in the selector
  alertTitle: string
  levels: Record<AlertLevel, { label: string; action: string; color: string }>
  callEmergency: string   // tap-to-call 999 button (shown at Level 3+)
  areaLevelPrefix: string // map footer: "This area: Level"
  timeRemaining: string
  timeActionNow: string
  timeEstimatePending: string
  timeEstimatePendingDetail: string
  reportIncident: string
  reportStatus: string
  shareAlert: string
  watchLevel: string
  levelLegend: string
  nowLabel: string
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
