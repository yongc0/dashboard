import { format, differenceInDays } from 'date-fns'
import { Battery, Sun, Wifi, Zap, Wrench, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { assets, sensors, solarStats } from '../../../data/mockData'

const STATUS_CONFIG = {
  operational: { label: 'Operational', color: 'text-green-700 bg-green-100', icon: <CheckCircle size={13} /> },
  maintenance: { label: 'Scheduled Maint.', color: 'text-yellow-700 bg-yellow-100', icon: <Wrench size={13} /> },
  fault: { label: 'Fault', color: 'text-red-700 bg-red-100', icon: <XCircle size={13} /> },
}

const CALIBRATION_ROWS = [
  { name: 'N1 Rain Gauge (TSM)', type: 'Radar FMCW + tipping-bucket cross-check', cal: 'Factory cal.; field acceptance pending', ref: 'DID rainfall station 3015084 cross-check (not wired)', status: 'pending' },
  { name: 'N2 Sg. Klang DID Feed', type: 'Borrowed InfoBanjir water-level feed', cal: 'PENDING water-level station ID', ref: 'DID station metadata + datum confirmation required', status: 'pending' },
  { name: 'N3 Water Gate & Pump House', type: 'Radar FMCW', cal: 'Field recalibration required after stale-contact event', ref: 'Surveyed Z_invert still PENDING', status: 'attention' },
  { name: 'N4 Pump Station', type: 'Pressure / level transducer', cal: 'Factory cal.; head-derating pending', ref: 'Q_pump 10.2 m³/s nameplate caveat applies', status: 'valid' },
]

// Gantt-style bar (simplified: % through 90-day window)
function GanttBar({ from, to, status }: { from: Date; to: Date; status: string }) {
  const now = new Date()
  const windowStart = new Date(now.getTime() - 30 * 86400000)
  const windowEnd = new Date(now.getTime() + 90 * 86400000)
  const total = windowEnd.getTime() - windowStart.getTime()
  const startPct = Math.max(0, (from.getTime() - windowStart.getTime()) / total) * 100
  const endPct = Math.min(100, (to.getTime() - windowStart.getTime()) / total) * 100
  const colors: Record<string, string> = { operational: '#22c55e', maintenance: '#eab308', fault: '#ef4444' }
  return (
    <div className="relative w-full h-5 bg-gray-100 rounded-full">
      <div className="absolute top-0 h-5 rounded-full opacity-70" style={{ left: `${startPct}%`, width: `${endPct - startPct}%`, background: colors[status] || '#6b7280' }} />
      <div className="absolute top-0 bottom-0 w-px bg-blue-500 opacity-60" style={{ left: '25%' }} title="Today" />
    </div>
  )
}

export default function InfraHealthTab() {
  // Only owned hardware carries battery/LoRa telemetry. N2 is a borrowed DID feed —
  // showing it at 0% battery would misread as a fault.
  const onsiteSensors = sensors.filter(s => s.provenance === 'onsite')

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Asset health */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-700">Asset Health</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {assets.map((a, i) => {
            const cfg = STATUS_CONFIG[a.status]
            const daysUntil = differenceInDays(a.nextMaintenance, new Date())
            return (
              <div key={`${a.id}-${i}`} className="px-5 py-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base">
                  {a.type === 'pump' ? '⚙️' : a.type === 'gate' ? '🚧' : a.type === 'generator' ? '⚡' : '📡'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">{a.name}</div>
                  <div className="text-xs text-gray-400">Last maintained: {format(a.lastMaintained, 'dd MMM yyyy')}</div>
                </div>
                <div className="w-48">
                  <GanttBar from={a.lastMaintained} to={a.nextMaintenance} status={a.status} />
                  <div className="text-xs text-gray-400 mt-0.5">Next: {daysUntil < 0 ? <span className="text-red-600 font-bold">OVERDUE</span> : `in ${daysUntil}d`}</div>
                </div>
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                  {cfg.icon}{cfg.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Power & comms panel — owned onsite hardware only (N2 is a borrowed DID feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Zap size={16} className="text-yellow-500" /> Power & Solar</h4>
          <div className="space-y-3">
            {onsiteSensors.map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <Sun size={14} className={s.solarCharging ? 'text-yellow-400' : 'text-gray-300'} />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">{s.name.split('(')[0].trim()}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${s.batteryPct}%`, background: s.batteryPct > 50 ? '#22c55e' : s.batteryPct > 20 ? '#eab308' : '#ef4444' }} />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-8">{s.batteryPct}%</span>
                  </div>
                </div>
                <Battery size={14} className={s.batteryPct > 50 ? 'text-green-500' : 'text-yellow-500'} />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Solar instant output</span>
              <span className="font-bold text-yellow-600">{solarStats.instantKW} kW</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Today's generation</span>
              <span className="font-bold text-gray-800">{solarStats.todayKWh} kWh</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Wifi size={16} className="text-blue-500" /> Comms & Connectivity</h4>
          <div className="space-y-3">
            {onsiteSensors.map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">{s.type} node</div>
                  <div className="text-xs font-semibold text-gray-700">LoRaWAN</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${s.loraUptime > 98 ? 'text-green-600' : s.loraUptime > 95 ? 'text-yellow-600' : 'text-red-600'}`}>{s.loraUptime}%</div>
                  <div className="text-xs text-gray-400">uptime</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${s.loraUptime > 98 ? 'bg-green-500' : s.loraUptime > 95 ? 'bg-yellow-500' : 'bg-red-500'}`} />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cellular backhaul</span>
              <span className="font-bold text-green-600">Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">LoRaWAN gateway</span>
              <span className="font-bold text-green-600">Online</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Offline fallback (SMS)</span>
              <span className="font-bold text-yellow-600">Spec pending</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">N2 (DID InfoBanjir)</span>
              <span className="font-bold text-gray-400">Borrowed feed — no owned hardware</span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-sensor calibration */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-700">Sensor Calibration & Provenance</h3>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wide">
              <th className="text-left px-5 py-2">Sensor</th>
              <th className="text-left px-5 py-2">Type</th>
              <th className="text-left px-5 py-2">Last Calibrated</th>
              <th className="text-left px-5 py-2">Reference</th>
              <th className="text-left px-5 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {CALIBRATION_ROWS.map(r => (
              <tr key={r.name} className="hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-gray-800">{r.name}</td>
                <td className="px-5 py-3 text-gray-500">{r.type}</td>
                <td className="px-5 py-3 text-gray-500">{r.cal}</td>
                <td className="px-5 py-3 text-gray-500">{r.ref}</td>
                <td className="px-5 py-3">
                  {r.status === 'valid'
                    ? <span className="flex items-center gap-1 text-green-700 text-xs font-bold"><CheckCircle size={12} /> Valid</span>
                    : r.status === 'attention'
                      ? <span className="flex items-center gap-1 text-yellow-700 text-xs font-bold"><AlertTriangle size={12} /> Attention</span>
                      : <span className="flex items-center gap-1 text-gray-500 text-xs font-bold"><AlertTriangle size={12} /> Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
