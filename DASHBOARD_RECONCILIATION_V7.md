# Dashboard Reconciliation Against TSM Monitoring System Revision 7

**Source reviewed:** `TSM_Monitoring_System_v7_Reconciliation_BOM_and_Arena_Data.docx`  
**Dashboard baseline:** current React/TypeScript implementation in `dashboard/src`  
**Reconciliation date:** 14 July 2026

> **Implementation status (14 July 2026):** The P0-P2 dashboard reconciliation described below has been implemented. N2 is now API-only and absent from the map; C1 is separate from N8; node definitions, fusion, infrastructure, risk, KPI and audit views have been updated. Remaining P3 items require the field decisions and surveys listed in Section 7.

## 1. Executive summary

Revision 7 changes the dashboard's system model in a material way. The largest change is that penstock automation is no longer an implied function of N8. It is a separate local control installation, **C1 - Gate & Arena Local Controller**, built around an industrial PLC at the penstock structure. N8 remains a water-quality monitoring node at the retention-pond water gate; it is not the PLC, actuator, or penstock controller.

The current dashboard therefore needs more than a label update. It must separate:

- **Monitoring nodes N1-N8**, which measure environmental and infrastructure conditions.
- **Local controller C1** (and potentially C2), which executes safety-critical penstock and arena-pump logic locally.
- **LoRaWAN/cloud supervision**, which receives telemetry and audit events but must not be presented as the safety-critical control loop.

Revision 7 also changes or clarifies several node definitions:

- N1 has two distinct measurements: a tipping-bucket rain gauge and an FMCW drain-level sensor used for `dh/dt`.
- N2 remains a software-only DID integration, but the updated record lists stations `3015432 / 3015084` rather than leaving the water-level station wholly unidentified.
- N3 becomes a dual-sensor, life-safety node with disagreement/fault detection.
- N4 is a clamp-on ultrasonic **flow-anomaly** node, not a water-level node and not a calibrated inflow/outflow meter.
- N5 gains the second rain gauge used in either-gauge rainfall fusion.
- N6 is **still removed and conditional on Decision D1**; the current dashboard incorrectly presents it as an installed, live node.
- N7 is the **Sunken Arena**, with its coordinate and storage area/volume unresolved. The current locked wet-basin and 33,700 m3 presentation is no longer defensible.
- N8 is the sole confirmed continuous water-quality node. It measures NH3-N and TSS; BOD5 is a semi-annual laboratory service rather than a continuous probe channel.

## 2. Architecture that the dashboard must represent

### 2.1 Monitoring and control are separate layers

The updated architecture should be shown as three layers:

1. **Field monitoring:** N1-N8 sensors and the two DID reference feeds.
2. **Local control:** C1 PLC, its dedicated sensors, physical interlocks, actuator, pump interface, warning devices, manual controls, UPS, and local event buffer.
3. **Supervisory telemetry:** RS-485/Modbus RTU to an STM32 LoRaWAN node, two redundant LoRaWAN gateways with diverse backhaul, the cloud dashboard, alert services, and long-term audit storage.

The C1 control loop must remain local. The dashboard should display PLC state, inputs, outputs, alarms, acknowledgements, and event history. It should not imply that cloud availability or LoRaWAN connectivity is required for a safe gate transition.

### 2.2 Two hydraulic paths must be drawn

The current system-flow diagram needs to show the two distinct discharge paths described in Revision 7:

- **Minor/routine path:** local drainage discharges directly to Sungai Klang through the primary outfall near N3/N6, bypassing the retention pond.
- **Major/overflow path:** Sunken Arena -> penstock/C1-controlled transfer -> retention pond -> pump station -> Sungai Klang.

The current diagram incorrectly places N8 as an in-line release gate between the pond and the outfall. N8 should be drawn as a water-quality sensing point at the retention-pond water gate, while C1 should be drawn at the separate arena penstock.

## 3. Node-by-node reconciliation

### N1 - Pluvial primary node

**What Revision 7 says**

- Coordinate remains locked at `3.029628, 101.528775`.
- One tipping-bucket rain gauge: Dragino WSS-21 or Decentlab DL-TBRG.
- One Kisters HyQuant L20 FMCW radar sensor for drain level and `dh/dt`.
- STM32-based 915 MHz LoRaWAN edge node.
- Solar/battery sizing remains pending.

**Dashboard changes required**

- Replace the single ambiguous sensor description (`Radar FMCW (tipping-bucket cross-check)`) with two explicit channels: `rainfall_mmhr` and `drain_level_m`/`dhdt_mhr`.
- Display rainfall intensity and drain rise rate together on the N1 card and popup.
- Keep the coordinate and location-review caveat unless a later decision closes it.
- Record the candidate rain-gauge models and pending power sizing in the engineering details.

### N2 - DID fluvial reference

**What Revision 7 says**

- N2 has no physical project node; it is a JPS/DID software integration.
- The BOM lists DID stations `3015432 / 3015084`.
- API or data-sharing access remains pending and is a major integration blocker.

**Dashboard changes required**

- Update the feed configuration to record both station identifiers, with `3015084` retained as the confirmed rainfall station and `3015432` treated as the likely water-level reference pending an explicit station-role check.
- Stop saying that the water-level station is completely unidentified; say that its identifier/role and live API mapping require confirmation.
- Keep the datum and threshold caveats until station metadata is confirmed.
- Continue to mark N2 as borrowed data rather than an owned, battery-powered sensor.

### N3 - Tidal/outfall life-safety node

**What Revision 7 says**

- Coordinate remains `3.029466, 101.525893`.
- Primary OTT RLS 500 FMCW radar level sensor.
- Independent, separately powered vented pressure transducer.
- A difference beyond the configured tolerance must create a `FAULT` state.
- N3 is the flood-control override authority and highest-priority maintenance node.

**Dashboard changes required**

- Model and display both sensor readings independently rather than one `waterLevel` value.
- Add sensor agreement/delta, configured tolerance, selected/validated value, and fault status.
- Never silently average disagreeing readings. Show `FAULT` and the source values.
- Add separate power/health status for each sensor where available.
- Surface N3's override-authority and maintenance-priority designation in Live System and Infrastructure Health.

### N4 - Pump-station flow-anomaly node

**What Revision 7 says**

- Coordinate remains `3.029400, 101.526010`.
- The instrument is a clamp-on ultrasonic flow sensor.
- Sensor selection is blocked by pipe diameter and material.
- Its scope is blockage/anomaly detection only, not calibrated `Qin/Qout` measurement.
- Power may be mains-adjacent; the tie-in remains pending.

**Dashboard changes required**

- Replace the current `Ultrasonic / Radar` level-sensor model and water-level reading with a flow/anomaly model.
- Remove N4 `waterLevel`, `waterLevelMax`, and `dhdt` displays.
- Do not present the 10.2 m3/s pump nameplate value as N4's live measured flow.
- Add fields such as `flow_status`, `relative_flow`, `baseline_delta`, `anomaly`, and `sensor_model_pending` without inventing an absolute flow reading.
- Show pipe diameter/material and power tie-in as procurement blockers.

### N5 - Retention-pond basin node

**What Revision 7 says**

- Coordinate remains `3.035417, 101.527865`.
- Proposed Kisters HyQuant L20/L50 radar level sensor; range selection is pending storage reconciliation.
- A second tipping-bucket gauge is confirmed for spatial rainfall coverage.
- Alert fusion uses an **either-gauge** rule with N1.
- Power may tie into the Solar Boardwalk PV system; feasibility remains pending.

**Dashboard changes required**

- Add N5 rainfall as a separate live/pending channel, not only pond level.
- Change rainfall fusion from N1-only to the specified N1-or-N5 rule, with per-gauge provenance and health.
- Show radar model/range and power/mounting as pending rather than treating the entire node as merely an SLB proposal.
- Do not invent a pond reading until instrumentation is represented as installed or simulated explicitly.

### N6 - Conditional primary-outfall water quality

**What Revision 7 says**

- N6 remains physically removed; reinstatement is an unresolved Decision D1.
- The previous redundancy justification is invalid because N6 and N8 monitor different discharge paths.
- Recommended option is reinstatement at the N3 outfall, potentially sharing enclosure, power, and backhaul with N3.
- If reinstated, the proposed continuous probe covers NH3-N and TSS.

**Dashboard changes required**

- Remove the current fabricated live N6 reading and active compliance card.
- Mark N6 as `CONDITIONAL - DECISION D1`, with options: fixed reinstatement, portable sampling, or removal with an explicit monitoring-gap statement.
- Explain that the minor/routine discharge path is unmonitored while N6 is absent.
- Preserve N6 as a distinct logical node; do not merge it into N8.
- If the demo needs a preview, label values as scenario data rather than current sensor data.
- Remove continuous BOD from N6 unless a later hardware decision adds that channel.

### N7 - Sunken Arena storage node

**What Revision 7 says**

- Updated coordinate is `3.030444, 101.527556`, but exact coordinate confirmation remains open.
- A dimensioned plan gives a 15,000 m2 overall footprint.
- This is a fourth unreconciled area figure, alongside 16,067, 16,565, and 16,955 m2.
- Storage cannot be treated as one uniform surface. Candidate zones are football field (7,140 m2), courts (3,060 m2 at a raised threshold), skate park (2,080 m2), and senior park/stairs (2,720 m2).
- The authoritative storage zone and volume remain Decision D4.
- Radar range, sensor placement, power, and whether N7 shares the C1 telemetry node remain pending.

**Dashboard changes required**

- Rename N7 from `Riverbank Sunken Field / tidally-connected wet basin` to `Sunken Arena`.
- Update the candidate coordinate and retain a visible coordinate-verification warning.
- Remove the `WET BASIN - LOCKED`, 16,067 m2, 33,700 m3, fixed freeboard, and related datum-derived claims.
- Add a zone breakdown and show all four area figures as unreconciled evidence, not selectable facts.
- Display storage capacity, usable volume, sensor range, placement, and controller co-location as pending Decision D4/D2.
- Do not calculate time-to-fill or storage remaining from an unresolved area/volume.

### N8 - Retention-pond water-quality node

**What Revision 7 says**

- Updated coordinate is `3.036780857, 101.528438`.
- N8 is the sole confirmed continuous water-quality node.
- Continuous probe channels are NH3-N and TSS.
- BOD5 is handled through a semi-annual laboratory sampling service.
- N8 has its own LoRaWAN node and mounting hardware.

**Dashboard changes required**

- Update the coordinate.
- Rename/reframe N8 as water-quality monitoring at the retention-pond water gate, not the penstock PLC or release-control actuator.
- Remove the `n8Logic` gate-control state machine and the current Release Control panel association.
- Replace continuous BOD with a dated lab-sample record and next-sample due date.
- Continue to show NH3-N and TSS against clearly labelled advisory benchmarks.
- Do not connect N8 threshold breaches directly to gate motion unless a later approved control specification explicitly requires it.

## 4. New C1 PLC and penstock dashboard requirements

C1 should be introduced as a controller/asset, not forced into `NodeId = N1...N8`.

### 4.1 PLC identity and status

Display:

- Controller ID: `C1`.
- Location: penstock structure at the south-west corner of the arena collector loop.
- PLC class: Siemens LOGO! / Allen-Bradley Micro800 class.
- Operating mode: automatic, manual lockout, emergency hold, or fault. Exact state names should be finalised with the PLC program.
- PLC heartbeat, firmware/program revision, last contact, enclosure condition, mains state, UPS state, and local-log capacity.
- LoRaWAN/Modbus telemetry status separately from PLC/control health.

### 4.2 PLC inputs

The dashboard should expose, at minimum:

- Dedicated gate/drain-side level and local `dh/dt`.
- Dedicated river/downstream-side level for the backflow interlock.
- Gate-position feedback: open, closed, intermediate, invalid/disagreement.
- Gate-motor current for jam/obstruction detection.
- Arena-pump current per pump once the pump count is confirmed.
- Manual lockout selector state.
- Emergency-hold pushbutton state by access point.
- Mains and UPS status.
- Communications and local audit-buffer status.

These C1 sensors are dedicated local-control inputs. The gate-side level must not be substituted with N1, and the downstream-side level must not be substituted with N3.

### 4.3 PLC outputs and commanded/confirmed state

Display commanded and confirmed states separately for:

- Penstock actuator/motor.
- Motor contactor pair or VFD.
- Arena pump starter/VFD per pump, subject to Decision D2.
- Hardwired sirens.
- Strobe lights.

A command must never be shown as completed until position/current feedback confirms the transition. The UI needs explicit `commanded`, `transitioning`, `confirmed`, `timeout`, `jam`, and `interlock-blocked` presentations. Thresholds and timers not defined in Revision 7 must remain `PENDING`.

### 4.4 Safety and interlock presentation

The operator view should make the following conditions unmissable:

- Downstream/backflow interlock active.
- Gate-position feedback invalid or transition unconfirmed.
- Motor-current jam/obstruction fault.
- Manual lockout selected.
- Emergency-hold circuit active, including which access point initiated it.
- PLC on UPS or power degraded.
- Local control healthy but telemetry unavailable.
- Telemetry healthy but PLC/control faulted.
- Fail-closed actuator state and any discrepancy between expected and confirmed position.

The dashboard should not invent the final sequence, thresholds, timing, or automatic drawdown logic. Revision 7 still lists the tide-feed integration, actuator specification, UPS sizing, local-log retention, warning-device quantities, and several site parameters as pending.

### 4.5 Supervisory-control boundary

Recommended initial implementation: make the dashboard **read-only supervisory control and data acquisition** for C1. Show physical commands and PLC decisions, but do not add browser-based gate-open/close controls until authentication, authorisation, command acknowledgement, interlock enforcement, network-failure behaviour, and regulator-approved operating procedures are specified.

If remote commands are later approved, they must be issued to the PLC as requests, checked by the PLC's local safety logic, and returned with accepted/rejected reason codes and confirmed field state.

## 5. Data-model and source-file changes

### `src/types/index.ts`

- Keep `NodeId` for N1-N8.
- Add a separate `ControllerId = 'C1' | 'C2'` and controller/asset interfaces.
- Replace the one-shape-fits-all `SensorNode` fields with typed measurement channels or node-specific telemetry.
- Add types for PLC mode, gate command, gate position, transition state, interlock, discrete input/output, motor current, pump state, power state, communications state, and controller event.
- Add explicit deployment states such as `installed`, `conditional`, `proposed`, `blocked`, and `not_configured`; do not overload `confidence` to describe procurement status.

### `src/data/nodeConfig.ts`

- Apply the N1-N8 definition, coordinate, sensor, and status changes in Section 3.
- Remove `releaseControl` from N8.
- Replace N7's `auxiliaryDetention` locked-wet-basin semantics with arena/storage-reconciliation flags.
- Mark N6 conditional rather than live/reporting-only installed.
- Add N3 dual-sensor details, N4 flow-anomaly details, and N5's second rain gauge.

### New `src/data/controllerConfig.ts`

- Define C1 location, PLC class, confirmed/pending BOM components, dedicated inputs, outputs, interlocks, communications path, UPS, and audit-buffer requirements.
- Include C2 only as a conditional controller gated by Decision D2.

### `src/data/mockData.ts`

- Replace the generic N1/N3/N4 mock objects with node-appropriate telemetry.
- Add N5 rainfall for either-gauge fusion.
- Add two N3 level channels and a demonstrable agreement/fault scenario.
- Replace N4 water level with a clearly labelled anomaly demo value.
- Remove live N6 telemetry unless shown as a labelled scenario.
- Add C1 PLC state, input/output feedback, interlock and event data.

### `src/data/alertFusion.ts`

- Accept N1 and N5 rainfall separately and implement the documented either-gauge logic.
- Carry data quality and provenance for the gauge that triggered the rule.
- Add N3 dual-sensor validity/fault handling before using its derived level or `dh/dt`.
- Do not treat N4 flow anomaly, N6/N8 water quality, or C1 device state as flood-alert inputs unless an approved rule explicitly adds them.
- Keep all unconfirmed thresholds visibly pending.

### `src/data/feedConfigs.ts`

- Record both N2 DID station IDs and the unresolved role/API mapping.
- Preserve datum and provisional-threshold warnings.
- Add the tide-forecast integration as a pending feed used by the future Level-2 automated drawdown logic, without simulating that control rule as final.

### `src/data/waterQuality.ts`

- Change continuous parameters to NH3-N and TSS for N8 and conditional N6.
- Move BOD5 to a laboratory-sample structure containing result, sample date, laboratory/reference, and next due date.
- Remove `n8Logic`; penstock state belongs to C1.
- Retain the advisory/non-statutory qualification for EQA Standard A comparisons.

## 6. Screen-by-screen changes

### Operator Overview

- Add a C1 control-health card with mode, gate position, active interlock, UPS and last transition.
- Add N3 dual-sensor agreement and N4 flow-anomaly status.
- Show rainfall as N1/N5 spatial coverage rather than N1 only.
- Separate `system monitoring reduced` from `local control degraded`.

### Live System

- Replace the N8 Release Control panel with a dedicated C1 PLC/Penstock panel.
- Show commanded versus confirmed gate position, transition progress, interlocks, motor current and faults.
- Show local control health independently of LoRaWAN/cloud health.
- Redraw the two hydraulic paths and place N6, N8 and C1 correctly.
- Update node cards so each node displays the measurements it actually owns.

### Infrastructure Health

- Add C1 PLC, actuator, contactor/VFD, gate feedback, CT clamps, UPS, local storage, warning devices and physical manual controls.
- Add N3's two independently powered sensors.
- Add two gateways with physically separated sites, diverse backhaul and at least 72-hour backup.
- Show pending quantities and blockers rather than treating TBD as zero.
- Track PLC program revision, proof tests, interlock tests and actuator maintenance.

### Flood Risk

- Replace the locked N7 wet-basin panel with the Sunken Arena zone/area reconciliation.
- Do not show an authoritative N7 storage volume, freeboard or time-to-fill.
- Add the 15,000 m2 dimensioned-plan value alongside the three earlier figures and explain that the storage zone is undecided.
- Keep tide-feed-driven automated drawdown visibly pending.

### SLB KPI / Finance

- Mark N6 monitoring as a covenant/ESG decision gap rather than live compliance evidence.
- Show N8 as the only confirmed continuous water-quality node.
- Separate continuous NH3-N/TSS from semi-annual BOD5 lab results.
- Do not claim complete discharge-path monitoring while Decision D1 is open.

### Reports and Audit Trail

- Add PLC events: mode changes, open/close requests, accepted/rejected commands, confirmed positions, transition timeouts, backflow interlocks, jam faults, manual lockout, emergency holds, siren/strobe activation, power/UPS changes and communications loss/recovery.
- Record raw input values, control-program revision, event source, local timestamp, cloud-ingest timestamp and acknowledgement status.
- Show whether an event was created locally and later backfilled after a communications outage.
- Keep local ring-buffer capacity and long-term retention policy pending until the SLB evidence requirement is confirmed.

### Node Map

- Correct N7 and N8 coordinates/status text.
- Add C1 as a controller asset marker distinct from N1-N8 sensor pins.
- Mark N6 conditional and N7 coordinate-unconfirmed.
- Remove `REL GATE` semantics from N8.

### Public View

- Keep control details out of the resident interface.
- Optionally show a simple verified status such as `Flood-control system operating`, `Reduced monitoring`, or `Local control fault` only when the operator data model can support it reliably.
- If arena sirens are represented, show activation/last-test status only; do not expose control buttons.

## 7. Implementation priority

### P0 - Correct misleading semantics

1. Split C1 control from N8 monitoring.
2. Mark N6 conditional and remove its fabricated live evidence.
3. Replace N4 water-level semantics with flow-anomaly semantics.
4. Remove the locked N7 area/volume/wet-basin claims.
5. Correct N7/N8 coordinates and labels.
6. Replace continuous BOD with laboratory BOD5 sampling.

### P1 - Add the PLC supervisory model

1. Add controller types and C1 configuration.
2. Add mock PLC inputs, outputs, modes, interlocks, feedback and events.
3. Build the C1 panel and update the hydraulic flow diagram.
4. Extend the audit trail for local control events.

### P2 - Add redundancy and revised fusion

1. Add N3 dual-sensor agreement/fault handling.
2. Add N5 rainfall and N1-or-N5 fusion.
3. Add redundant gateway/backhaul health.
4. Update N1, N2, N4 and N5 engineering metadata and blockers.

### P3 - Complete after field decisions

1. D1: N6 fixed reinstatement, portable sampling, or removal.
2. D2: whether the arena pump sump is co-located with C1 or requires C2.
3. D4: N7 coordinate, authoritative storage zones, area, volume and sensor placement.
4. N4 pipe diameter/material and final flow-sensor selection.
5. Arena access-point and acoustic surveys for warning-device quantities.
6. RF survey for the two gateway locations.
7. N4/N5 power tie-in feasibility.
8. Gate actuator, UPS, local log retention and tide-feed/control thresholds.

## 8. Acceptance criteria

The dashboard reconciliation is complete when:

- N8 is nowhere described as the penstock PLC or actuator.
- C1 appears as a separate local controller with dedicated field inputs and confirmed-versus-commanded outputs.
- Loss of cloud/LoRa telemetry does not visually imply loss of local PLC control.
- N6 is visibly conditional and contributes no live compliance evidence unless D1 is resolved.
- N3 shows two sensors and produces a visible fault on excessive disagreement.
- N4 shows flow-anomaly status and no fabricated water-level or calibrated flow.
- N5 contributes the second rainfall gauge to documented either-gauge fusion.
- N7 shows unresolved zones/areas and no authoritative storage volume.
- N8 shows continuous NH3-N/TSS plus separate periodic BOD5 laboratory data.
- The system diagram shows both discharge paths and locates N3/N6, C1, N8, the retention pond and pump station correctly.
- PLC transitions, interlocks, faults, emergency actions and manual overrides appear in the audit trail.
- Every pending value or procurement blocker remains visibly pending; no threshold, timer, quantity, capacity or control sequence is invented.

## 9. Items that remain valid from the current dashboard

- The public/operator two-face concept remains suitable.
- The four-level resident alert presentation can remain, subject to revised sensor fusion and validity handling.
- N1, N3, N4 and N5 coordinates remain materially consistent with Revision 7.
- N2 remains an external JPS/DID feed rather than a physical project node.
- N6 and N8 remain conceptually distinct water-quality locations; their deployment and control roles need correction.
- LoRaWAN telemetry, provenance labels, stale-data handling and visible `PENDING` caveats remain appropriate design principles.
- The audit-oriented SLB/ESG reporting concept remains relevant, but its evidence claims must reflect N6's unresolved status and the new PLC event stream.
