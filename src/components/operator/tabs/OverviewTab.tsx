import { format } from 'date-fns'
import { Activity, Droplets, Zap, AlertOctagon } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { alertState, sensors, pondHistory, solarStats } from '../../../data/mockData'

const LEVEL_COLORS = ['', '#16a34a', '#ca8a04', '#ea580c', '#dc2626']
const LEVEL_LABELS = ['', 'WATCH', 'CAUTION', 'WARNING', 'CRITICAL']

export default function OverviewTab() {
  const level = alertState.level

  return (
    <div className="p-6 space-y-6">
      {/* Alert banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl text-white font-bold" style={{ background: LEVEL_COLORS[level] }}>
        <AlertOctagon size={22} />
        <span>ALERT LEVEL {level} — {LEVEL_LABELS[level]} · Triggered {format(alertState.triggeredAt, 'HH:mm dd MMM')}</span>
        <span className="ml-auto text-sm font-normal opacity-80">Signals: {alertState.signals.join(' · ')}</span>
      </div>

      {/* Degraded mode indicator */}
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
        <Activity size={14} />
        <span>System Mode: <strong>REDUCED</strong> — Tidal node degraded (foam interference detected). 3/4 nodes operational.</span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Fluvial Level', value: `${sensors[0].waterLevel} m`, sub: `Max ${sensors[0].waterLevelMax} m`, icon: <Droplets size={20} className="text-blue-500" />, pct: sensors[0].waterLevel / sensors[0].waterLevelMax },
          { label: 'Rain Intensity', value: '34 mm/hr', sub: 'Heavy rain', icon: <Droplets size={20} className="text-cyan-500" />, pct: 0.68 },
          { label: 'Rise Rate dh/dt', value: `${sensors[0].dhdt} m/hr`, sub: 'KPI signal', icon: <Activity size={20} className="text-orange-500" />, pct: sensors[0].dhdt / 0.3 },
          { label: 'Solar Output', value: `${solarStats.instantKW} kW`, sub: `${solarStats.todayKWh} kWh today`, icon: <Zap size={20} className="text-yellow-500" />, pct: solarStats.instantKW / 6 },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{kpi.label}</span>
              {kpi.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
            <div className="text-gray-400 text-xs mt-0.5">{kpi.sub}</div>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, kpi.pct * 100)}%`, background: kpi.pct > 0.8 ? '#dc2626' : kpi.pct > 0.6 ? '#ea580c' : '#3b82f6' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Pond level 24hr chart */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Pond Level — 24hr Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={pondHistory} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lvlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={3} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0, 4]} label={{ value: 'm', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 80]} label={{ value: 'mm/hr', angle: 90, position: 'insideRight', style: { fontSize: 10 } }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <ReferenceLine yAxisId="left" y={4.0} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Max', position: 'right', style: { fontSize: 10, fill: '#dc2626' } }} />
            <Area yAxisId="right" type="monotone" dataKey="rainfall" fill="url(#rainGrad)" stroke="#06b6d4" strokeWidth={1} name="Rainfall mm/hr" />
            <Area yAxisId="left" type="monotone" dataKey="level" fill="url(#lvlGrad)" stroke="#3b82f6" strokeWidth={2} name="Level m" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sensor node cards */}
      <div className="grid grid-cols-4 gap-4">
        {sensors.map(s => (
          <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase">{s.type}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                s.confidence === 'good' ? 'bg-green-100 text-green-700' :
                s.confidence === 'degraded' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>{s.confidence}</span>
            </div>
            <div className="text-lg font-bold text-gray-900">{s.waterLevel} m</div>
            <div className="text-gray-400 text-xs">{s.name}</div>
            <div className="text-xs text-gray-400 mt-2">♥ {s.lastContact ? format(s.lastContact, 'HH:mm:ss') : '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
