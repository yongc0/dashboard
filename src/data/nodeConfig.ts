import { subMinutes } from 'date-fns'
import type { NodePin } from '../types'

// Single source of truth for all node geographic and physical config.
// Coordinates are EXACT as specified — do not adjust.
// PENDING flags must render visibly; no guessed values.

export const nodeConfig: NodePin[] = [
  {
    nodeId: 'N1',
    label: 'N1 — Rain Gauge (Pluvial)',
    type: 'Pluvial / Rainfall',
    sensorType: 'Radar FMCW (tipping-bucket cross-check)',
    lat: 3.029628,
    lng: 101.528775,
    // FLAG: position is the project anchor, NOT confirmed as worst drainage bottleneck
    flags: { locationUnderReview: true },
    provenance: 'onsite',
    reading: { value: '34', unit: 'mm/hr' },
    lastContact: new Date(),
    confidence: 'good',
    batteryPct: 92,
    loraUptime: 100,
  },
  {
    nodeId: 'N2',
    label: 'N2 — Sg. Klang di Taman Sri Muda (DID InfoBanjir)',
    type: 'Fluvial / River Stage',
    sensorType: 'DID InfoBanjir — Klang district',
    // Station IDENTIFIED this session, but coordinates NOT confirmed:
    // rainfall station 3015084 confirmed; water-level station ID not yet captured.
    // The position below is an APPROXIMATE placeholder on Sg. Klang next to TSM,
    // shown only so all nodes appear — it is NOT a surveyed/confirmed coordinate.
    lat: 3.032200,
    lng: 101.529300,
    flags: { pending: true, datumUnconfirmed: true, approximate: true },
    provenance: 'DID',
    reading: null,
    lastContact: null,
    confidence: 'pending',
    specs: [
      { label: 'Station', value: 'Sg. Klang di Taman Sri Muda (Klang)' },
      { label: 'Rainfall station ID', value: '3015084 (confirmed)' },
      { label: 'Water-level station ID', value: 'PENDING — not yet captured', caveat: 'Same DID dropdown, Water Level tab — outstanding' },
      { label: 'Thresholds (off hydrograph)', value: 'Normal 2.8 · Alert 4.4 · Warning 4.7 · Danger 5.0 m', caveat: 'Read by eye ±0.1 m; DATUM UNCONFIRMED (AMSL vs local) — do not combine with AMSL figures' },
    ],
    designNote: 'Identified, no longer "source undecided". Baseline tidal oscillation (~0.4–1.9 m) under dry conditions and 3–4 m surges on routine rain support the tidal/fluvial-coupling thesis. Tight Alert→Danger band (0.6 m) justifies dh/dt rate-of-rise as the primary trigger over absolute stage.',
  },
  {
    nodeId: 'N3',
    label: 'N3 — Water Gate & Pump House (Tidal/Outfall)',
    type: 'Tidal / Outfall',
    sensorType: 'Radar FMCW',
    lat: 3.029466,
    lng: 101.525893,
    flags: {},
    provenance: 'onsite',
    reading: { value: '3.10', unit: 'm' },
    // Stale: last contact 8 minutes ago — exceeds 5-min threshold
    lastContact: subMinutes(new Date(), 8),
    confidence: 'stale',
    batteryPct: 74,
    loraUptime: 96.1,
  },
  {
    nodeId: 'N4',
    label: 'N4 — Pump Station',
    type: 'Pump Station',
    sensorType: 'Ultrasonic / Radar',
    lat: 3.029400,
    lng: 101.526010,
    flags: {},
    provenance: 'onsite',
    reading: { value: '1.92', unit: 'm' },
    lastContact: new Date(),
    confidence: 'good',
    batteryPct: 95,
    loraUptime: 99.8,
    specs: [
      { label: 'Q_pump (rated)', value: '10.2 m³/s', caveat: 'Nameplate, NOT at design head — 6 × Archimedes screw @ 1.7 m³/s. Needs head-derating once Z_invert confirmed.' },
      { label: 'Configuration', value: '6 × screw pump, 2,200 mm class' },
      { label: 'Historical binding constraint', value: 'Availability (2021 pump failure / power loss), not rated-capacity exceedance' },
    ],
    designNote: 'Q_pump = 10.2 m³/s is rated/nameplate. The discarded 11.1 m³/s figure (unsourced) must not be used. Unconfirmed whether spec is site-installed or catalogue-generic for the 2.2 m / 30° screw class.',
  },
  {
    nodeId: 'N5',
    label: 'N5 — Retention Basin (Government main pond)',
    type: 'Basin / Retention Pond',
    sensorType: 'Radar FMCW',
    lat: 3.0354167,
    lng: 101.5278651,
    // Existing government asset; inclusion as active KPI instrument PENDING SLB financing decision.
    flags: { proposed: true, governmentAsset: true },
    provenance: 'onsite',
    reading: null,   // not yet instrumented
    lastContact: null,
    confidence: 'pending',
    designNote: "Government's existing main retention pond. Inclusion as an active KPI instrument is a separate decision from N7/N8, still gated on the SLB financing decision.",
  },
  {
    nodeId: 'N6',
    label: 'N6 — Outfall Discharge Compliance (co-located N3/N4)',
    type: 'Water Quality / Discharge Compliance',
    sensorType: 'NH₃-N · BOD · TSS probe',
    // Co-located with N3/N4 at the outfall — measures what TSM discharges to Sg. Klang.
    lat: 3.029466,
    lng: 101.525893,
    // REPORTING / COMPLIANCE ONLY — never a flood-control trigger, never a release gate.
    flags: { reportingOnly: true },
    provenance: 'onsite',
    reading: { value: 'TSS 38', unit: 'mg/L' },
    lastContact: new Date(),
    confidence: 'good',
    specs: [
      { label: 'Parameters', value: 'NH₃-N · BOD · TSS', caveat: 'TSS = master indicator (metals & O&G attach to suspended solids). MSMA priority set, not the full 11-parameter list.' },
      { label: 'Design basis', value: 'MSMA 2nd Ed. Table 1.4 — TSS 80% / TN 50% / TP 50% load reduction' },
      { label: 'Advisory benchmark', value: 'EQA Std A: BOD ≤20 · TSS ≤50 · NH₃-N ≤10 mg/L', caveat: 'Advisory only — not statutory for stormwater. Used as TSM sits upstream of the Sg. Rasau intake.' },
    ],
    designNote: 'Reporting/compliance only. Never gates or discharges anything. Receiving water: Class III–IV (DOE), seasonal — confirmation pending DOE station 1K05 / LUAS State of River Report.',
  },
  {
    nodeId: 'N7',
    label: 'N7 — Riverbank Sunken Field (Auxiliary Detention)',
    type: 'Auxiliary Detention — Tidally-Connected Wet Basin',
    sensorType: 'Radar FMCW (level vs rim)',
    lat: 3.030412608630896,
    lng: 101.52754173761694,
    // Locked design: tidally-connected WET basin (not a sealed/lined dry tank).
    flags: { auxiliaryDetention: true, datumUnconfirmed: true },
    provenance: 'onsite',
    reading: null,   // proposed works — not yet instrumented
    lastContact: null,
    confidence: 'pending',
    specs: [
      { label: 'Footprint', value: '~16,067 m² (~510 m perimeter)', caveat: 'Google Earth measured at anchor coordinate' },
      { label: 'Design', value: 'Path 2 — tidally-connected wet basin (LOCKED)', caveat: 'Usable storage = footprint × (rim − resting level), NOT full excavated volume' },
      { label: 'Provisional usable storage', value: '≈ 33,700 m³', caveat: 'PROVISIONAL — rim ~3.2 m, resting ~1.1 m AMSL → ~2.1 m freeboard. Inherits N2 datum-unconfirmed caveat.' },
      { label: 'Freeboard at tidal peak', value: '≈ 1.3 m (shrinks from 2.1 m)', caveat: 'Freeboard is NOT constant — N7 must carry its own live level-vs-rim signal.' },
      { label: 'Storage target', value: '40,000 m³ is NEGOTIABLE', caveat: 'Do not treat as a fixed requirement.' },
    ],
    designNote: 'Tidally-connected wet basin (sealed cutoff-wall option rejected as fighting an unwinnable water table). Required (not yet engineered): river-facing berm crested > 5.8 m AMSL OR documented acceptance of tidal connection; non-return/flap valve on any river connection. Courts stay at north end; lower terraces reframe as blue-green wetland. Rotterdam framing applies to community narrative only — its precedent is isolated pluvial detention with no river-edge boundary.',
  },
  {
    nodeId: 'N8',
    label: 'N8 — Pond Water Gate (Release-Control)',
    type: 'Water Quality — Release-Control Gate',
    sensorType: 'NH₃-N · BOD · TSS probe (radar/FMCW tier)',
    // Sri Muda Flood Retention Pond water gate — ADDITION, not a relocation of N6.
    lat: 3.0371601764116853,
    lng: 101.52839355966324,
    flags: { releaseControl: true },
    provenance: 'onsite',
    reading: { value: 'TSS 58', unit: 'mg/L' },
    lastContact: new Date(),
    confidence: 'good',
    specs: [
      { label: 'Parameters', value: 'NH₃-N · BOD · TSS (same as N6)' },
      { label: 'Gating authority', value: 'Routine/baseline pumping ONLY', caveat: 'Hard rule: unconditionally SUSPENDED at Alert Level 3+. Flood discharge takes absolute precedence — state-machine enforced, no operator override.' },
      { label: 'Decision mode', value: 'Human-in-the-loop', caveat: 'Auto-flags a threshold breach; does NOT auto-execute a hold. Designated operator decides within LUAS/DID-approved parameters.' },
      { label: 'Timeout / fallback', value: 'PENDING — not yet specified', caveat: 'If a flagged breach goes unactioned: auto-revert to release (favour storage) or stay held (favour compliance)? Decision required.' },
    ],
    designNote: 'Conditional release-gating control point for the main retention pond — distinct from N6 (pure reporting). Thresholds & protocol approved by LUAS/DID; hold events logged & reported to LUAS/DID after the fact. Higher-reliability instrument tier (radar/FMCW) because its reading can trigger an operational hold.',
  },
]
