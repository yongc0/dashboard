import { useMemo, type ReactNode } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { differenceInMinutes, format } from 'date-fns'
import { nodeConfig } from '../../data/nodeConfig'
import { CURRENT_ALERT_LEVEL } from '../../data/mockData'
import type { NodePin, AlertLevel } from '../../types'

const STALE_MINUTES = 5

const LEVEL_COLOR: Record<AlertLevel, string> = {
  1: '#16a34a',
  2: '#ca8a04',
  3: '#ea580c',
  4: '#dc2626',
}

const CONFIDENCE_LABEL: Record<string, { text: string; bg: string; text2: string }> = {
  good:     { text: 'GOOD',    bg: '#16a34a', text2: 'white' },
  degraded: { text: 'DEGRADED', bg: '#ca8a04', text2: 'white' },
  stale:    { text: 'STALE',   bg: '#6b7280', text2: 'white' },
  pending:  { text: 'PENDING', bg: '#9ca3af', text2: 'white' },
}

function isStale(node: NodePin): boolean {
  if (!node.lastContact) return false
  return differenceInMinutes(new Date(), node.lastContact) > STALE_MINUTES
}

function pinFill(node: NodePin): string {
  if (node.flags.proposed) return '#8b5cf6'
  if (node.flags.pending) return '#9ca3af'
  if (node.flags.auxiliaryDetention) return '#0ea5e9'  // N7 — tidally-connected wet basin
  if (node.flags.releaseControl) return '#d97706'       // N8 — release-control gate
  if (node.flags.reportingOnly) return '#14b8a6'
  if (isStale(node)) return '#6b7280'
  return LEVEL_COLOR[CURRENT_ALERT_LEVEL]
}

function makeIcon(node: NodePin): L.DivIcon {
  const stale = isStale(node)
  const fill = pinFill(node)
  const opacity = stale || node.flags.proposed || node.flags.approximate ? '0.65' : '1'
  const border = node.flags.proposed || node.flags.approximate ? 'dashed' : 'solid'

  const reviewBadge = node.flags.locationUnderReview
    ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#f59e0b;color:white;font-size:7px;font-weight:700;padding:1px 4px;border-radius:3px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.3)">⚠ LOC REVIEW</div>`
    : ''
  const proposedBadge = node.flags.proposed
    ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#8b5cf6;color:white;font-size:7px;font-weight:700;padding:1px 4px;border-radius:3px;white-space:nowrap">PROPOSED</div>`
    : ''
  const approxBadge = node.flags.approximate
    ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#64748b;color:white;font-size:7px;font-weight:700;padding:1px 4px;border-radius:3px;white-space:nowrap">~ APPROX</div>`
    : ''
  const envBadge = node.flags.reportingOnly
    ? `<div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);background:#14b8a6;color:white;font-size:7px;font-weight:700;padding:1px 4px;border-radius:3px">ENV</div>`
    : ''
  const auxBadge = node.flags.auxiliaryDetention
    ? `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#0ea5e9;color:white;font-size:7px;font-weight:700;padding:1px 4px;border-radius:3px;white-space:nowrap">AUX BASIN</div>`
    : ''
  const gateBadge = node.flags.releaseControl
    ? `<div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);background:#d97706;color:white;font-size:7px;font-weight:700;padding:1px 4px;border-radius:3px;white-space:nowrap">REL GATE</div>`
    : ''
  const staleRing = stale
    ? `<div style="position:absolute;inset:-5px;border-radius:50%;border:2px solid #ef4444;opacity:0.7;animation:stale-pulse 1.5s ease-in-out infinite;"></div>`
    : ''

  return L.divIcon({
    html: `
      <style>
        @keyframes stale-pulse {
          0%,100%{transform:scale(1);opacity:0.7}
          50%{transform:scale(1.3);opacity:0.2}
        }
      </style>
      <div style="position:relative;width:30px;height:30px;">
        ${staleRing}
        ${reviewBadge}
        ${proposedBadge}
        ${approxBadge}
        ${auxBadge}
        <div style="
          width:30px;height:30px;border-radius:50%;
          background:${fill};
          border:2.5px ${border} white;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:900;font-size:9px;
          opacity:${opacity};
          font-family:system-ui,sans-serif;
        ">${node.nodeId}</div>
        ${envBadge}
        ${gateBadge}
      </div>
    `,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  })
}

function NodePopup({ node }: { node: NodePin }) {
  const stale = isStale(node)
  const cf = CONFIDENCE_LABEL[node.confidence] || CONFIDENCE_LABEL.pending
  const minutesAgo = node.lastContact ? differenceInMinutes(new Date(), node.lastContact) : null
  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: 'Type', value: node.type },
    { label: 'Sensor', value: node.sensorType },
    { label: 'Source', value: <span style={{ background: node.provenance === 'onsite' ? '#dbeafe' : '#fef9c3', padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight: 700 }}>{node.provenance}</span> },
    { label: 'Reading', value: node.reading ? `${node.reading.value} ${node.reading.unit}` : '—' },
    {
      label: 'Last contact',
      value: node.lastContact
        ? <span style={{ color: stale ? '#dc2626' : '#16a34a' }}>{format(node.lastContact, 'HH:mm:ss')} {stale ? `⚠ STALE (${minutesAgo}m ago)` : ''}</span>
        : 'Not connected',
    },
    { label: 'Confidence', value: <span style={{ background: cf.bg, color: cf.text2, padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight: 700 }}>{cf.text}</span> },
  ]

  if (node.batteryPct !== undefined && node.batteryPct > 0) {
    rows.push({ label: 'Battery', value: `${node.batteryPct}%` })
  }
  if (node.loraUptime !== undefined && node.loraUptime > 0) {
    rows.push({ label: 'LoRa uptime', value: `${node.loraUptime}%` })
  }

  return (
    <div style={{ minWidth: 220, fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#111' }}>{node.label}</div>

      {/* Flags */}
      {node.flags.locationUnderReview && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 4, padding: '3px 6px', marginBottom: 4, fontSize: 11, color: '#92400e' }}>
          ⚠ Location under review — project anchor position; not yet confirmed as worst drainage bottleneck
        </div>
      )}
      {node.flags.proposed && (
        <div style={{ background: '#f3e8ff', border: '1px solid #8b5cf6', borderRadius: 4, padding: '3px 6px', marginBottom: 4, fontSize: 11, color: '#5b21b6' }}>
          ⏳ PROPOSED — inclusion pending SLB financing decision. Candidate KPI-grade instrument.
        </div>
      )}
      {node.flags.reportingOnly && (
        <div style={{ background: '#f0fdfa', border: '1px solid #14b8a6', borderRadius: 4, padding: '3px 6px', marginBottom: 4, fontSize: 11, color: '#115e59' }}>
          🔬 Reporting only — environmental KPI & green-bond compliance. Not a flood-control signal. No discharge gate.
        </div>
      )}
      {node.flags.approximate && (
        <div style={{ background: '#f1f5f9', border: '1px dashed #64748b', borderRadius: 4, padding: '3px 6px', marginBottom: 4, fontSize: 11, color: '#334155' }}>
          📍 Approximate position only — placeholder on Sg. Klang. NOT a surveyed coordinate; pending DID confirmation of the gauge location.
        </div>
      )}
      {node.flags.pending && (
        <div style={{ background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: 4, padding: '3px 6px', marginBottom: 4, fontSize: 11, color: '#374151' }}>
          ⏳ DID station identified (rainfall 3015084), but water-level station ID still PENDING — feed not yet wired.
        </div>
      )}
      {node.flags.auxiliaryDetention && (
        <div style={{ background: '#e0f2fe', border: '1px solid #0ea5e9', borderRadius: 4, padding: '3px 6px', marginBottom: 4, fontSize: 11, color: '#075985' }}>
          🌊 Auxiliary detention — tidally-connected WET basin (LOCKED). Usable storage = footprint × freeboard, not full excavated volume.
        </div>
      )}
      {node.flags.releaseControl && (
        <div style={{ background: '#fef3c7', border: '1px solid #d97706', borderRadius: 4, padding: '3px 6px', marginBottom: 4, fontSize: 11, color: '#92400e' }}>
          🚦 Release-control gate — conditional hold during baseline ops only. UNCONDITIONALLY SUSPENDED at Alert L3+ (flood discharge wins).
        </div>
      )}
      {node.flags.datumUnconfirmed && !node.flags.auxiliaryDetention && (
        <div style={{ background: '#fff7ed', border: '1px solid #fb923c', borderRadius: 4, padding: '3px 6px', marginBottom: 4, fontSize: 11, color: '#9a3412' }}>
          ⚠ Datum unconfirmed — do not combine these values with AMSL figures until LUAS/DID confirm.
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {rows.map(row => (
          <tr key={row.label} style={{ borderBottom: '1px solid #f3f4f6' }}>
            <td style={{ padding: '3px 0', color: '#6b7280', paddingRight: 8, whiteSpace: 'nowrap' }}>{row.label}</td>
            <td style={{ padding: '3px 0', fontWeight: 500, color: '#111' }}>{row.value}</td>
          </tr>
        ))}
      </table>

      {/* Node-specific engineering specs */}
      {node.specs && node.specs.length > 0 && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e5e7eb' }}>
          {node.specs.map((s, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11 }}>
                <span style={{ color: '#6b7280' }}>{s.label}: </span>
                <span style={{ fontWeight: 600, color: '#111' }}>{s.value}</span>
              </div>
              {s.caveat && <div style={{ fontSize: 10, color: '#b45309', lineHeight: 1.3 }}>⏳ {s.caveat}</div>}
            </div>
          ))}
        </div>
      )}

      {node.designNote && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e5e7eb', fontSize: 10, color: '#4b5563', lineHeight: 1.4, fontStyle: 'italic' }}>
          {node.designNote}
        </div>
      )}
    </div>
  )
}

const TSM_CENTER: [number, number] = [3.032, 101.527]

export default function NodeMap() {
  const pins = useMemo(() => nodeConfig.filter(n => n.lat !== null && n.lng !== null), [])
  // Auto-fit the view to every plotted node (N1–N8).
  const bounds = useMemo(
    () => pins.map(n => [n.lat!, n.lng!] as [number, number]),
    [pins]
  )

  return (
    <div>
      {/* N2 approximate-position notice */}
      <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
        <span className="font-bold text-slate-700">N2</span>
        <span>Sg. Klang di Taman Sri Muda (DID InfoBanjir) — station identified (rainfall ID 3015084). Pin shows an <strong>approximate</strong> river position only; surveyed coordinate + water-level station ID still PENDING DID confirmation.</span>
        <span className="ml-auto px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-bold whitespace-nowrap">~ APPROX</span>
      </div>

      <MapContainer
        bounds={bounds.length ? bounds : undefined}
        boundsOptions={{ padding: [50, 50] }}
        center={bounds.length ? undefined : TSM_CENTER}
        zoom={bounds.length ? undefined : 14}
        style={{ height: 420, width: '100%', borderRadius: 12, zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map(node => (
          <Marker
            key={node.nodeId}
            position={[node.lat!, node.lng!]}
            icon={makeIcon(node)}
          >
            <Popup maxWidth={280}><NodePopup node={node} /></Popup>
            <Tooltip direction="top" offset={[0, -18]} opacity={0.9}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{node.nodeId} — {node.type}</span>
              {node.reading && <span> · {node.reading.value} {node.reading.unit}</span>}
              {isStale(node) && <span style={{ color: '#dc2626' }}> ⚠ STALE</span>}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Map legend */}
      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: LEVEL_COLOR[CURRENT_ALERT_LEVEL] }} /> Onsite (alert-coloured)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block bg-purple-500" /> Govt pond, proposed KPI (N5)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block bg-teal-500" /> Discharge compliance, reporting only (N6)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: '#0ea5e9' }} /> Aux wet basin (N7)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: '#d97706' }} /> Release-control gate (N8)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block border border-dashed border-slate-500 bg-slate-300" /> Approx. position, DID (N2)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block bg-gray-400" /> Stale / no contact</span>
        <span className="flex items-center gap-1"><span className="text-yellow-500 font-bold">⚠</span> Location under review (N1)</span>
      </div>
    </div>
  )
}
