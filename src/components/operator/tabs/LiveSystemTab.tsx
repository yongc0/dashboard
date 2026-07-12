import { useEffect, useState } from 'react'
import { differenceInMinutes, format } from 'date-fns'
import { Wifi, Battery, AlertCircle, CheckCircle, Sun, Clock, ShieldOff, Gauge } from 'lucide-react'
import { sensors, CURRENT_ALERT_LEVEL, fusionState, getSensor, RAINFALL_MMHR } from '../../../data/mockData'
import { feedConfigs, classifyIntensity } from '../../../data/feedConfigs'
import { n8Reading, n8Logic, breachesStdA } from '../../../data/waterQuality'
import NodeMap from '../../map/NodeMap'
import type { SensorNode } from '../../../types'

const STALE_MINUTES = 5

function isStale(s: SensorNode): boolean {
  if (!s.lastContact) return false
  return differenceInMinutes(new Date(), s.lastContact) > STALE_MINUTES
}

const PROV_STYLE: Record<string, string> = {
  onsite: 'bg-blue-100 text-blue-700',
  DID:    'bg-yellow-100 text-yellow-700',
  Met:    'bg-purple-100 text-purple-700',
  JPS:    'bg-green-100 text-green-700',
}

function NodeCard({ node }: { node: SensorNode }) {
  const stale = isStale(node)
  const isPending = node.confidence === 'pending'
  const prov = node.provenance ?? 'onsite'

  const borderColor = stale ? 'border-red-400' : isPending ? 'border-gray-300' : node.confidence === 'good' ? 'border-green-200' : 'border-yellow-300'
  const shadowColor = stale ? 'shadow-red-100' : ''

  return (
    <div className={`bg-white border-2 rounded-xl p-4 shadow-sm transition-all ${borderColor} ${shadowColor} ${isPending || stale ? 'opacity-80' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-gray-600">{node.nodeId}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${PROV_STYLE[prov]}`}>{prov}</span>
          </div>
          <div className="font-semibold text-gray-800 text-sm mt-0.5 leading-tight">{node.name}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isPending
            ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">PENDING</span>
            : stale
              ? <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700"><AlertCircle size={10} /> STALE</span>
              : node.confidence === 'good'
                ? <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700"><CheckCircle size={10} /> GOOD</span>
                : <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700"><AlertCircle size={10} /> DEGRADED</span>}
        </div>
      </div>

      {isPending ? (
        <div className="py-4 text-center">
          <div className="text-gray-300 text-2xl mb-1">⏳</div>
          <div className="text-xs text-gray-400 font-medium">Feed not configured</div>
          <div className="text-xs text-gray-300 mt-1">Station ID PENDING · No reading available</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {node.type === 'pluvial' ? (
              <>
                {/* Rain gauge — intensity, not water level */}
                <div>
                  <div className="text-gray-400 text-xs">Rain Intensity</div>
                  <div className="text-xl font-black text-gray-900">{RAINFALL_MMHR}<span className="text-sm font-normal ml-1">mm/hr</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full transition-all" style={{
                      width: `${Math.min(100, (RAINFALL_MMHR / 60) * 100)}%`,
                      background: classifyIntensity(RAINFALL_MMHR).color,
                    }} />
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">DID Intensity Class</div>
                  <div className="text-xl font-black" style={{ color: classifyIntensity(RAINFALL_MMHR).color }}>{classifyIntensity(RAINFALL_MMHR).label}</div>
                  <div className="text-xs text-gray-400">{classifyIntensity(RAINFALL_MMHR).range}</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-gray-400 text-xs">Water Level</div>
                  <div className="text-xl font-black text-gray-900">{node.waterLevel}<span className="text-sm font-normal ml-1">m</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full transition-all" style={{
                      width: `${(node.waterLevel / node.waterLevelMax) * 100}%`,
                      background: node.waterLevel / node.waterLevelMax > 0.8 ? '#dc2626' : node.waterLevel / node.waterLevelMax > 0.65 ? '#ea580c' : '#22c55e'
                    }} />
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Rise Rate dh/dt</div>
                  <div className="text-xl font-black text-gray-900">+{node.dhdt}<span className="text-sm font-normal ml-1">m/hr</span></div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-2">
            {node.batteryPct > 0 && (
              <div className="flex items-center gap-1">
                <Battery size={12} className={node.batteryPct > 50 ? 'text-green-500' : 'text-yellow-500'} />
                <span>{node.batteryPct}%</span>
                {node.solarCharging && <Sun size={10} className="text-yellow-400 ml-0.5" />}
              </div>
            )}
            {node.loraUptime > 0 && (
              <div className="flex items-center gap-1">
                <Wifi size={10} />
                <span>LoRa {node.loraUptime}%</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock size={10} className={stale ? 'text-red-500' : 'text-gray-300'} />
              <span className={stale ? 'text-red-600 font-bold' : ''}>
                {node.lastContact ? format(node.lastContact, 'HH:mm:ss') : '—'}
                {stale && ` (${differenceInMinutes(new Date(), node.lastContact!)}m ago)`}
              </span>
            </div>
          </div>

          {stale && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-700 bg-red-50 rounded-lg px-2 py-1 border border-red-100">
              <AlertCircle size={11} />
              <span>Node silent — no contact for {differenceInMinutes(new Date(), node.lastContact!)} min. Silence reads as silence.</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Alert fusion display
function FusionPanel() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-700 text-sm">Cross-Node Fusion · Alert Ladder</h4>
        <span className="text-xs text-gray-400">{fusionState.note}</span>
      </div>
      <div className="space-y-2">
        {fusionState.signals.map(s => (
          <div key={s.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
            s.pending ? 'border-gray-200 bg-gray-50 opacity-60' :
            s.active ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'
          }`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              s.pending ? 'bg-gray-300' : s.active ? 'bg-orange-500' : 'bg-green-500'
            }`} />
            <div className="flex-1">
              <span className="font-semibold text-gray-700">{s.label}</span>
              <span className="text-gray-400 ml-2">{s.value}</span>
            </div>
            <span className="text-gray-400">{s.threshold}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${PROV_STYLE[s.provenance.split(' ')[0]] || 'bg-gray-100 text-gray-600'}`}>
              {s.provenance.split(' ')[0]}
            </span>
            {s.pending && <span className="text-xs text-gray-400 font-bold">⏳</span>}
          </div>
        ))}
      </div>
      {fusionState.pendingSignals.length > 0 && (
        <div className="mt-3 text-xs text-gray-400 border-t border-gray-50 pt-2">
          ⏳ Pending: {fusionState.pendingSignals.join(' · ')} — ladder runs on {4 - fusionState.pendingSignals.length}/4 signals until configured
        </div>
      )}
    </div>
  )
}

// External feed status panel
const FEED_STATUS_STYLE: Record<string, { dot: string; badge: string; label: string }> = {
  live:           { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700', label: 'LIVE' },
  partial:        { dot: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700', label: 'PARTIAL' },
  not_configured: { dot: 'bg-gray-300', badge: 'bg-gray-200 text-gray-600', label: 'NOT CONFIGURED' },
}

function FeedStatusPanel() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <h4 className="font-semibold text-gray-700 text-sm mb-3">Borrowed Feeds — Connection Status</h4>
      <div className="space-y-2">
        {feedConfigs.map(f => {
          const st = FEED_STATUS_STYLE[f.status] ?? FEED_STATUS_STYLE.not_configured
          return (
            <div key={f.id} className="p-2 rounded-lg border border-gray-100 bg-gray-50 text-xs">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-700 truncate">{f.name}</div>
                  <div className="text-gray-400">{f.district ?? ''} · Station ID: {f.stationId ?? 'PENDING'}</div>
                </div>
                {f.datumUnconfirmed && (
                  <span className="px-1.5 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700">⚠ DATUM ?</span>
                )}
                <span className={`px-2 py-0.5 rounded-full font-bold ${st.badge}`}>{st.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${PROV_STYLE[f.source] || 'bg-gray-100 text-gray-600'}`}>{f.source}</span>
              </div>
              {f.note && <div className="text-gray-400 mt-1 pl-5 leading-snug">{f.note}</div>}
            </div>
          )
        })}
      </div>
      <div className="mt-2 text-xs text-gray-400">Borrowed feeds add lead-time and redundancy. Onsite sensors (N1, N3, N4) are the owned trigger-grade signals.</div>
    </div>
  )
}

// N8 — pond water-gate release-control panel. The L3+ suspend is a hard, state-machine
// rule: flood discharge takes absolute precedence over discretionary water-quality holds.
function ReleaseControlPanel() {
  const suspended = CURRENT_ALERT_LEVEL >= n8Logic.suspendAtLevel
  const breaches = n8Reading.params.filter(breachesStdA)
  const hasBreach = breaches.length > 0

  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${suspended ? 'border-red-200' : 'border-amber-200'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Gauge size={15} className="text-amber-600" />
        <h4 className="font-semibold text-gray-700 text-sm">N8 — Pond Water Gate · Release-Control</h4>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">RELEASE GATE</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Distinct from N6 (reporting only). Holds a scheduled release if pond water quality breaches the LUAS/DID-approved threshold — but only during routine pumping.
      </p>

      {/* Hard-rule state */}
      {suspended ? (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-3">
          <ShieldOff size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-700">
            <div className="font-bold">RELEASE-CONTROL SUSPENDED — Alert Level {CURRENT_ALERT_LEVEL} active.</div>
            Flood discharge takes absolute precedence. Hold authority is unconditionally disabled at L{n8Logic.suspendAtLevel}+ (state-machine enforced — no operator override).
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-3">
          <Gauge size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700">
            <div className="font-bold">ACTIVE — baseline pumping. Hold authority available.</div>
            {hasBreach
              ? `⚠ ${breaches.map(b => b.label).join(', ')} above EQA Std A — flagged for operator review (human-in-the-loop, no auto-hold).`
              : 'All parameters within EQA Std A advisory limits — no hold flagged.'}
          </div>
        </div>
      )}

      {/* WQ params */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {n8Reading.params.map(p => {
          const over = breachesStdA(p)
          return (
            <div key={p.key} className={`rounded-lg p-2 text-center border ${over ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className={`text-base font-black ${over ? 'text-red-600' : 'text-gray-800'}`}>{p.value}<span className="text-xs font-normal ml-0.5">{p.unit}</span></div>
              <div className="text-xs text-gray-500">{p.label}</div>
              <div className="text-xs text-gray-400">Std A ≤ {p.stdA}</div>
            </div>
          )
        })}
      </div>

      <div className="space-y-1 text-xs text-gray-500 border-t border-gray-50 pt-2">
        <div><span className="text-gray-400">Decision mode:</span> {n8Logic.decisionMode}</div>
        <div><span className="text-gray-400">Governance:</span> {n8Logic.governance}</div>
        <div className="flex items-start gap-1 text-amber-700 bg-amber-50 rounded px-2 py-1 border border-amber-100">
          <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
          <span><span className="font-bold">PENDING:</span> {n8Logic.timeoutNote}</span>
        </div>
      </div>
    </div>
  )
}

// Flow-diagram readings are pulled from the data layer, not typed in here.
const FLOW_NODES = [
  { id: 'rain', label: 'N1 Rain', x: 40, y: 30, color: '#06b6d4', value: `${RAINFALL_MMHR} mm/hr`, prov: 'onsite' },
  { id: 'fluvial', label: 'N2 Sg.Klang', x: 40, y: 120, color: '#ca8a04', value: 'ID 3015084 ⏳', prov: 'DID' },
  { id: 'tidal', label: 'N3 Tidal Gate', x: 40, y: 210, color: '#dc2626', value: `${getSensor('N3')?.waterLevel ?? '—'} m ⚠STALE`, prov: 'onsite' },
  { id: 'n7', label: 'N7 Wet Basin', x: 230, y: 30, color: '#0ea5e9', value: 'AUX ⏳', prov: 'onsite' },
  { id: 'n5', label: 'N5 Govt Pond', x: 230, y: 210, color: '#8b5cf6', value: 'PROPOSED', prov: 'onsite' },
  { id: 'pond', label: 'Retention Pond', x: 380, y: 120, color: '#ea580c', value: '71% full' },
  { id: 'n8', label: 'N8 Rel Gate', x: 540, y: 30, color: '#d97706', value: 'gate ⏳', prov: 'onsite' },
  { id: 'pump', label: 'N4 Pump 10.2 m³/s', x: 540, y: 120, color: '#16a34a', value: `${getSensor('N4')?.waterLevel ?? '—'} m`, prov: 'onsite' },
  { id: 'drain', label: 'Outfall', x: 690, y: 210, color: '#6b7280', value: 'Z_invert ⏳' },
]

const EDGES = [
  { from: 'rain', to: 'pond' },
  { from: 'fluvial', to: 'pond' },
  { from: 'tidal', to: 'drain' },
  { from: 'n7', to: 'pond' },
  { from: 'n5', to: 'pond' },
  { from: 'pond', to: 'pump' },
  { from: 'pond', to: 'n8' },
  { from: 'n8', to: 'drain' },
  { from: 'pump', to: 'drain' },
]

export default function LiveSystemTab() {
  // Re-render every 5s so stale detection ("X min ago") stays current.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Live Sensor Readings</h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live · stale threshold = {5} min</span>
        </div>
      </div>

      {/* Node cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sensors.map(s => <NodeCard key={s.id} node={s} />)}
      </div>

      {/* Fusion panel */}
      <FusionPanel />

      {/* N8 release-control gate — demonstrates the hard L3+ suspend rule */}
      <ReleaseControlPanel />

      {/* Borrowed feeds status */}
      <FeedStatusPanel />

      {/* Leaflet map */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">Node Map — Taman Sri Muda (OpenStreetMap)</h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>Level {CURRENT_ALERT_LEVEL} active · click pins for operator detail</span>
          </div>
        </div>
        <NodeMap />
      </div>

      {/* System flow diagram (kept as complement to the map) */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">System Flow Diagram</h3>
        <div className="relative overflow-x-auto">
          <svg width="780" height="280" className="min-w-full">
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#9ca3af" />
              </marker>
            </defs>
            {EDGES.map(e => {
              const from = FLOW_NODES.find(n => n.id === e.from)!
              const to = FLOW_NODES.find(n => n.id === e.to)!
              return (
                <line key={`${e.from}-${e.to}`}
                  x1={from.x + 50} y1={from.y + 20}
                  x2={to.x + 50} y2={to.y + 20}
                  stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="5,3"
                  markerEnd="url(#arrow)"
                />
              )
            })}
            {FLOW_NODES.map(n => (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                <rect x={0} y={0} width={100} height={42} rx={8}
                  fill={n.color} opacity={0.12} stroke={n.color} strokeWidth={1.5}
                  strokeDasharray={n.id === 'n5' ? '5,3' : undefined}
                />
                <text x={50} y={15} textAnchor="middle" fontSize={9} fontWeight="700" fill={n.color}>{n.label}</text>
                <text x={50} y={29} textAnchor="middle" fontSize={10} fill="#374151">{n.value}</text>
                {n.prov && <text x={50} y={40} textAnchor="middle" fontSize={8} fill={n.color} opacity={0.7}>[{n.prov}]</text>}
              </g>
            ))}
          </svg>
        </div>
        <p className="text-xs text-gray-400 mt-2">⏳ Z_invert PENDING field survey. N2 station identified (rainfall 3015084) but water-level feed not wired. N5 govt pond proposed. N7 aux wet basin proposed. N8 release-gate suspends at Alert L3+.</p>
      </div>
    </div>
  )
}
