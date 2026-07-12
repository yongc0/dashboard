import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { AlertLevel } from '../../types'

const LEVEL_COLOR: Record<AlertLevel, string> = {
  1: '#16a34a',
  2: '#ca8a04',
  3: '#ea580c',
  4: '#dc2626',
}

const LEVEL_LABEL: Record<AlertLevel, { bm: string; en: string }> = {
  1: { bm: 'BERWASPADA', en: 'WATCH' },
  2: { bm: 'BERHATI-HATI', en: 'CAUTION' },
  3: { bm: 'AMARAN', en: 'WARNING' },
  4: { bm: 'BAHAYA KRITIKAL', en: 'CRITICAL' },
}

const TSM_CENTER: [number, number] = [3.030, 101.527]
const TSM_RADIUS_M = 600  // approximate affected area radius in metres

interface Props {
  level: AlertLevel
  lang: 'bm' | 'en'
}

// Public-facing map: shows only the area alert level.
// No node diagnostics, no sensor readings, no operator detail.
export default function PublicMap({ level, lang }: Props) {
  const color = LEVEL_COLOR[level]
  const label = LEVEL_LABEL[level]

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
              <div style={{ fontWeight: 900, fontSize: 15, color }}>
                {lang === 'bm' ? label.bm : label.en}
              </div>
              <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>
                Taman Sri Muda · Level {level}
              </div>
            </div>
          </Popup>
        </Circle>
      </MapContainer>
      <div style={{ background: color, color: 'white', textAlign: 'center', padding: '6px 0', fontSize: 12, fontWeight: 700 }}>
        {lang === 'bm'
          ? `Kawasan ini: Tahap ${level} — ${label.bm}`
          : `This area: Level ${level} — ${label.en}`}
      </div>
    </div>
  )
}
