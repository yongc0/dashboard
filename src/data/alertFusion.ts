import type { AlertLevel } from '../types'

// Revision 11 retains the v10 decision: the two dh/dt thresholds are deliberately not numeric until
// each location has an invert survey and a full monsoon-season rise-rate record.
export const FUSION_THRESHOLDS = {
  rainfallHighMmhr: 31,
  drainDhdtMhr: null as number | null,
  basinDhdtMhr: null as number | null,
  zinvertM: null as number | null,
}

export const DHDT_THRESHOLD_METHOD = [
  'Obtain Z_invert at N1 and at the N5/N7 basin locations from as-builts or field survey.',
  'Build a rise-rate distribution across at least one full monsoon season.',
  'Back-calculate the rate that preserves the confirmed 60-minute evacuation lead time.',
  'Validate the result against the December 2021 reference event.',
  'Start conservatively and recalibrate after the first monitored season.',
]

export interface FusionSignal {
  id: 'rainfall' | 'drain_dhdt' | 'outfall_lock' | 'basin_dhdt'
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
  activeCount: number
  quorumRequired: 3
  note: string
}

export function computeAlertLevel(inputs: {
  rainfallN1: number | null
  drainDhdtN1: number | null
  outfallLockedN3: boolean | null
  basinDhdtN5N7: number | null
  l3WarningActive: boolean
  preStormDrawdownActive: boolean
}): FusionResult {
  const signals: FusionSignal[] = [
    {
      id: 'rainfall',
      label: 'Rainfall intensity high',
      active: inputs.rainfallN1 !== null && inputs.rainfallN1 >= FUSION_THRESHOLDS.rainfallHighMmhr,
      value: inputs.rainfallN1 === null ? '—' : `${inputs.rainfallN1} mm/hr (N1)`,
      threshold: `≥ ${FUSION_THRESHOLDS.rainfallHighMmhr} mm/hr (DID Heavy category)`,
      pending: inputs.rainfallN1 === null,
      provenance: 'onsite (N1 tipping-bucket gauge)',
    },
    {
      id: 'drain_dhdt',
      label: 'Drain rate-of-rise dh/dt fast',
      active: inputs.drainDhdtN1 !== null && FUSION_THRESHOLDS.drainDhdtMhr !== null
        ? inputs.drainDhdtN1 >= FUSION_THRESHOLDS.drainDhdtMhr
        : false,
      value: inputs.drainDhdtN1 === null ? '—' : `${inputs.drainDhdtN1.toFixed(2)} m/hr (N1)`,
      threshold: 'PENDING: derive from N1 Z_invert + one monsoon season',
      pending: inputs.drainDhdtN1 === null || FUSION_THRESHOLDS.drainDhdtMhr === null,
      provenance: 'onsite (N1 drain radar)',
    },
    {
      id: 'outfall_lock',
      label: 'Outfall gate locked / tide high',
      active: inputs.outfallLockedN3 === true,
      value: inputs.outfallLockedN3 === null ? 'Lock state pending Z_invert' : inputs.outfallLockedN3 ? 'LOCKED' : 'CLEAR',
      threshold: 'Tidal level ≥ surveyed Z_invert',
      pending: inputs.outfallLockedN3 === null,
      provenance: 'onsite (N3 validated radar + pressure pair)',
    },
    {
      id: 'basin_dhdt',
      label: 'Basin rate-of-rise dh/dt fast',
      active: inputs.basinDhdtN5N7 !== null && FUSION_THRESHOLDS.basinDhdtMhr !== null
        ? inputs.basinDhdtN5N7 >= FUSION_THRESHOLDS.basinDhdtMhr
        : false,
      value: inputs.basinDhdtN5N7 === null ? '—' : `${inputs.basinDhdtN5N7.toFixed(2)} m/hr (N5/N7)`,
      threshold: 'PENDING: derive from basin Z_invert + one monsoon season',
      pending: inputs.basinDhdtN5N7 === null || FUSION_THRESHOLDS.basinDhdtMhr === null,
      provenance: 'onsite (N5/N7 basin level)',
    },
  ]

  const pendingSignals = signals.filter(signal => signal.pending).map(signal => signal.label)
  const activeCount = signals.filter(signal => signal.active).length
  const l4QuorumReached = activeCount >= 3

  // Revision 11 ladder: L1 is the separate operator-maintenance channel; L2 is
  // pre-storm drawdown; L3 is the mandatory occupancy warning; only a 3-of-4
  // severity vote may assert L4 evacuation. N2 and N4 never enter the quorum.
  let level: AlertLevel = 1
  if (l4QuorumReached) level = 4
  else if (inputs.l3WarningActive) level = 3
  else if (inputs.preStormDrawdownActive) level = 2

  const note = `L4 quorum ${activeCount}/4 active (3 required) · ${pendingSignals.length} calibration/input pending · N2/N4 excluded`

  return { level, signals, pendingSignals, activeCount, quorumRequired: 3, note }
}
