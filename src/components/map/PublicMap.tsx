import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { AlertLevel } from '../../types'

const LEVEL_COLOR: Record<AlertLevel, string> = {
  1: '#16a34a',
  2: '#ca8a04',
  3: '#ea580c',
  4: '#dc2626',
}

const TSM_CENTER: [number, number] = [3.030, 101.527]
const TSM_RADIUS_M = 600  // approximate affected area radius in metres

interface Props {
  level: AlertLevel | null
  levelLabel: string   // already localised by the caller
  areaPrefix: string   // e.g. "This area: Level"
}

// Public-facing map: shows only the area alert level.
// No node diagnostics, no sensor readings, no operator detail.
// Language-agnostic — the caller passes pre-localised strings.
export default function PublicMap({ level, levelLabel, areaPrefix }: Props) {
  const color = level === null ? '#0f766e' : LEVEL_COLOR[level]
  const levelText = level === null ? '—' : level

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `2px solid ${color}30` }}>
      <MapContainer
        center={TSM_CENTER}
        zoom={14}
        style={{ height: 260, width: '100%', zIndex: 0 }}
        scrollWheelZoom={false}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={TSM_CENTER}
          radius={TSM_RADIUS_M}
          pathOptions={{ color, fillColor: color, fillOpacity: 0.25, weight: 2 }}
        >
          <Popup>
            <div style={{ textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
              <div style={{ fontWeight: 900, fontSize: 15, color }}>{levelLabel}</div>
              <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>
                Taman Sri Muda · Level {levelText}
              </div>
            </div>
          </Popup>
        </Circle>
      </MapContainer>
      <div style={{ background: color, color: 'white', textAlign: 'center', padding: '6px 0', fontSize: 12, fontWeight: 700 }}>
        {areaPrefix} {levelText} — {levelLabel}
      </div>
    </div>
  )
}
