import type { AlertLevel } from '../types'

// Provisional thresholds — PENDING where not confirmed from field survey.
// Z_invert and DID station values must be replaced when confirmed.
export const FUSION_THRESHOLDS = {
  dhdt_mhr: 0.15,          // m/hr — provisional; inherits from bond KPI definition
  rainfall_mmhr: 30,        // mm/hr — provisional; replace with DID official value
  zinvert_m: null as number | null,         // PENDING field survey
  did_river_alert_m: null as number | null, // PENDING DID station config
}

export interface FusionSignal {
  id: string
  label: string
  active: boolean
  value: string
  threshold: string
  pending: boolean
  provenance: string
}

export interface FusionResult {
  level: AlertLevel
  signals: FusionSignal[]
  pendingSignals: string[]
  note: string
}

export function computeAlertLevel(inputs: {
  dhdt: number | null           // from N3/N4 onsite
  rainfall: number | null       // mm/hr from N1 onsite
  tidalLevel: number | null     // from N3 onsite
  didRiverLevel: number | null  // null = feed not configured
}): FusionResult {
  const signals: FusionSignal[] = [
    {
      id: 'dhdt',
      label: 'Rate of rise dh/dt',
      active: inputs.dhdt !== null && FUSION_THRESHOLDS.dhdt_mhr !== null
        ? inputs.dhdt > FUSION_THRESHOLDS.dhdt_mhr
        : false,
      value: inputs.dhdt !== null ? `${inputs.dhdt.toFixed(2)} m/hr` : '—',
      threshold: `> ${FUSION_THRESHOLDS.dhdt_mhr} m/hr`,
      pending: false,
      provenance: 'onsite (N3/N4)',
    },
    {
      id: 'rainfall',
      label: 'Rain intensity (N1 onsite)',
      active: inputs.rainfall !== null
        ? inputs.rainfall > FUSION_THRESHOLDS.rainfall_mmhr
        : false,
      value: inputs.rainfall !== null ? `${inputs.rainfall} mm/hr` : '—',
      threshold: `> ${FUSION_THRESHOLDS.rainfall_mmhr} mm/hr`,
      pending: false,
      provenance: 'onsite (N1)',
    },
    {
      id: 'tidal_lock',
      label: 'Outfall lock (tidal ≥ Z_invert)',
      // Cannot compute lock state without Z_invert — flag as pending
      active: false,
      value: inputs.tidalLevel !== null
        ? `Tidal ${inputs.tidalLevel} m · Z_invert PENDING`
        : '—',
      threshold: 'Tidal ≥ Z_invert — Z_invert PENDING (field survey required)',
      pending: FUSION_THRESHOLDS.zinvert_m === null,
      provenance: 'onsite (N3) vs surveyed Z_invert',
    },
    {
      id: 'did_river',
      label: 'Fluvial stage (DID InfoBanjir N2)',
      active: false, // cannot evaluate until feed configured
      value: inputs.didRiverLevel !== null
        ? `${inputs.didRiverLevel} m`
        : 'Feed not configured',
      threshold: FUSION_THRESHOLDS.did_river_alert_m !== null
        ? `> ${FUSION_THRESHOLDS.did_river_alert_m} m (DID Alert threshold)`
        : 'PENDING: DID station ID not yet configured',
      pending: true,
      provenance: 'DID InfoBanjir (borrowed)',
    },
  ]

  const pendingSignals = signals.filter(s => s.pending).map(s => s.label)
  const activeAvailable = signals.filter(s => !s.pending && s.active).length
  const totalAvailable = signals.filter(s => !s.pending).length

  // Ladder: 3-of-4 → L4; 2-of-3 → L3 (adapts to available non-pending signals)
  // With 2 pending signals: effectively 2-signal system for now
  let level: AlertLevel = 1
  if (totalAvailable >= 3 && activeAvailable >= 3) level = 4
  else if (activeAvailable >= 2) level = 3
  else if (activeAvailable >= 1) level = 2

  const note = pendingSignals.length > 0
    ? `⏳ ${pendingSignals.length} signal(s) pending configuration — ladder operating on ${totalAvailable} of 4 signals`
    : 'All 4 signals active'

  return { level, signals, pendingSignals, note }
}
