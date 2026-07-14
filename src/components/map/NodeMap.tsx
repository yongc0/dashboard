import { useMemo, type ReactNode } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { differenceInMinutes, format } from 'date-fns'
import { nodeConfig } from '../../data/nodeConfig'
import { c1Telemetry } from '../../data/controllerConfig'
import { CURRENT_ALERT_LEVEL } from '../../data/mockData'
import type { AlertLevel, NodePin } from '../../types'

const STALE_MINUTES = 5
const LEVEL_COLOR: Record<AlertLevel, string> = { 1: '#16a34a', 2: '#ca8a04', 3: '#ea580c', 4: '#dc2626' }

function isStale(node: NodePin) {
  return Boolean(node.lastContact && differenceInMinutes(new Date(), node.lastContact) > STALE_MINUTES)
}

function pinFill(node: NodePin) {
  if (node.flags.conditional) return '#9ca3af'
  if (node.flags.arenaStorage) return '#0ea5e9'
  if (node.flags.waterQuality) return '#14b8a6'
  if (node.deployment !== 'installed') return '#8b5cf6'
  if (isStale(node)) return '#6b7280'
  return LEVEL_COLOR[CURRENT_ALERT_LEVEL]
}

function makeIcon(node: NodePin) {
  const fill = pinFill(node)
  const dashed = node.deployment !== 'installed' || node.flags.coordinateUnconfirmed || node.flags.conditional
  const badge = node.flags.conditional ? 'D1' : node.flags.coordinateUnconfirmed ? 'COORD ?' : node.flags.waterQuality ? 'WQ' : node.flags.arenaStorage ? 'ARENA' : ''
  return L.divIcon({
    html: `<div style="position:relative;width:32px;height:32px">
      ${badge ? `<div style="position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:${fill};color:white;padding:1px 4px;border-radius:3px;font:700 7px system-ui;white-space:nowrap">${badge}</div>` : ''}
      <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${fill};border:3px ${dashed ? 'dashed' : 'solid'} white;box-shadow:0 2px 8px #0005;color:white;font:900 9px system-ui;opacity:${dashed ? '.72' : '1'}">${node.nodeId}</div>
    </div>`,
    className: '', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18],
  })
}

function makeControllerIcon() {
  return L.divIcon({
    html: `<div style="position:relative;width:38px;height:38px">
      <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#172554;color:white;padding:1px 5px;border-radius:3px;font:700 7px system-ui;white-space:nowrap">SCHEMATIC</div>
      <div style="width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#172554;border:3px dashed white;box-shadow:0 2px 8px #0006;color:white;font:900 10px system-ui">C1</div>
    </div>`,
    className: '', iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -21],
  })
}

function NodePopup({ node }: { node: NodePin }) {
  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: 'Type', value: node.type },
    { label: 'Sensor', value: node.sensorType },
    { label: 'Deployment', value: node.deployment.replace('_', ' ').toUpperCase() },
    { label: 'Reading', value: node.reading ? `${node.reading.value} ${node.reading.unit}` : '—' },
    { label: 'Last contact', value: node.lastContact ? format(node.lastContact, 'HH:mm:ss') : 'Not connected' },
  ]
  return (
    <div style={{ minWidth: 235, fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 5 }}>{node.label}</div>
      {node.flags.conditional && <Notice color="#6b7280">CONDITIONAL — N6 remains removed until Decision D1.</Notice>}
      {node.flags.coordinateUnconfirmed && <Notice color="#0284c7">Coordinate is a Revision 7 candidate; verification remains open.</Notice>}
      {node.flags.arenaStorage && <Notice color="#0284c7">Storage zones, authoritative area and volume remain unresolved.</Notice>}
      {node.flags.waterQuality && <Notice color="#0f766e">Monitoring only. N8 does not control the penstock.</Notice>}
      {node.flags.locationUnderReview && <Notice color="#d97706">Project-anchor location remains under review.</Notice>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 5 }}><tbody>{rows.map(row => <tr key={row.label} style={{ borderBottom: '1px solid #f3f4f6' }}><td style={{ padding: '3px 7px 3px 0', color: '#6b7280', whiteSpace: 'nowrap' }}>{row.label}</td><td style={{ padding: '3px 0', color: '#111', fontWeight: 600 }}>{row.value}</td></tr>)}</tbody></table>
      {node.specs?.map((spec, index) => <div key={index} style={{ marginTop: 5, fontSize: 11 }}><span style={{ color: '#6b7280' }}>{spec.label}: </span><strong>{spec.value}</strong>{spec.caveat && <div style={{ color: '#b45309', fontSize: 10 }}>PENDING/CAVEAT: {spec.caveat}</div>}</div>)}
      {node.designNote && <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 5, marginTop: 6, color: '#4b5563', fontSize: 10 }}>{node.designNote}</div>}
    </div>
  )
}

function Notice({ color, children }: { color: string; children: ReactNode }) {
  return <div style={{ color, border: `1px solid ${color}55`, background: `${color}12`, borderRadius: 4, padding: '3px 6px', marginBottom: 4, fontSize: 10 }}>{children}</div>
}

const TSM_CENTER: [number, number] = [3.032, 101.527]

export default function NodeMap() {
  const pins = useMemo(() => nodeConfig.filter(node => node.lat !== null && node.lng !== null), [])
  const bounds = useMemo(() => pins.map(node => [node.lat!, node.lng!] as [number, number]), [pins])
  const n7 = nodeConfig.find(node => node.nodeId === 'N7')!

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-xs">
        <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-800"><strong>N2 is not mapped.</strong> It is a JPS/DID API call using stations 3015432 / 3015084; role mapping, API access and datum remain pending.</div>
        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"><strong>C1 is shown schematically at the N7 anchor.</strong> Revision 7 provides the penstock location description but no confirmed GPS coordinate.</div>
      </div>
      <MapContainer bounds={bounds} boundsOptions={{ padding: [50, 50] }} center={bounds.length ? undefined : TSM_CENTER} zoom={bounds.length ? undefined : 14} style={{ height: 430, width: '100%', borderRadius: 12, zIndex: 0 }} scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {pins.map(node => <Marker key={node.nodeId} position={[node.lat!, node.lng!]} icon={makeIcon(node)}><Popup maxWidth={300}><NodePopup node={node} /></Popup><Tooltip direction="top" offset={[0, -18]}><strong>{node.nodeId}</strong> · {node.type}</Tooltip></Marker>)}
        <Marker position={[n7.lat!, n7.lng!]} icon={makeControllerIcon()} zIndexOffset={500}>
          <Popup><div style={{ minWidth: 220, fontFamily: 'system-ui' }}><strong>C1 — {c1Telemetry.name}</strong><p style={{ fontSize: 11, color: '#4b5563' }}>{c1Telemetry.location}</p><p style={{ fontSize: 10, color: '#b45309' }}>Schematic placement only; exact penstock coordinate pending.</p><div style={{ fontSize: 11 }}>Mode: <strong>{c1Telemetry.mode}</strong><br />Gate: <strong>{c1Telemetry.confirmedPosition}</strong><br />Interlock: <strong>{c1Telemetry.backflowInterlock ? 'ACTIVE' : 'CLEAR'}</strong></div></div></Popup>
        </Marker>
      </MapContainer>
      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
        <Legend color={LEVEL_COLOR[CURRENT_ALERT_LEVEL]} label="Installed monitoring" />
        <Legend color="#172554" label="C1 local PLC (schematic)" square />
        <Legend color="#14b8a6" label="Water quality" />
        <Legend color="#0ea5e9" label="Arena storage unresolved" />
        <Legend color="#8b5cf6" label="Proposed / pending" />
        <Legend color="#9ca3af" label="Conditional N6" />
      </div>
    </div>
  )
}

function Legend({ color, label, square = false }: { color: string; label: string; square?: boolean }) {
  return <span className="flex items-center gap-1"><span className={`w-3 h-3 inline-block ${square ? 'rounded-sm' : 'rounded-full'}`} style={{ background: color }} />{label}</span>
}
