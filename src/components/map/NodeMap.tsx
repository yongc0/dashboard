import { useMemo, type ReactNode } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { differenceInMinutes, format } from 'date-fns'
import { nodeConfig } from '../../data/nodeConfig'
import { c1Telemetry, c2Telemetry } from '../../data/controllerConfig'
import { CURRENT_ALERT_LEVEL } from '../../data/mockData'
import type { AlertLevel, NodeId, NodePin } from '../../types'

const STALE_MINUTES = 5
const LEVEL_COLOR: Record<AlertLevel, string> = { 1: '#16a34a', 2: '#ca8a04', 3: '#ea580c', 4: '#dc2626' }
// N4 and N6 are effectively co-located with the N3 outfall infrastructure.
// Small display-only offsets keep every resolved node independently clickable.
const MAP_OFFSETS: Partial<Record<NodeId, [number, number]>> = {
  N4: [-0.00008, 0.00008],
  N6: [0.00008, 0.00012],
}

function mapPosition(node: NodePin): [number, number] {
  const offset = MAP_OFFSETS[node.nodeId] ?? [0, 0]
  return [node.lat! + offset[0], node.lng! + offset[1]]
}

function isStale(node: NodePin) {
  return Boolean(node.lastContact && differenceInMinutes(new Date(), node.lastContact) > STALE_MINUTES)
}

function pinFill(node: NodePin) {
  if (node.flags.arenaStorage) return '#0ea5e9'
  if (node.flags.waterQuality) return '#14b8a6'
  if (node.flags.governmentAsset) return '#2563eb'
  if (isStale(node)) return '#6b7280'
  return LEVEL_COLOR[CURRENT_ALERT_LEVEL]
}

function makeIcon(node: NodePin) {
  const fill = pinFill(node)
  const badge = node.flags.waterQuality ? 'WQ' : node.flags.arenaStorage ? 'ARENA' : node.flags.governmentAsset ? 'POND' : ''
  return L.divIcon({
    html: `<div style="position:relative;width:32px;height:32px">
      ${badge ? `<div style="position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:${fill};color:white;padding:1px 4px;border-radius:3px;font:700 7px system-ui;white-space:nowrap">${badge}</div>` : ''}
      <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${fill};border:3px solid white;box-shadow:0 2px 8px #0005;color:white;font:900 9px system-ui">${node.nodeId}</div>
    </div>`,
    className: '', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18],
  })
}

function makeControllerIcon(controllerId: 'C1' | 'C2', color: string) {
  return L.divIcon({
    html: `<div style="position:relative;width:38px;height:38px">
      <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:${color};color:white;padding:1px 5px;border-radius:3px;font:700 7px system-ui;white-space:nowrap">SCHEMATIC</div>
      <div style="width:38px;height:38px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${color};border:3px dashed white;box-shadow:0 2px 8px #0006;color:white;font:900 10px system-ui">${controllerId}</div>
    </div>`,
    className: '', iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -21],
  })
}

function NodePopup({ node }: { node: NodePin }) {
  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: 'Map status', value: node.mapStatus === 'resolved' ? 'RESOLVED' : 'API ONLY' },
    { label: 'Type', value: node.type },
    { label: 'Sensor', value: node.sensorType },
    { label: 'Commissioning', value: node.deployment.replace('_', ' ').toUpperCase() },
    { label: 'Reading', value: node.reading ? `${node.reading.value} ${node.reading.unit}` : '—' },
    { label: 'Last contact', value: node.lastContact ? format(node.lastContact, 'HH:mm:ss') : 'Not connected' },
  ]
  return (
    <div style={{ minWidth: 235, fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 5 }}>{node.label}</div>
      <Notice color="#166534">Map node resolved. Open engineering inputs are tracked separately from map status.</Notice>
      {MAP_OFFSETS[node.nodeId] && <Notice color="#475569">A small cartographic offset separates co-located markers; the authoritative coordinate remains the value in node data.</Notice>}
      {node.flags.arenaStorage && <Notice color="#0284c7">Revision 11 keeps the storage basis locked and uses the corroborated arena coordinate for this dashboard map.</Notice>}
      {node.flags.waterQuality && <Notice color="#0f766e">Monitoring/reporting only. C1 and C2 remain the local actuation authorities.</Notice>}
      {node.flags.locationUnderReview && <Notice color="#d97706">Project-anchor location remains under review.</Notice>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 5 }}><tbody>{rows.map(row => <tr key={row.label} style={{ borderBottom: '1px solid #f3f4f6' }}><td style={{ padding: '3px 7px 3px 0', color: '#6b7280', whiteSpace: 'nowrap' }}>{row.label}</td><td style={{ padding: '3px 0', color: '#111', fontWeight: 600 }}>{row.value}</td></tr>)}</tbody></table>
      {node.specs?.map((spec, index) => <div key={index} style={{ marginTop: 5, fontSize: 11 }}><span style={{ color: '#6b7280' }}>{spec.label}: </span><strong>{spec.value}</strong>{spec.caveat && <div style={{ color: '#b45309', fontSize: 10 }}>ENGINEERING NOTE: {spec.caveat}</div>}</div>)}
      <div style={{ borderTop: '1px solid #dbeafe', marginTop: 7, paddingTop: 6 }}>
        <div style={{ color: '#1e3a8a', fontSize: 10, fontWeight: 800 }}>REVISION 11 SITE DESIGN · {node.siteDesign.status.replace('_', ' ').toUpperCase()}</div>
        <div style={{ marginTop: 4, fontSize: 10 }}><strong>Enclosure:</strong> {node.siteDesign.enclosure}</div>
        <div style={{ marginTop: 3, fontSize: 10 }}><strong>Power:</strong> {node.siteDesign.power}</div>
        <div style={{ marginTop: 3, fontSize: 10 }}><strong>Maintenance:</strong> {node.siteDesign.maintenance}</div>
      </div>
      {node.designNote && <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 5, marginTop: 6, color: '#4b5563', fontSize: 10 }}>{node.designNote}</div>}
    </div>
  )
}

function Notice({ color, children }: { color: string; children: ReactNode }) {
  return <div style={{ color, border: `1px solid ${color}55`, background: `${color}12`, borderRadius: 4, padding: '3px 6px', marginBottom: 4, fontSize: 10 }}>{children}</div>
}

const TSM_CENTER: [number, number] = [3.032, 101.527]

export default function NodeMap() {
  const pins = useMemo(() => nodeConfig.filter(node => node.mapStatus === 'resolved' && node.lat !== null && node.lng !== null), [])
  const bounds = useMemo(() => pins.map(mapPosition), [pins])
  const n7 = nodeConfig.find(node => node.nodeId === 'N7')!

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 text-xs">
        <div className="px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-green-800"><strong>All physical node locations are resolved on this map.</strong> N2 remains off-map because it is a JPS/DID API feed, not a physical node.</div>
        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"><strong>C1 is schematic.</strong> Local penstock PLC at the south-west collector-loop / arena inlet.</div>
        <div className="px-3 py-2 bg-cyan-50 border border-cyan-100 rounded-lg text-cyan-800"><strong>C2 is separate from C1.</strong> Local sump-pump PLC at the arena low point / wet well.</div>
      </div>
      <MapContainer bounds={bounds} boundsOptions={{ padding: [50, 50] }} center={bounds.length ? undefined : TSM_CENTER} zoom={bounds.length ? undefined : 14} style={{ height: 430, width: '100%', borderRadius: 12, zIndex: 0 }} scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {pins.map(node => <Marker key={node.nodeId} position={mapPosition(node)} icon={makeIcon(node)}><Popup maxWidth={300}><NodePopup node={node} /></Popup><Tooltip direction="top" offset={[0, -18]}><strong>{node.nodeId}</strong> · {node.type}</Tooltip></Marker>)}
        <Marker position={[n7.lat! - 0.00025, n7.lng! - 0.00025]} icon={makeControllerIcon('C1', '#172554')} zIndexOffset={500}>
          <Popup><div style={{ minWidth: 220, fontFamily: 'system-ui' }}><strong>C1 — {c1Telemetry.name}</strong><p style={{ fontSize: 11, color: '#4b5563' }}>{c1Telemetry.location}</p><p style={{ fontSize: 10, color: '#475569' }}>Schematic controller marker anchored to the resolved arena site; not a claimed survey point.</p><div style={{ fontSize: 11 }}>State: <strong>{c1Telemetry.controlState}</strong><br />Gate: <strong>{c1Telemetry.confirmedPosition}</strong><br />Power basis: <strong>MAINS + ≥72 h UPS RECOMMENDED</strong></div></div></Popup>
        </Marker>
        <Marker position={[n7.lat! + 0.00018, n7.lng! + 0.00018]} icon={makeControllerIcon('C2', '#0e7490')} zIndexOffset={500}>
          <Popup><div style={{ minWidth: 220, fontFamily: 'system-ui' }}><strong>C2 — {c2Telemetry.name}</strong><p style={{ fontSize: 11, color: '#4b5563' }}>{c2Telemetry.location}</p><p style={{ fontSize: 10, color: '#475569' }}>Schematic controller marker anchored to the resolved arena site; not a claimed survey point.</p><div style={{ fontSize: 11 }}>State: <strong>{c2Telemetry.state}</strong><br />Duty: <strong>{c2Telemetry.dutyFlowM3h} m³/h @ ~{c2Telemetry.designHeadM} m</strong><br />Power basis: <strong>MAINS / GENSET REQUIRED</strong></div></div></Popup>
        </Marker>
      </MapContainer>
      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
        <Legend color={LEVEL_COLOR[CURRENT_ALERT_LEVEL]} label="Resolved physical node" />
        <Legend color="#172554" label="C1 local PLC (schematic)" square />
        <Legend color="#0e7490" label="C2 local PLC (schematic)" square />
        <Legend color="#14b8a6" label="Water quality" />
        <Legend color="#0ea5e9" label="Arena storage node" />
        <Legend color="#2563eb" label="Government pond node" />
      </div>
    </div>
  )
}

function Legend({ color, label, square = false }: { color: string; label: string; square?: boolean }) {
  return <span className="flex items-center gap-1"><span className={`w-3 h-3 inline-block ${square ? 'rounded-sm' : 'rounded-full'}`} style={{ background: color }} />{label}</span>
}
