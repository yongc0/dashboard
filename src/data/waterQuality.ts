export interface WQParam {
  key: 'nh3n' | 'tss'
  label: string
  value: number | null
  unit: string
  stdA: number
}

export interface LabSample {
  parameter: 'BOD5'
  value: number
  unit: string
  sampledAt: string
  nextDue: string
  method: string
}

// EQA Standard A remains an advisory comparison, not a statutory compliance claim.
export const EQA_STANDARD_A = { bod: 20, tss: 50, nh3n: 10 }

export const MSMA_TARGETS = [
  { label: 'Floatables / litter', target: 90 },
  { label: 'TSS', target: 80 },
  { label: 'TN', target: 50 },
  { label: 'TP', target: 50 },
]

export const n6Reading = {
  nodeId: 'N6' as const,
  role: 'Primary minor-drainage outfall monitoring' as const,
  timestamp: null as Date | null,
  params: [
    { key: 'nh3n', label: 'NH₃-N', value: null, unit: 'mg/L', stdA: EQA_STANDARD_A.nh3n },
    { key: 'tss', label: 'TSS', value: null, unit: 'mg/L', stdA: EQA_STANDARD_A.tss },
  ] as WQParam[],
  note: 'Reinstated as a fixed multiparameter-probe node. No BOD₅ lab line; monitoring/reporting only and no gate authority.',
}

export const n8Reading = {
  nodeId: 'N8' as const,
  role: 'Retention-pond water-gate monitoring' as const,
  timestamp: new Date(),
  params: [
    { key: 'nh3n', label: 'NH₃-N', value: 6.1, unit: 'mg/L', stdA: EQA_STANDARD_A.nh3n },
    { key: 'tss', label: 'TSS', value: 58, unit: 'mg/L', stdA: EQA_STANDARD_A.tss },
  ] as WQParam[],
  note: 'May defer a routine dry-weather release. Flood-control dh/dt always overrides the quality hold.',
}

export const bod5Samples: LabSample[] = [{
  parameter: 'BOD5',
  value: 18,
  unit: 'mg/L',
  sampledAt: '2026-06-30',
  nextDue: '2026-12-31',
  method: 'Semi-annual laboratory sampling service at N8 only',
}]

export function breachesStdA(parameter: WQParam): boolean {
  return parameter.value !== null && parameter.value > parameter.stdA
}
