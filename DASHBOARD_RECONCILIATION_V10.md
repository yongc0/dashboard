# TSM Monitoring System v10 — Dashboard Reconciliation

Source reviewed: `../TSM_Monitoring_System_v10.docx`.

This file records the Revision 10 facts now represented in the dashboard and the items that must remain visibly pending. It supersedes the v7 reconciliation for current implementation decisions.

## Implemented changes

### Control architecture

- Added **C1 Penstock PLC** as a three-state local controller: `CLOSED / ISOLATE`, `ADMIT`, and `GRAVITY-RELEASE`.
- Added the mandatory Level-3 occupancy warning clearance before C1 may enter `ADMIT`.
- Added **C2 Arena Sump-Pump PLC** as a separate, independent controller.
- C2 design duty is shown as 900 m³/h at approximately 5.1 m head, within the 4.1–7.1 m band, through a DN400 non-return-protected discharge.
- Arena drawdown is measured from confirmed drain recession and targeted within 48 hours.
- The dashboard and network are supervisory only. DID screw pumps and the main tidal gate are monitored, not actuated.

### Alert logic and public view

- Level 4 now requires a fixed **3-of-4** vote from:
  1. N1 rainfall high.
  2. N1 drain dh/dt fast.
  3. N3 outfall locked / tide high.
  4. N5/N7 basin dh/dt fast.
- N2 and N4 are explicitly excluded from the vote.
- Level 1 is maintenance/operator-only and is never exposed as a public alert.
- Public alert levels 2–4 are labelled pre-storm, warning, and evacuation/critical danger, with a three-level public legend.
- Level 3 represents the mandatory warning and emergency-hold sequence before arena admission; Level 4 represents evacuation.

### Nodes and feeds

- N2 remains off the map because it is a **JPS/DID API-only** reference. Stations 3015432 and 3015084 and the official 2.80/4.40/4.70/5.00 m river bands are shown; API access remains pending.
- N6 is reinstated at 3.0294, 101.5260, co-located with N3 infrastructure. It carries NH₃-N and TSS probes only, with no BOD₅ line and no control authority.
- N7 now uses the locked 17,280 m² footprint, three-zone layout, 2.5 m general excavation, 43,200 m³ gross storage, approximately 37,300 m³ net usable storage, and at least 300 mm freeboard. Its exact coordinate remains unverified.
- N8 retains NH₃-N/TSS monitoring plus semi-annual BOD₅ sampling. A routine water-quality hold may apply, but flood dh/dt overrides it.

### KPI and evidence

- Removed the unsupported numeric **0.95** normalised dh/dt covenant and coupon-step chart.
- Numeric drain and basin dh/dt thresholds remain `PENDING`.
- The dashboard now shows the v10 calibration method: survey invert levels, collect one full monsoon record, back-calculate for 60-minute lead time, validate against December 2021, and approve/recalibrate.
- The KPI view now reports methodology status, evidence availability, the locked N7 net-storage basis, and the C2 drawdown target without claiming an unapproved covenant result.

## Items that must remain pending

1. Live N2 JPS/DID API or data-sharing access.
2. N4 pipe diameter/material survey.
3. N1/N5/N7 invert survey and full-monsoon dh/dt calibration dataset.
4. Level-2 tide trigger and F4 feed integration.
5. H_geo and supporting LUAS/DID records.
6. Exact N7 coordinate and sensor setting-out.
7. KSB Amacan P 600-350 vendor curve sheet, final motor and propeller selection.

No pending item should be replaced with a demo value presented as a confirmed engineering input.
