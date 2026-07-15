import { format, differenceInDays } from 'date-fns'
import { AlertTriangle, Battery, CheckCircle, Cpu, Radio, Shield, Sun, Wifi, Wrench, XCircle, Zap } from 'lucide-react'
import { assets, sensors, solarStats } from '../../../data/mockData'
import { c1Telemetry, c2Telemetry, controllerBOM, gatewayStatus } from '../../../data/controllerConfig'
import { nodeConfig } from '../../../data/nodeConfig'

const STATUS_CONFIG = {
  operational: { label: 'Operational', color: 'text-green-700 bg-green-100', icon: <CheckCircle size={13} /> },
  maintenance: { label: 'Scheduled Maint.', color: 'text-yellow-700 bg-yellow-100', icon: <Wrench size={13} /> },
  fault: { label: 'Fault', color: 'text-red-700 bg-red-100', icon: <XCircle size={13} /> },
}

const CALIBRATION_ROWS = [
  { name: 'N1 Rainfall', type: 'Tipping-bucket gauge', cal: 'Field acceptance pending', ref: 'JPS/DID rainfall 3015084 API cross-check', status: 'pending' },
  { name: 'N1 Drain Level', type: 'Kisters HyQuant L20 FMCW', cal: 'Field acceptance pending', ref: 'Dedicated drain level / dh/dt channel', status: 'pending' },
  { name: 'N2 JPS/DID API', type: 'External API — no mapped hardware', cal: 'API access pending', ref: '3015432 / 3015084 · official stage bands recorded', status: 'pending' },
  { name: 'N3 Primary', type: 'OTT RLS 500 radar', cal: 'Recalibration after stale contact', ref: 'Independent pressure-sensor agreement required', status: 'attention' },
  { name: 'N3 Independent', type: 'Vented pressure transducer', cal: 'Acceptance pending', ref: 'FAULT on delta beyond PENDING tolerance', status: 'pending' },
  { name: 'N4 Flow Anomaly', type: 'Clamp-on ultrasonic flow', cal: 'BLOCKED', ref: 'Pipe diameter/material required · not calibrated Qin/Qout', status: 'pending' },
  { name: 'N6 Primary Outfall WQ', type: 'NH₃-N + TSS multiparameter probe', cal: 'Commissioning pending', ref: 'Reinstated probe-only · no BOD₅ line', status: 'pending' },
  { name: 'N8 Pond Gate WQ', type: 'NH₃-N + TSS probe + BOD₅ lab', cal: 'Probe and lab QA schedule', ref: 'EQA Standard A advisory only', status: 'pending' },
  { name: 'C1 Local Pair', type: 'Dedicated gate/downstream level sensors', cal: 'Acceptance pending', ref: 'Local PLC inputs · not shared with N1 or N3', status: 'pending' },
  { name: 'C2 Pump Instrumentation', type: 'Wet-well level + pump CT/run-hours', cal: 'Acceptance pending', ref: 'Separate PLC · 48 h clock starts at drain recession', status: 'pending' },
]

function GanttBar({ from, to, status }: { from: Date; to: Date; status: string }) {
  const now = new Date()
  const start = new Date(now.getTime() - 30 * 86400000)
  const end = new Date(now.getTime() + 90 * 86400000)
  const total = end.getTime() - start.getTime()
  const left = Math.max(0, (from.getTime() - start.getTime()) / total) * 100
  const right = Math.min(100, (to.getTime() - start.getTime()) / total) * 100
  const colors: Record<string, string> = { operational: '#22c55e', maintenance: '#eab308', fault: '#ef4444' }
  return <div className="relative w-full h-5 bg-gray-100 rounded-full"><div className="absolute top-0 h-5 rounded-full opacity-70" style={{ left: `${left}%`, width: `${Math.max(2, right - left)}%`, background: colors[status] ?? '#6b7280' }} /><div className="absolute inset-y-0 w-px bg-blue-500 opacity-60" style={{ left: '25%' }} /></div>
}

export default function InfraHealthTab() {
  const installedSensors = sensors.filter(sensor => sensor.deployment === 'installed')
  const mappedNodes = nodeConfig.filter(node => node.mapStatus === 'resolved')
  return (
    <div className="p-4 md:p-6 space-y-6">
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <h3 className="font-semibold text-gray-700 px-5 py-4 border-b border-gray-100">Asset Health</h3>
        <div className="divide-y divide-gray-50">
          {assets.map(asset => {
            const cfg = STATUS_CONFIG[asset.status]
            const days = differenceInDays(asset.nextMaintenance, new Date())
            return <div key={asset.id} className="px-5 py-3 flex flex-wrap items-center gap-4"><div className="flex-1 min-w-52"><div className="font-medium text-gray-800 text-sm">{asset.name}</div><div className="text-xs text-gray-400">Last maintained {format(asset.lastMaintained, 'dd MMM yyyy')}</div></div><div className="w-48"><GanttBar from={asset.lastMaintained} to={asset.nextMaintenance} status={asset.status} /><div className="text-xs text-gray-400 mt-1">Next: {days < 0 ? 'OVERDUE' : `${days}d`}</div></div><span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${cfg.color}`}>{cfg.icon}{cfg.label}</span></div>
          })}
        </div>
      </section>

      <section className="bg-white border border-blue-100 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2"><Cpu size={17} className="text-blue-950" /><h3 className="font-semibold text-gray-700">Independent Local Control Plane · C1 Penstock + C2 Pump</h3><span className="ml-auto text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">C1 {c1Telemetry.plcHealthy ? 'HEALTHY' : 'FAULT'} · C2 {c2Telemetry.plcHealthy ? 'HEALTHY' : 'FAULT'}</span></div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {controllerBOM.map(item => <div key={`${item.controller}-${item.item}`} className="border border-gray-100 rounded-lg p-2"><div className="flex items-center gap-1"><span className="text-[9px] font-black text-blue-700 bg-blue-50 rounded px-1">{item.controller}</span><div className="font-semibold text-gray-700 text-xs">{item.item}</div></div><div className={`text-xs font-bold mt-1 ${item.status === 'CONFIRMED' ? 'text-green-600' : 'text-amber-600'}`}>{item.status}</div><div className="text-[10px] text-gray-400 mt-0.5">{item.note}</div></div>)}
          </div>
          <div>
            <div className="grid grid-cols-2 gap-2 mb-4"><Info label="C1 program" value={c1Telemetry.programRevision} /><Info label="C1 state" value={c1Telemetry.controlState} /><Info label="C2 program" value={c2Telemetry.programRevision} /><Info label="C2 state" value={c2Telemetry.state} /><Info label="C1 mains tie-in" value={c1Telemetry.mainsAvailable === null ? 'SITE ENQUIRY OPEN' : c1Telemetry.mainsAvailable ? 'AVAILABLE' : 'UNAVAILABLE'} pending={c1Telemetry.mainsAvailable === null} /><Info label="C2 mains tie-in" value={c2Telemetry.mainsAvailable === null ? 'SITE ENQUIRY OPEN' : c2Telemetry.mainsAvailable ? 'AVAILABLE' : 'UNAVAILABLE'} pending={c2Telemetry.mainsAvailable === null} /></div>
            <div className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1"><Radio size={12} />Redundant gateways</div>
            {gatewayStatus.map(gateway => <div key={gateway.id} className="grid grid-cols-[40px_1fr_auto] gap-2 border-b border-gray-100 py-2 text-xs"><strong className="text-blue-950">{gateway.id}</strong><span className="text-gray-600">{gateway.site}<span className="block text-[10px] text-gray-400">{gateway.backhaul} · {gateway.power} · backup {gateway.backup}</span></span><span className="font-bold text-amber-600">{gateway.status}</span></div>)}
            <p className="text-[11px] text-gray-400 mt-3">Two physically separated gateways with diverse backhaul are fixed; exact sites remain subject to the RF survey.</p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-blue-100 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2"><Shield size={17} className="text-blue-700" /><h3 className="font-semibold text-gray-700">Revision 11 Node Enclosure, Power & Maintenance Basis</h3><span className="ml-auto text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">7/7 MAPPED NODES RESOLVED</span></div>
        <p className="px-5 pt-4 text-xs text-gray-500">These are explicitly working assumptions derived from field-instrumentation practice, not vendor quotations or confirmed cost items. Commissioning dependencies remain separate from map status.</p>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 p-5">
          {mappedNodes.map(node => (
            <div key={node.nodeId} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-2"><strong className="text-blue-950">{node.nodeId}</strong><span className="text-sm font-semibold text-gray-700">{node.label.replace(`${node.nodeId} — `, '')}</span><span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">MAP RESOLVED</span></div>
              <div className="mt-3 space-y-2 text-xs text-gray-600">
                <div><span className="font-bold text-gray-700">Enclosure:</span> {node.siteDesign.enclosure}</div>
                <div><span className="font-bold text-gray-700">Power:</span> {node.siteDesign.power}</div>
                <div><span className="font-bold text-gray-700">Maintenance:</span> {node.siteDesign.maintenance}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Zap size={16} className="text-yellow-500" />Power</h4>
          {installedSensors.map(sensor => <div key={sensor.id} className="flex items-center gap-3 mb-3"><Sun size={14} className={sensor.solarCharging ? 'text-yellow-500' : 'text-gray-300'} /><div className="flex-1"><div className="text-xs text-gray-500">{sensor.name}</div><div className="bg-gray-100 rounded-full h-1.5 mt-1"><div className="h-1.5 rounded-full bg-green-500" style={{ width: `${sensor.batteryPct}%` }} /></div></div><Battery size={13} /><span className="text-xs font-bold">{sensor.batteryPct}%</span></div>)}
          <div className="border-t border-gray-100 pt-3 text-sm flex justify-between"><span className="text-gray-500">Solar instant output</span><strong className="text-yellow-600">{solarStats.instantKW} kW</strong></div>
          <div className="text-xs text-red-800 bg-red-50 border border-red-100 rounded-lg p-2 mt-3"><strong>Revision 11 resilience finding:</strong> C1 should use mains + ≥72 h UPS; C2 requires mains or genset for the pump circuit. Solar-primary is weakest during the monsoon conditions when actuation is needed. Tie-in feasibility remains a site decision.</div>
        </section>
        <section className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Wifi size={16} className="text-blue-500" />Communications</h4>
          {installedSensors.map(sensor => <div key={sensor.id} className="flex items-center justify-between border-b border-gray-50 py-2 text-sm"><span className="text-gray-600">{sensor.nodeId} LoRaWAN</span><strong className={sensor.loraUptime > 98 ? 'text-green-600' : 'text-yellow-600'}>{sensor.loraUptime}%</strong></div>)}
          <div className="flex items-center justify-between border-b border-gray-50 py-2 text-sm"><span className="text-gray-600">C1 local control</span><strong className="text-green-600">INDEPENDENT OF CLOUD</strong></div>
          <div className="flex items-center justify-between border-b border-gray-50 py-2 text-sm"><span className="text-gray-600">C1 Modbus/LoRa telemetry</span><strong className="text-green-600">HEALTHY</strong></div>
          <div className="flex items-center justify-between border-b border-gray-50 py-2 text-sm"><span className="text-gray-600">C2 local pump control</span><strong className="text-green-600">INDEPENDENT OF CLOUD</strong></div>
          <div className="flex items-center justify-between border-b border-gray-50 py-2 text-sm"><span className="text-gray-600">C2 Modbus/LoRa telemetry</span><strong className="text-green-600">HEALTHY</strong></div>
          <div className="flex items-center justify-between py-2 text-sm"><span className="text-gray-600">N2 JPS/DID</span><strong className="text-amber-600">API CALL · PARTIAL</strong></div>
        </section>
      </div>

      <section className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-x-auto">
        <h3 className="font-semibold text-gray-700 px-5 py-4 border-b border-gray-100">Sensor Calibration & Provenance</h3>
        <table className="w-full text-sm min-w-[850px]"><thead><tr className="text-xs text-gray-400 uppercase"><th className="text-left px-5 py-2">Sensor</th><th className="text-left px-5 py-2">Type</th><th className="text-left px-5 py-2">Calibration</th><th className="text-left px-5 py-2">Reference</th><th className="text-left px-5 py-2">Status</th></tr></thead><tbody className="divide-y divide-gray-50">{CALIBRATION_ROWS.map(row => <tr key={row.name}><td className="px-5 py-3 font-medium text-gray-800">{row.name}</td><td className="px-5 py-3 text-gray-500">{row.type}</td><td className="px-5 py-3 text-gray-500">{row.cal}</td><td className="px-5 py-3 text-gray-500">{row.ref}</td><td className="px-5 py-3">{row.status === 'attention' ? <span className="flex items-center gap-1 text-yellow-700 text-xs font-bold"><AlertTriangle size={12} />Attention</span> : <span className="flex items-center gap-1 text-gray-500 text-xs font-bold"><AlertTriangle size={12} />Pending</span>}</td></tr>)}</tbody></table>
      </section>
    </div>
  )
}

function Info({ label, value, pending = false }: { label: string; value: string; pending?: boolean }) {
  return <div className="bg-gray-50 border border-gray-100 rounded-lg p-2"><div className="text-[10px] text-gray-400">{label}</div><div className={`font-bold text-xs ${pending ? 'text-amber-600' : 'text-gray-800'}`}>{value}</div></div>
}
