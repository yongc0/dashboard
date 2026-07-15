# TSM Monitoring System v11 — Dashboard Reconciliation

Source reviewed: `../TSM_Monitoring_System_v11.docx`.

Revision 11 retains the v10 sensing, control, alert-fusion and KPI decisions. Its new scope is the enclosure, power-supply and maintenance-access basis for each physical node, together with a power-resilience finding for C1 and C2.

## Newly implemented from v11

### Per-node site design

Every physical node now carries a structured `siteDesign` record and displays it in the map popup and Infrastructure Health tab:

- **N1:** IP66 pole enclosure; indicative 20 Wp + 20 Ah solar/battery; quarterly funnel and radar-lens maintenance.
- **N3 + N6:** enlarged shared IP66 outfall enclosure; indicative combined 20 Wp + 20 Ah supply or mains; six-monthly N3 vent/desiccant inspection plus N6 probe-fouling maintenance.
- **N4:** IP66 clamp-point enclosure; mains tie-in preferred subject to DID permission, with solar fallback; clamp-face and controlled-site-access maintenance.
- **N5:** IP66 pond-edge pole enclosure; indicative 15 Wp + 15 Ah solar/battery; panel, battery and rain-gauge debris checks.
- **N7:** corrosion-resistant radar gantry above the +2.50 m arena-rim datum; independent solar/battery supply separate from C2; dry-period access planning.
- **N8:** standalone IP66 enclosure; solar/battery sized for continuous probe load; probe service kept separate from semi-annual BOD₅ sampling.
- **N2:** enclosure, power and physical maintenance are not applicable because it is an API feed.

All these values remain visibly identified as **working assumptions**, not vendor quotations, confirmed costs or completed commissioning.

### Controller and gateway power resilience

- C1 now shows the v11 recommendation for mains-fed normal operation with at least 72 hours of battery/UPS backup.
- C2 now shows mains or genset power as a hard requirement for the pump circuit, with only a small PLC UPS for controlled shutdown and logging.
- Solar-primary is no longer presented as the preferred power design for either actuating controller.
- The gateways show mains-normal power with their locked ≥72 h battery backup.
- The C1/C2 and N3/N4 mains-tie-in enquiries have been added to the blocker ledger.

### Maintenance evidence

- Added solar-panel output/soiling, battery autonomy, N3 vent-tube/desiccant, C1 motor-current, C2 pump-current/run-hours and N6/N8 probe-fouling maintenance context.
- Infrastructure reporting now includes the v11 enclosure, power and access basis.

## Map-status reconciliation

The map now distinguishes **geographic map status** from **engineering/commissioning status**:

- N1, N3, N4, N5, N6, N7 and N8 all render as solid, resolved physical-node markers.
- N2 remains intentionally absent because it is the JPS/DID API integration, not a physical node.
- N7 uses the documented 3.030444, 101.527556 dashboard position. Exact construction setting-out remains an engineering note rather than a pending map node.
- N4's pipe survey, N5/N7 commissioning and all power/calibration dependencies remain visible in popups and the blocker ledger without changing map-location status.
- C1 and C2 remain explicitly schematic controller markers anchored to the resolved arena site; they do not claim surveyed controller coordinates.

## Remaining external or field dependencies

1. Live N2 JPS/DID API/data-sharing access.
2. N4 pipe diameter and material survey.
3. N1/N5/N7 invert survey and one-monsoon dh/dt calibration record.
4. L2 tide-forecast trigger and F4 integration.
5. H_geo and LUAS/DID records.
6. N7 construction setting-out and final sensor range.
7. KSB Amacan P 600-350 vendor curve sheet.
8. C1/C2 mains-tie-in feasibility.
9. N3/N4 mains-tie-in feasibility and DID permission for N4.

These dependencies must remain visible, but none should be represented as an unresolved physical map node.
