import { useEffect, useState } from 'react'
import { differenceInMinutes, format } from 'date-fns'
import {
  AlertCircle, Battery, CheckCircle, Clock, Cloud, Cpu, Droplets,
  Gauge, LockKeyhole, Radio, ShieldAlert, Sun, Wifi,
} from 'lucide-react'
import { sensors, CURRENT_ALERT_LEVEL, fusionState } from '../../../data/mockData'
import { feedConfigs } from '../../../data/feedConfigs'
import { bod5Samples, breachesStdA, n6Reading, n8Reading } from '../../../data/waterQuality'
import { c1Telemetry, c2Telemetry, controllerEvents } from '../../../data/controllerConfig'
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
        Revision 11 retains the fixed 3-of-4 L4 vote: N1 rainfall, N1 drain dh/dt, N3 outfall lock, and N5/N7 basin dh/dt. N2 and N4 are excluded.
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
          <div className="flex items-center gap-2"><h4 className="font-bold text-gray-800">C1 — Gate & Penstock Controller</h4><span className="text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">LOCAL PLC</span></div>
          <p className="text-xs text-gray-500 mt-0.5">{c.location} · {c.plcClass}</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-gray-400">Control mode</div>
          <div className="font-black text-blue-950">{c.mode}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Status label="Three-state control" value={c.controlState.replaceAll('_', ' / ')} tone="blue" />
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
            <Check label="Mains tie-in verified" ok={c.mainsAvailable} />
            <Check label="Manual lockout clear" ok={!c.manualLockout} />
            <Check label="Emergency hold clear" ok={!c.emergencyHold} />
            <Check label="L3 warning sequence cleared" ok={c.l3WarningCleared} />
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
        Supervisory display only. ADMIT remains blocked until the mandatory hardwired L3 occupancy warning clears. No browser gate controls are exposed.
      </div>
      <div className="mt-2 text-xs text-blue-900 bg-blue-50 border border-blue-200 rounded-lg p-2"><strong>Revision 11 power basis:</strong> {c.powerArchitecture}. {c.maintenancePlan}.</div>
    </div>
  )
}

function PumpPLCPanel() {
  const c = c2Telemetry
  const c2Events = controllerEvents.filter(event => event.controllerId === 'C2')
  return (
    <div className="bg-white border-2 border-cyan-200 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-cyan-800 text-white flex items-center justify-center"><Cpu size={20} /></div>
        <div>
          <div className="flex items-center gap-2"><h4 className="font-bold text-gray-800">C2 — Arena Sump-Pump Controller</h4><span className="text-xs font-black bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">SEPARATE LOCAL PLC</span></div>
          <p className="text-xs text-gray-500 mt-0.5">{c.location} · {c.plcClass}</p>
        </div>
        <div className="ml-auto text-right"><div className="text-xs text-gray-400">Pump state</div><div className="font-black text-cyan-900">{c.state}</div></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Status label="Control mode" value={c.mode} tone="blue" />
        <Status label="Pump" value={c.pumpRunning ? 'RUNNING' : 'STOPPED'} tone="green" />
        <Status label="Drain recession" value={c.drainRecessionConfirmed ? 'CONFIRMED' : 'WAITING'} tone="orange" />
        <Status label="Non-return protection" value={c.nonReturnProtection ? 'CONFIRMED' : 'PENDING'} tone="green" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 mb-4">
        <Metric label="Wet-well level" value={c.wetWellLevelM === null ? 'PENDING' : `${c.wetWellLevelM.toFixed(2)} m`} pending={c.wetWellLevelM === null} />
        <Metric label="Pump current" value={c.pumpCurrentA === null ? 'PENDING' : `${c.pumpCurrentA.toFixed(1)} A`} pending={c.pumpCurrentA === null} />
        <Metric label="Working duty" value={`${c.dutyFlowM3h} m³/h`} />
        <Metric label="Design head" value={`~${c.designHeadM} m`} />
        <Metric label="Discharge" value={`DN ${c.dischargeDiameterMm}`} />
        <Metric label="Drawdown clock" value={`${c.drawdownHours} h from recession`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-100 p-3 text-xs text-gray-600">
          <div className="font-bold mb-2">Locked design basis</div>
          <div>Head band: {c.headBandM[0]}–{c.headBandM[1]} m</div>
          <div>Single pump; no discharge redundancy (accepted risk)</div>
          <div className="mt-1 text-amber-700">{c.pumpCandidate}</div>
        </div>
        <div className="rounded-lg border border-gray-100 p-3">
          <div className="text-xs font-bold text-gray-600 mb-2">Latest local events</div>
          <div className="space-y-2">
            {c2Events.map(event => <div key={event.id} className="flex gap-2 text-xs"><span className="text-gray-400">{format(event.timestamp, 'HH:mm')}</span><span className="font-semibold text-gray-600">{event.type}</span><span className="text-gray-500">{event.message}</span></div>)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2 text-xs text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-lg p-2"><LockKeyhole size={13} className="mt-0.5 flex-shrink-0" />C2 starts the 48-hour drawdown clock only after confirmed drain recession. Pump selection remains pending the vendor curve sheet.</div>
      <div className="mt-2 text-xs text-blue-900 bg-blue-50 border border-blue-200 rounded-lg p-2"><strong>Revision 11 power basis:</strong> {c.powerArchitecture}. {c.maintenancePlan}.</div>
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

function Check({ label, ok }: { label: string; ok: boolean | null }) {
  const color = ok === null ? 'text-amber-700' : ok ? 'text-green-700' : 'text-red-700'
  return <div className={`flex items-center gap-1.5 ${color}`}>{ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}<span>{label}{ok === null ? ' · OPEN' : ''}</span></div>
}

function WaterQualityPanel() {
  const lab = bod5Samples[0]
  return (
    <div className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Droplets size={16} className="text-teal-600" />
        <h4 className="font-semibold text-gray-700">Revision 11 Water-Quality Coverage</h4>
        <span className="ml-auto text-xs font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">TWO DISCHARGE PATHS</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4">
          <div className="flex items-center gap-2"><strong className="text-cyan-900">N6 — Primary Outfall</strong><span className="ml-auto text-[10px] font-black bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">REINSTATED · PROBE ONLY</span></div>
          <p className="text-xs text-gray-500 mt-1">{n6Reading.note}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {n6Reading.params.map(param => <div key={param.key} className="rounded-lg border border-gray-200 bg-white p-3"><div className="font-black text-lg text-gray-400">PENDING</div><div className="text-xs text-gray-500">{param.label} · advisory Std A ≤ {param.stdA}</div></div>)}
          </div>
          <div className="text-xs font-semibold text-cyan-800 mt-3">No BOD₅ lab line at N6. Monitoring/reporting only; no gate authority.</div>
        </div>

        <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4">
          <div className="flex items-center gap-2"><strong className="text-teal-900">N8 — Pond Water Gate</strong><span className="ml-auto text-[10px] font-black bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">CONTINUOUS + LAB</span></div>
          <p className="text-xs text-gray-500 mt-1">{n8Reading.note}</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {n8Reading.params.map(param => {
              const breach = breachesStdA(param)
              return <div key={param.key} className={`rounded-lg border p-3 ${breach ? 'bg-red-50 border-red-200' : 'bg-white border-teal-100'}`}><div className={`font-black text-lg ${breach ? 'text-red-700' : 'text-teal-800'}`}>{param.value ?? 'PENDING'}{param.value !== null && <span className="text-xs font-normal ml-1">{param.unit}</span>}</div><div className="text-xs text-gray-500">{param.label} · advisory Std A ≤ {param.stdA}</div></div>
            })}
          </div>
          <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 mt-2"><div className="font-black text-purple-800">BOD₅ {lab.value} {lab.unit}</div><div className="text-xs text-gray-500">N8-only lab sample · {lab.sampledAt} · next due {lab.nextDue}</div></div>
        </div>
      </div>
      <p className="text-[11px] text-gray-400">EQA Standard A is an advisory comparison, not a statutory compliance claim. Flood-control dh/dt always overrides the N8 routine-release hold.</p>
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
      <h3 className="font-semibold text-gray-700 mb-1">Revision 11 Hydraulic & Control Paths</h3>
      <p className="text-xs text-gray-400 mb-4">Monitoring points are shown beside—not as substitutes for—the hydraulic assets they observe.</p>
      <div className="min-w-[880px] space-y-6">
        <div><div className="text-xs font-bold text-gray-500 mb-2">MINOR / ROUTINE PATH — bypasses retention pond</div><div className="flex items-center gap-2"><Box title="Local drainage" sub="routine runoff" tone="cyan" /><span>→</span><Box title="Primary outfall" sub="N3 level · N6 probe-only WQ" tone="blue" /><span>→</span><Box title="Sungai Klang" sub="N2 JPS/DID API context" /></div></div>
        <div><div className="text-xs font-bold text-gray-500 mb-2">ARENA STORAGE & DRAWDOWN — two independent PLCs</div><div className="flex items-center gap-2"><Box title="Collector loop" sub="compound inflow" tone="cyan" /><span>→</span><Box title="C1 Penstock PLC" sub="CLOSED · ADMIT · GRAVITY-RELEASE" tone="amber" /><span>→</span><Box title="Sunken Arena" sub="N7 · ≈37,300 m³ usable basis" tone="blue" /><span>→</span><Box title="Wet well + C2" sub="single pump · 48 h from recession" tone="cyan" /><span>→</span><Box title="DN 400 discharge" sub="non-return protected" tone="teal" /><span>→</span><Box title="Collector drain" sub="900 m³/h @ ~5.1 m" /></div></div>
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
      <PumpPLCPanel />
      <WaterQualityPanel />
      <FeedStatusPanel />
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm"><div className="flex items-center gap-2 mb-3"><Gauge size={15} className="text-blue-600" /><h3 className="font-semibold text-gray-700">Physical Monitoring & Controller Map</h3></div><NodeMap /></div>
      <FlowDiagram />
      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-100 rounded-lg p-3"><ShieldAlert size={14} className="mt-0.5" />Pending engineering values remain visible. The dashboard does not invent dh/dt thresholds, L2 forecast logic, N4 calibrated flow, N6 readings, the N7 setting-out coordinate, or the final C2 pump selection.</div>
    </div>
  )
}
