// Water-quality nodes — N6 and N8 are TWO DISTINCT nodes (do not merge).
//   N6 = outfall / discharge compliance — REPORTING ONLY, never a flood-control trigger.
//   N8 = pond water-gate — RELEASE-CONTROL, conditional hold authority during baseline ops only.
// Both measure the same three parameters: NH₃-N, BOD, TSS.

export interface WQParam {
  key: 'nh3n' | 'bod' | 'tss'
  label: string
  value: number
  unit: string
  stdA: number          // EQA 2009 Standard A advisory limit
}

// EQA Industrial Effluent Regulations 2009, Standard A — ADVISORY benchmark for stormwater
// (not statutory). Used because TSM discharges upstream of the Sg. Rasau intake (1,400 MLD).
export const EQA_STANDARD_A = {
  bod: 20,    // mg/L
  cod: 80,    // mg/L
  tss: 50,    // mg/L
  nh3n: 10,   // mg/L
  og: 'not detectable',
}

// MSMA 2nd Ed. (2012) Table 1.4 — annual load-reduction targets (40 mm WQV design storm)
export const MSMA_TARGETS = [
  { label: 'Floatables / litter', target: 90 },
  { label: 'TSS', target: 80 },
  { label: 'TN', target: 50 },
  { label: 'TP', target: 50 },
]

// ─── N6 — outfall discharge compliance (reporting only) ──────────────────────
export const n6Reading = {
  nodeId: 'N6' as const,
  role: 'Discharge compliance — reporting only' as const,
  timestamp: new Date(),
  params: [
    { key: 'nh3n', label: 'NH₃-N', value: 4.2, unit: 'mg/L', stdA: EQA_STANDARD_A.nh3n },
    { key: 'bod', label: 'BOD', value: 12, unit: 'mg/L', stdA: EQA_STANDARD_A.bod },
    { key: 'tss', label: 'TSS', value: 38, unit: 'mg/L', stdA: EQA_STANDARD_A.tss },
  ] as WQParam[],
  receivingClass: 'Class III–IV (DOE), seasonal — confirmation pending DOE station 1K05 / LUAS State of River Report',
  note: 'Reporting and compliance logging only — never a flood-control trigger, never a release gate. Measures what TSM discharges into Sg. Klang.',
  outOfScope: 'Full 11-parameter MSMA list, heavy metals (Pb/Cd/Zn — within Class IIB), bacteriological/E. coli — all out of scope (fail the saves-lives / verifies-KPI / wins-criterion filter).',
}

// ─── N8 — pond water-gate release-control node (NEW) ─────────────────────────
export const n8Reading = {
  nodeId: 'N8' as const,
  role: 'Release-control gate — conditional hold authority' as const,
  timestamp: new Date(),
  params: [
    { key: 'nh3n', label: 'NH₃-N', value: 6.1, unit: 'mg/L', stdA: EQA_STANDARD_A.nh3n },
    { key: 'bod', label: 'BOD', value: 18, unit: 'mg/L', stdA: EQA_STANDARD_A.bod },
    { key: 'tss', label: 'TSS', value: 58, unit: 'mg/L', stdA: EQA_STANDARD_A.tss },  // > Std A 50 → flagged
  ] as WQParam[],
  note: 'Conditional release-gating control point for the main retention pond — distinct from N6. Higher-reliability (radar/FMCW) tier because its reading can trigger an operational hold.',
}

// Locked operating logic for N8. The L3 suspend rule is a hard, state-machine-enforced
// architectural rule — NOT an operator judgment call.
export const n8Logic = {
  gatingAuthority: 'Routine / baseline pumping operations ONLY (no active flood alert)',
  suspendAtLevel: 3 as const,           // >= L3 → release-control unconditionally suspended
  decisionMode: 'Human-in-the-loop — auto-flags a breach, never auto-executes a hold',
  governance: 'Thresholds & protocol approved by LUAS/DID; designated TSM operator acts within those parameters; all holds logged & reported to LUAS/DID after the fact',
  timeoutPending: true,                  // fallback on unactioned breach — NOT YET SPECIFIED
  timeoutNote: 'OPEN: if a flagged breach goes unactioned within a window, does it auto-revert to release (favour flood-storage) or stay held (favour compliance)? Decision required before logic is complete.',
}

export function breachesStdA(p: WQParam): boolean {
  return p.value > p.stdA
}
