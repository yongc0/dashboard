import { useEffect, useState } from 'react'
import { differenceInMinutes, format } from 'date-fns'
import {
  AlertCircle, Battery, CheckCircle, Clock, Cloud, Cpu, Droplets,
  Gauge, LockKeyhole, Radio, ShieldAlert, Sun, Wifi,
} from 'lucide-react'
import { sensors, CURRENT_ALERT_LEVEL, fusionState } from '../../../data/mockData'
import { feedConfigs } from '../../../data/feedConfigs'
import { bod5Samples, breachesStdA, n8Reading } from '../../../data/waterQuality'
import { c1Telemetry, controllerEvents } from '../../../data/controllerConfig'
import NodeMap from '../../map/NodeMap'
import type { SensorNode } from '../../../types'

const STALE_MINUTES = 5

const PROV_STYLE: Record<string, string> = {
  onsite: 'bg-blue-100 text-blue-700',
  DID: 'bg-yellow-100 text-yellow-700',
  Met: 'bg-purple-100 text-purple-700',
  JPS: 'bg-green-100 text-green-700',
}

function isStale(s: SensorNode) {
  return Boolean(s.lastContact && differenceInMinutes(new Date(), s.lastContact) > STALE_MINUTES)
}

function NodeCard({ node }: { node: SensorNode }) {
  const stale = isStale(node)
  const pending = node.deployment !== 'installed'
  const border = stale ? 'border-red-300' : pending ? 'border-gray-200' : 'border-green-200'

  return (
    <div className={`bg-white border-2 rounded-xl p-4 shadow-sm ${border}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-gray-600">{node.nodeId}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${PROV_STYLE[node.provenance ?? 'onsite']}`}>{node.provenance}</span>
          </div>
          <div className="font-semibold text-gray-800 text-sm mt-1">{node.name}</div>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${stale ? 'bg-red-100 text-red-700' : pending ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
          {stale ? 'STALE' : node.deployment.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {node.metrics.map(metric => (
          <div key={metric.id} className={`rounded-lg border p-2 ${metric.status === 'fault' ? 'border-red-200 bg-red-50' : metric.status === 'warning' ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}>
            <div className="text-xs text-gray-400">{metric.label}</div>
            <div className={`text-base font-black ${metric.value === null ? 'text-gray-400' : metric.status === 'fault' ? 'text-red-700' : 'text-gray-900'}`}>
              {metric.value === null ? 'PENDING' : metric.value}{metric.value !== null && metric.unit ? <span className="text-xs font-normal ml-1">{metric.unit}</span> : null}
            </div>
            {metric.note && <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{metric.note}</div>}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2 mt-3">
        <span className="flex items-center gap-1"><Battery size={11} />{node.batteryPct > 0 ? `${node.batteryPct}%` : 'Power pending'}{node.solarCharging && <Sun size={10} className="text-yellow-500" />}</span>
        <span className="flex items-center gap-1"><Wifi size={11} />{node.loraUptime > 0 ? `${node.loraUptime}%` : 'Not connected'}</span>
        <span className="flex items-center gap-1"><Clock size={11} />{node.lastContact ? format(node.lastContact, 'HH:mm:ss') : '—'}</span>
      </div>
    </div>
  )
}

function FusionPanel() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="font-semibold text-gray-700 text-sm">Validated Cross-Node Fusion</h4>
        <span className="text-xs text-gray-400">{fusionState.note}</span>
      </div>
      <div className="space-y-2">
        {fusionState.signals.map(signal => (
          <div key={signal.id} className={`grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 p-2 rounded-lg border text-xs ${signal.pending ? 'border-gray-200 bg-gray-50' : signal.active ? 'border-orange-200 bg-orange-50' : 'border-green-100 bg-green-50/40'}`}>
            <div><span className="font-semibold text-gray-700">{signal.label}</span><span className="text-gray-500 ml-2">{signal.value}</span></div>
            <span className="text-gray-400">Trigger {signal.threshold}</span>
            <span className="font-bold text-gray-500">{signal.pending ? 'PENDING' : signal.active ? 'ACTIVE' : 'CLEAR'}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mt-3">
        Rainfall uses the Revision 7 either-gauge rule (N1 or N5). N3 may contribute only after its radar and pressure readings pass validation.
      </div>
    </div>
  )
}

function PLCPanel() {
  const c = c1Telemetry
  return (
    <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-950 text-white flex items-center justify-center"><Cpu size={20} /></div>
        <div>
          <div className="flex items-center gap-2"><h4 className="font-bold text-gray-800">C1 — Gate & Arena Local Controller</h4><span className="text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">PLC DESIGN DEMO</span></div>
          <p className="text-xs text-gray-500 mt-0.5">{c.location} · {c.plcClass}</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-gray-400">Control mode</div>
          <div className="font-black text-blue-950">{c.mode}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Status label="Command" value={c.command} tone="blue" />
        <Status label="Confirmed position" value={c.confirmedPosition} tone="green" />
        <Status label="Transition" value={c.transition} tone="green" />
        <Status label="Backflow interlock" value={c.backflowInterlock ? 'ACTIVE' : 'CLEAR'} tone={c.backflowInterlock ? 'orange' : 'green'} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        <Metric label="Gate-side level" value={`${c.gateSideLevelM.toFixed(2)} m`} />
        <Metric label="Local dh/dt" value={`${c.gateSideDhdtMhr.toFixed(2)} m/hr`} />
        <Metric label="Downstream level" value={`${c.downstreamLevelM.toFixed(2)} m`} />
        <Metric label="Gate motor current" value={`${c.gateMotorCurrentA.toFixed(1)} A`} />
        <Metric label="UPS" value={c.upsState} pending={c.upsState === 'PENDING'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-100 p-3">
          <div className="text-xs font-bold text-gray-600 mb-2">Safety and communications</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Check label="PLC local control" ok={c.plcHealthy} />
            <Check label="Modbus RTU" ok={c.modbusHealthy} />
            <Check label="LoRaWAN telemetry" ok={c.telemetryHealthy} />
            <Check label="Mains available" ok={c.mainsAvailable} />
            <Check label="Manual lockout clear" ok={!c.manualLockout} />
            <Check label="Emergency hold clear" ok={!c.emergencyHold} />
          </div>
          <div className="text-[11px] text-gray-400 mt-2">Local control remains authoritative if cloud or LoRaWAN telemetry is unavailable. Program: {c.programRevision}</div>
        </div>
        <div className="rounded-lg border border-gray-100 p-3">
          <div className="text-xs font-bold text-gray-600 mb-2">Latest local events</div>
          <div className="space-y-2">
            {controllerEvents.slice(0, 3).map(event => (
              <div key={event.id} className="flex gap-2 text-xs">
                <span className="text-gray-400 flex-shrink-0">{format(event.timestamp, 'HH:mm')}</span>
                <span className="font-semibold text-gray-600 flex-shrink-0">{event.type}</span>
                <span className="text-gray-500">{event.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
        <LockKeyhole size={13} className="mt-0.5 flex-shrink-0" />
        Supervisory display only. Actuator model, UPS sizing, transition timers, warning-device quantities and final automatic sequence remain PENDING; no browser gate controls are exposed.
      </div>
    </div>
  )
}

function Status({ label, value, tone }: { label: string; value: string; tone: 'blue' | 'green' | 'orange' }) {
  const style = tone === 'green' ? 'bg-green-50 border-green-200 text-green-800' : tone === 'orange' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-blue-50 border-blue-200 text-blue-800'
  return <div className={`rounded-lg border p-3 ${style}`}><div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div><div className="font-black text-sm">{value}</div></div>
}

function Metric({ label, value, pending = false }: { label: string; value: string; pending?: boolean }) {
  return <div className="rounded-lg bg-gray-50 border border-gray-100 p-2"><div className="text-[10px] text-gray-400">{label}</div><div className={`font-bold text-sm ${pending ? 'text-amber-600' : 'text-gray-800'}`}>{value}</div></div>
}

function Check({ label, ok }: { label: string; ok: boolean }) {
  return <div className={`flex items-center gap-1.5 ${ok ? 'text-green-700' : 'text-red-700'}`}>{ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}<span>{label}</span></div>
}

function WaterQualityPanel() {
  const lab = bod5Samples[0]
  return (
    <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <Droplets size={16} className="text-teal-600" />
        <h4 className="font-semibold text-gray-700">N8 — Retention-Pond Water Quality</h4>
        <span className="ml-auto text-xs font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">MONITORING ONLY</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">Sole confirmed continuous water-quality node. C1—not N8—controls the arena penstock.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {n8Reading.params.map(param => {
          const breach = breachesStdA(param)
          return <div key={param.key} className={`rounded-lg border p-3 ${breach ? 'bg-red-50 border-red-200' : 'bg-teal-50 border-teal-100'}`}><div className={`font-black text-xl ${breach ? 'text-red-700' : 'text-teal-800'}`}>{param.value}<span className="text-xs font-normal ml-1">{param.unit}</span></div><div className="text-xs text-gray-500">{param.label} · advisory Std A ≤ {param.stdA}</div></div>
        })}
        <div className="rounded-lg border border-purple-100 bg-purple-50 p-3"><div className="font-black text-xl text-purple-800">{lab.value}<span className="text-xs font-normal ml-1">{lab.unit}</span></div><div className="text-xs text-gray-500">BOD₅ lab sample · {lab.sampledAt}</div><div className="text-[10px] text-purple-600 mt-1">Next due {lab.nextDue}</div></div>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">EQA Standard A is an advisory comparison for stormwater, not a statutory compliance claim.</p>
    </div>
  )
}

function FeedStatusPanel() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3"><Cloud size={15} className="text-blue-600" /><h4 className="font-semibold text-gray-700 text-sm">External API and Forecast Feeds</h4></div>
      <div className="space-y-2">
        {feedConfigs.map(feed => (
          <div key={feed.id} className="flex flex-wrap items-center gap-3 p-2 rounded-lg border border-gray-100 bg-gray-50 text-xs">
            <Radio size={12} className={feed.status === 'live' ? 'text-green-500' : feed.status === 'partial' ? 'text-amber-500' : 'text-gray-300'} />
            <div className="flex-1 min-w-60"><div className="font-semibold text-gray-700">{feed.name}</div><div className="text-gray-400">Station/API: {feed.stationId ?? 'PENDING'} · {feed.note}</div></div>
            <span className={`font-bold px-2 py-0.5 rounded-full ${feed.status === 'live' ? 'bg-green-100 text-green-700' : feed.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>{feed.status.replace('_', ' ').toUpperCase()}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-blue-700 bg-blue-50 rounded-lg p-2 mt-3"><strong>N2 is an API call to JPS/DID.</strong> It is not a physical node and is intentionally absent from the map.</div>
    </div>
  )
}

function FlowDiagram() {
  const Box = ({ title, sub, tone = 'gray' }: { title: string; sub: string; tone?: 'blue' | 'cyan' | 'amber' | 'teal' | 'gray' }) => {
    const colors = { blue: 'border-blue-300 bg-blue-50 text-blue-800', cyan: 'border-cyan-300 bg-cyan-50 text-cyan-800', amber: 'border-amber-300 bg-amber-50 text-amber-800', teal: 'border-teal-300 bg-teal-50 text-teal-800', gray: 'border-gray-300 bg-gray-50 text-gray-700' }
    return <div className={`min-w-36 rounded-lg border p-2 text-center ${colors[tone]}`}><div className="font-bold text-xs">{title}</div><div className="text-[10px] mt-0.5 opacity-75">{sub}</div></div>
  }
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm overflow-x-auto">
      <h3 className="font-semibold text-gray-700 mb-1">Revision 7 Hydraulic Paths</h3>
      <p className="text-xs text-gray-400 mb-4">Monitoring points are shown beside—not as substitutes for—the hydraulic assets they observe.</p>
      <div className="min-w-[880px] space-y-6">
        <div><div className="text-xs font-bold text-gray-500 mb-2">MINOR / ROUTINE PATH — bypasses retention pond</div><div className="flex items-center gap-2"><Box title="Local drainage" sub="routine runoff" tone="cyan" /><span>→</span><Box title="Primary outfall" sub="N3 level · N6 conditional WQ" tone="blue" /><span>→</span><Box title="Sungai Klang" sub="N2 JPS/DID API reference" /></div></div>
        <div><div className="text-xs font-bold text-gray-500 mb-2">MAJOR / OVERFLOW PATH — enabled through penstock</div><div className="flex items-center gap-2"><Box title="Sunken Arena" sub="N7 storage unresolved" tone="cyan" /><span>→</span><Box title="C1 Penstock PLC" sub="local interlocks + feedback" tone="amber" /><span>→</span><Box title="Retention pond" sub="N5 level + second rain gauge" tone="blue" /><span>→</span><Box title="Pump station" sub="N4 flow anomaly" tone="blue" /><span>→</span><Box title="Pond water gate" sub="N8 WQ monitoring" tone="teal" /><span>→</span><Box title="Sungai Klang" sub="external receiving water" /></div></div>
      </div>
    </div>
  )
}

export default function LiveSystemTab() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between"><h3 className="font-semibold text-gray-700">Live Monitoring & Local Control</h3><span className="text-xs text-gray-400">Alert L{CURRENT_ALERT_LEVEL} · stale threshold {STALE_MINUTES} min</span></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{sensors.map(sensor => <NodeCard key={sensor.id} node={sensor} />)}</div>
      <FusionPanel />
      <PLCPanel />
      <WaterQualityPanel />
      <FeedStatusPanel />
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"><div className="flex items-center gap-2 mb-3"><Gauge size={15} className="text-blue-600" /><h3 className="font-semibold text-gray-700">Physical Monitoring & Controller Map</h3></div><NodeMap /></div>
      <FlowDiagram />
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-100 rounded-lg p-3"><ShieldAlert size={14} className="mt-0.5" />Pending engineering values remain visibly pending. The demo does not invent actuator timing, PLC thresholds, storage capacity, N4 calibrated flow, N6 readings or N7 volume.</div>
    </div>
  )
}
