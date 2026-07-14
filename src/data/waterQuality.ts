export interface WQParam {
  key: 'nh3n' | 'tss'
  label: string
  value: number
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

// EQA Standard A remains an advisory comparison for stormwater, not a statutory
// compliance threshold for this system.
export const EQA_STANDARD_A = {
  bod: 20,
  tss: 50,
  nh3n: 10,
}

export const MSMA_TARGETS = [
  { label: 'Floatables / litter', target: 90 },
  { label: 'TSS', target: 80 },
  { label: 'TN', target: 50 },
  { label: 'TP', target: 50 },
]

export const n6Decision = {
  nodeId: 'N6' as const,
  deployment: 'conditional' as const,
  decision: 'D1',
  options: ['Reinstate fixed node', 'Portable sampling', 'Retain removal and disclose monitoring gap'],
  recommendation: 'Reinstate fixed node, sharing N3 enclosure/power/backhaul where feasible',
  gap: 'Routine direct discharge through the primary outfall is not continuously monitored while N6 is removed.',
}

export const n8Reading = {
  nodeId: 'N8' as const,
  role: 'Retention-pond water-quality monitoring' as const,
  timestamp: new Date(),
  params: [
    { key: 'nh3n', label: 'NH₃-N', value: 6.1, unit: 'mg/L', stdA: EQA_STANDARD_A.nh3n },
    { key: 'tss', label: 'TSS', value: 58, unit: 'mg/L', stdA: EQA_STANDARD_A.tss },
  ] as WQParam[],
  note: 'Sole confirmed continuous water-quality node. It does not control the penstock; C1 performs local control.',
}

export const bod5Samples: LabSample[] = [
  {
    parameter: 'BOD5',
    value: 18,
    unit: 'mg/L',
    sampledAt: '2026-06-30',
    nextDue: '2026-12-31',
    method: 'Semi-annual laboratory sampling service',
  },
]

export function breachesStdA(p: WQParam): boolean {
  return p.value > p.stdA
}
