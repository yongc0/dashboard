import { format, addHours } from 'date-fns'
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, Area
} from 'recharts'
import { Clock, Lock, TrendingUp, AlertCircle, Info, Waves, FileWarning } from 'lucide-react'
import { CURRENT_ALERT_LEVEL, forecast72hr, fusionState, tideWindows } from '../../../data/mockData'
import { FUSION_THRESHOLDS } from '../../../data/alertFusion'
import { feedConfigs, DID_INTENSITY } from '../../../data/feedConfigs'
import { nodeConfig } from '../../../data/nodeConfig'

// Provenance tag colours
const PROV_STYLE: Record<string, string> = {
  onsite: 'bg-blue-100 text-blue-700',
  DID:    'bg-yellow-100 text-yellow-700',
  Met:    'bg-purple-100 text-purple-700',
  JPS:    'bg-green-100 text-green-700',
}

function ProvenanceTag({ src }: { src: string }) {
  return <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${PROV_STYLE[src] || 'bg-gray-100 text-gray-600'}`}>{src}</span>
}

function BorrowedFeedsPanel() {
  const didRiver = feedConfigs.find(f => f.id === 'did_river')!
  const didRain  = feedConfigs.find(f => f.id === 'did_rain')!
  const met      = feedConfigs.find(f => f.id === 'met_forecast')!

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Info size={15} className="text-blue-500" />
        <h3 className="font-semibold text-gray-700">Borrowed Feeds — Provenance & Status</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Borrowed feeds add lead-time and cross-check redundancy. The KPI-grade and evacuation-trigger signal is always the <ProvenanceTag src="onsite" /> owned reading.
      </p>
      <div className="space-y-3">
        {/* DID river stage — N2 */}
        <div className="p-3 rounded-lg border border-yellow-100 bg-yellow-50/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-700">{didRiver.name}</span>
            <div className="flex items-center gap-2">
              <ProvenanceTag src="DID" />
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">⚠ DATUM UNCONFIRMED</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">PARTIAL</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
            <div>Water-level station ID: <span className="font-bold text-orange-600">PENDING</span></div>
            <div>District: {didRiver.district}</div>
            <div>Normal: <span className="font-bold text-gray-700">{didRiver.thresholds.normal} m</span></div>
            <div>Alert: <span className="font-bold text-gray-700">{didRiver.thresholds.alert} m</span></div>
            <div>Warning: <span className="font-bold text-gray-700">{didRiver.thresholds.warning} m</span></div>
            <div>Danger: <span className="font-bold text-gray-700">{didRiver.thresholds.danger} m</span></div>
          </div>
          <div className="flex items-start gap-2 mt-2 p-2 rounded bg-orange-50 border border-orange-200 text-xs text-orange-700">
            <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
            <span>Thresholds read off the hydrograph by eye (±0.1 m), not confirmed against station metadata. <strong>Datum unconfirmed (AMSL vs local)</strong> — do NOT combine with 5.8 m AMSL design flood or 3.11–3.40 m AMSL ground until LUAS/DID confirm.</span>
          </div>
        </div>

        {/* DID rain cross-check */}
        <div className="p-3 rounded-lg border border-yellow-100 bg-yellow-50/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-700">{didRain.name}</span>
            <div className="flex items-center gap-2">
              <ProvenanceTag src="DID" />
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">PARTIAL</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Rainfall station ID: <span className="font-bold text-green-700">{didRain.stationId}</span> (confirmed). Cross-check: compare against N1 onsite; if delta &gt; 20%, raise data-integrity flag.
          </div>
          <div className="flex items-center gap-2 mt-2 p-2 rounded bg-gray-100 border border-gray-200 text-xs">
            <AlertCircle size={11} className="text-gray-400" />
            <span className="text-gray-500">Station identified but live telemetry not yet wired — cross-check pending. N1 <ProvenanceTag src="onsite" /> reading is the sole rainfall trigger for now.</span>
          </div>
          {/* DID official rainfall-intensity categories */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DID_INTENSITY.map(c => (
              <span key={c.label} className="text-xs px-1.5 py-0.5 rounded font-medium text-white" style={{ background: c.color }}>
                {c.label} {c.range}
              </span>
            ))}
          </div>
        </div>

        {/* MetMalaysia forecast */}
        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-700">{met.name}</span>
            <div className="flex items-center gap-2">
              <ProvenanceTag src="Met" />
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">NOT CONFIGURED</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Used for: 72hr rainfall forecast in the lock-window chart below. API endpoint PENDING configuration.
            Once live, forecast chart will carry [Met] attribution per data point.
          </div>
        </div>
      </div>
    </div>
  )
}

// N7 — riverbank sunken field, tidally-connected wet basin (LOCKED design)
function WetBasinPanel() {
  const n7 = nodeConfig.find(n => n.nodeId === 'N7')!
  return (
    <div className="bg-white border border-sky-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Waves size={16} className="text-sky-500" />
        <h3 className="font-semibold text-gray-700">N7 — Riverbank Sunken Field · Auxiliary Detention</h3>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">WET BASIN · LOCKED</span>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Tidally-connected wet basin (Path 2) — a sealed/lined dry tank was rejected as fighting an unwinnable water table.
        Reframes as a blue-green wetland; courts stay at the north end, lower terraces submerge at peaks.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {n7.specs?.map((s, i) => (
          <div key={i} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-400">{s.label}</div>
            <div className="text-sm font-bold text-gray-800">{s.value}</div>
            {s.caveat && <div className="text-xs text-amber-600 mt-1 leading-snug">⏳ {s.caveat}</div>}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-start gap-2 p-2 rounded bg-sky-50 border border-sky-200 text-xs text-sky-800">
        <Info size={11} className="flex-shrink-0 mt-0.5" />
        <span>Still to engineer: river-facing berm crested &gt; 5.8 m AMSL <em>or</em> documented acceptance of tidal connection; non-return/flap valve on any river connection. Storage target of 40,000 m³ is negotiable, not fixed.</span>
      </div>
    </div>
  )
}

// Bucket A — field data that gates the storage/SLB model. LUAS/DID request not yet sent.
const BUCKET_A = [
  { item: 'Catchment area', note: 'Draining to TSM outfall. ~3× original footprint qualitatively (Zone D RA / FMT 2022) — NOT a usable km² figure.' },
  { item: 'Z_invert', note: 'Surveyed outfall invert at N3. Two unsourced candidates discarded. LUAS/DID survey or as-built drawings required.' },
  { item: 'Rainfall hyetograph', note: 'Temporal distribution of the 100-ARI design storm.' },
  { item: 'Datum confirmation', note: 'AMSL vs local/chart for the Sg. Klang gauge. Request term: "National Geodetic Vertical Datum" (JUPEM). Gates N2 thresholds AND N7 freeboard.' },
]

function BucketAPanel() {
  return (
    <div className="bg-white border border-red-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <FileWarning size={16} className="text-red-500" />
        <h3 className="font-semibold text-gray-700">Bucket A — Pending Field Data (gates the storage / SLB model)</h3>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">LUAS/DID REQUEST NOT SENT</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        These are NOT known values — no chart, placeholder, or projection below treats them as resolved. One combined LUAS/DID request covers all four and is the single highest-priority action item.
      </p>
      <div className="space-y-2">
        {BUCKET_A.map(b => (
          <div key={b.item} className="flex items-start gap-2 p-2 rounded-lg border border-gray-100 bg-gray-50 text-xs">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex-shrink-0">PENDING</span>
            <div>
              <span className="font-semibold text-gray-700">{b.item}</span>
              <span className="text-gray-500"> — {b.note}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const RISK_COLORS = { low: '#22c55e', medium: '#eab308', high: '#ef4444' }

const RISK_GUIDE = [
  { level: 1, label: 'Watch', color: 'bg-green-500', action: 'Monitor alerts. No action required.' },
  { level: 2, label: 'Caution', color: 'bg-yellow-500', action: 'Move valuables. Prepare emergency kit.' },
  { level: 3, label: 'Warning', color: 'bg-orange-500', action: 'Initiate evacuation. Coordinate with RT/RW.' },
  { level: 4, label: 'Critical', color: 'bg-red-600', action: 'Full evacuation. Activate pumps. Call NADMA.' },
]

const RISK_UI = {
  1: { label: 'WATCH', panel: 'bg-green-50 border-green-200', title: 'text-green-700', note: 'text-green-600', dot: 'bg-green-400' },
  2: { label: 'CAUTION', panel: 'bg-yellow-50 border-yellow-200', title: 'text-yellow-700', note: 'text-yellow-600', dot: 'bg-yellow-400' },
  3: { label: 'WARNING', panel: 'bg-orange-50 border-orange-200', title: 'text-orange-700', note: 'text-orange-600', dot: 'bg-orange-400' },
  4: { label: 'CRITICAL', panel: 'bg-red-50 border-red-200', title: 'text-red-700', note: 'text-red-600', dot: 'bg-red-500' },
}

// Thin out forecast to ~every 3hrs for chart clarity
const chartData = forecast72hr.filter((_, i) => i % 3 === 0).slice(0, 25)

export default function FloodRiskTab() {
  const now = new Date()
  const zInvert = FUSION_THRESHOLDS.zinvert_m
  const configuredSignals = fusionState.signals.filter(s => !s.pending)
  const activeConfigured = configuredSignals.filter(s => s.active).length
  const currentPoint = forecast72hr[0]
  const twoHrPoint = forecast72hr[2] ?? currentPoint
  const fourHrPoint = forecast72hr[4] ?? twoHrPoint
  const delta2Hr = twoHrPoint.level - currentPoint.level
  const risk = RISK_UI[CURRENT_ALERT_LEVEL]
  const tideRows = [0, 6, 12, 19, 25].map(offset => {
    const point = forecast72hr[Math.min(offset, forecast72hr.length - 1)]
    return {
      time: format(addHours(now, offset), 'EEE HH:mm'),
      level: point.tide,
      isHigh: point.tide >= 2,
    }
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Risk header — current state first, supporting provenance panels below */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-2 border rounded-xl p-4 ${risk.panel}`}>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Current Risk Assessment</div>
          <div className={`text-2xl font-black ${risk.title}`}>{risk.label} — Level {CURRENT_ALERT_LEVEL}</div>
          <div className={`text-sm mt-1 ${risk.note}`}>
            {activeConfigured}/{configuredSignals.length} configured compound signals active.
            {fusionState.pendingSignals.length > 0 && ` ${fusionState.pendingSignals.length} of 4 signals still pending: ${fusionState.pendingSignals.join(', ')}.`}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-xs text-gray-400">Configuration:</div>
            <div className="flex gap-1">
              {[1,2,3,4].map(i => <div key={i} className={`w-3 h-3 rounded-sm ${i <= configuredSignals.length ? risk.dot : 'bg-gray-200'}`} />)}
            </div>
            <div className="text-xs text-gray-500">{configuredSignals.length}/4 signals configured — pending items stay visible</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div className="text-xs text-gray-400">2hr Projection</div>
            <div className="text-xl font-bold text-red-600">{twoHrPoint.level.toFixed(2)} m</div>
            <div className="text-xs text-gray-500">{delta2Hr >= 0 ? '+' : ''}{delta2Hr.toFixed(2)} m from now</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div className="text-xs text-gray-400">4hr Projection</div>
            <div className="text-xl font-bold text-orange-500">{fourHrPoint.level.toFixed(2)} m</div>
            <div className="text-xs text-gray-500">Demo forecast from mockData.ts</div>
          </div>
        </div>
      </div>

      {/* Lock-window forecast — the key innovation */}
      <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-blue-600" />
            <h3 className="font-semibold text-gray-700">Lock-Window Forecast — Tidal × Rainfall Compound Risk</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <ProvenanceTag src="onsite" /> pond level · tide
            <ProvenanceTag src="Met" /> rainfall forecast (⚠ not configured)
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Shaded windows = astronomical high-tide periods from the demo feed. Because Z_invert is still PENDING, this chart does not claim the outfall is submerged or draw a lock threshold.
          Rainfall attribution switches to [Met] once the forecast feed is configured.
        </p>

        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tideGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="levelGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={3} />
            <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 10 }} label={{ value: 'm', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 80]} tick={{ fontSize: 10 }} label={{ value: 'mm/hr', angle: 90, position: 'insideRight', style: { fontSize: 10 } }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {/* Z_invert stays absent until the field survey resolves it. */}
            {zInvert !== null && (
              <ReferenceLine yAxisId="left" y={zInvert} stroke="#8b5cf6" strokeDasharray="4 2" label={{ value: 'Z_invert', position: 'right', style: { fontSize: 9, fill: '#8b5cf6' } }} />
            )}
            <Bar yAxisId="right" dataKey="rainfall" fill="#06b6d4" opacity={0.4} name="Rainfall mm/hr" />
            <Area yAxisId="left" type="monotone" dataKey="tide" fill="url(#tideGrad)" stroke="#8b5cf6" strokeWidth={1.5} name="Tide m" dot={false} />
            <Area yAxisId="left" type="monotone" dataKey="level" fill="url(#levelGrad)" stroke="#3b82f6" strokeWidth={2} name="Pond Level m" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Tide window table */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tideWindows.map((tw, i) => (
            <div key={i} className="border rounded-xl p-3" style={{ borderColor: RISK_COLORS[tw.risk] + '60', background: RISK_COLORS[tw.risk] + '10' }}>
              <div className="text-xs font-bold uppercase" style={{ color: RISK_COLORS[tw.risk] }}>{tw.risk} Risk Window</div>
              <div className="text-sm font-bold text-gray-800 mt-1">{tw.start} – {tw.end}</div>
              <div className="text-xs text-gray-400">{i === 0 ? 'Current demo window' : i === 1 ? 'Next tide cycle' : 'Day 2 demo window'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Time-to-lock / storage remaining */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-orange-500" />
            <h4 className="font-semibold text-gray-700">Time-to-Lock / Storage Remaining</h4>
          </div>
          <div className="text-4xl font-black text-gray-400">PENDING</div>
          <div className="text-sm text-gray-500 mt-1">requires surveyed Z_invert plus catchment/fill-rate calibration</div>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="h-3 rounded-full bg-gray-300" style={{ width: '100%' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>No countdown shown</span>
            <span>field data gate</span>
          </div>
          <div className="text-xs text-gray-400 mt-3">⏳ Z_invert, catchment area, and rainfall hyetograph are still pending. The dashboard must not fabricate a lock time.</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-blue-500" />
            <h4 className="font-semibold text-gray-700">Astronomical Tide Table</h4>
          </div>
          <div className="space-y-2">
            {tideRows.map((row, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{row.time}</span>
                <span className={`font-bold ${row.isHigh ? 'text-blue-700' : 'text-blue-400'}`}>
                  {row.isHigh ? '▲ HIGH' : '▼ LOW'} {row.level.toFixed(2)} m
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-3">Demo tide series from mockData.ts; replace with official Pelabuhan Kelang/JUPEM feed when wired.</div>
        </div>
      </div>

      {/* Borrowed feeds — provenance behind the chart above */}
      <BorrowedFeedsPanel />

      {/* N7 auxiliary detention — tidally-connected wet basin */}
      <WetBasinPanel />

      {/* Bucket A — pending field data that gates the model */}
      <BucketAPanel />

      {/* Risk level guide */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Risk Level Guide</h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {RISK_GUIDE.map(r => (
            <div key={r.level} className={`rounded-xl p-3 text-white ${r.color}`}>
              <div className="text-2xl font-black">{r.level}</div>
              <div className="font-bold text-sm mt-0.5">{r.label}</div>
              <div className="text-xs opacity-90 mt-1">{r.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
