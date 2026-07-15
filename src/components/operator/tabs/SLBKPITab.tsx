import { Database, Droplets, FileText, Lock, Shield, Sun, TrendingUp, Waves } from 'lucide-react'
import { avoidedLossEvents, solarStats } from '../../../data/mockData'
import { DHDT_THRESHOLD_METHOD } from '../../../data/alertFusion'
import { bod5Samples, breachesStdA, MSMA_TARGETS, n6Reading, n8Reading } from '../../../data/waterQuality'
import { c2Telemetry } from '../../../data/controllerConfig'

function WaterQualityCard({ reading }: { reading: typeof n6Reading | typeof n8Reading }) {
  const isN6 = reading.nodeId === 'N6'
  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm ${isN6 ? 'border-blue-100' : 'border-teal-100'}`}>
      <div className="flex items-center gap-2">
        <Droplets size={16} className={isN6 ? 'text-blue-500' : 'text-teal-500'} />
        <h4 className="font-semibold text-gray-700">{reading.nodeId} Water-Quality Evidence</h4>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${isN6 ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
          {isN6 ? 'PROBE-ONLY · REINSTATED' : 'CONTINUOUS + LAB'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {reading.params.map(param => {
          const over = breachesStdA(param)
          return (
            <div key={param.key} className={`rounded-lg border p-3 ${param.value === null ? 'bg-gray-50 border-gray-200' : over ? 'bg-red-50 border-red-200' : 'bg-teal-50 border-teal-100'}`}>
              <div className={`text-lg font-black ${param.value === null ? 'text-gray-500' : over ? 'text-red-700' : 'text-teal-800'}`}>
                {param.value === null ? 'PENDING' : param.value}
                {param.value !== null && <span className="text-xs font-normal ml-1">{param.unit}</span>}
              </div>
              <div className="text-xs text-gray-500">{param.label} · advisory ≤ {param.stdA} {param.unit}</div>
            </div>
          )
        })}
      </div>
      {!isN6 && (
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mt-2">
          <div className="font-bold text-purple-800">BOD₅ {bod5Samples[0].value} {bod5Samples[0].unit}</div>
          <div className="text-xs text-gray-500">N8 lab sample {bod5Samples[0].sampledAt} · next due {bod5Samples[0].nextDue}</div>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3">{reading.note}</p>
    </div>
  )
}

export default function SLBKPITab() {
  const totalAvoided = avoidedLossEvents.reduce((sum, event) => sum + event.estimatedDamagesAvoided, 0)
  const totalHouseholds = avoidedLossEvents.reduce((sum, event) => sum + event.householdsProtected, 0)

  const cards = [
    {
      label: 'Normalised dh/dt KPI', value: 'PENDING', sub: 'Numeric target awaits field calibration',
      icon: <TrendingUp size={18} className="text-orange-500" />, accent: 'border-orange-200 bg-orange-50', badge: 'METHOD LOCKED', badgeClass: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Evidence Availability', value: 'COMMISSIONING', sub: 'No covenant result claimed yet',
      icon: <Database size={18} className="text-blue-500" />, accent: 'border-blue-200 bg-blue-50', badge: 'DATA PENDING', badgeClass: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Net Usable Storage', value: '≈ 37,300 m³', sub: 'N7 Revision 11 retained locked basis',
      icon: <Waves size={18} className="text-cyan-500" />, accent: 'border-cyan-200 bg-cyan-50', badge: 'BASIS LOCKED', badgeClass: 'bg-cyan-100 text-cyan-700',
    },
    {
      label: 'Arena Drawdown', value: `≤ ${c2Telemetry.drawdownHours} h`, sub: 'Measured from drain recession',
      icon: <Lock size={18} className="text-purple-500" />, accent: 'border-purple-200 bg-purple-50', badge: 'C2 DESIGN DUTY', badgeClass: 'bg-purple-100 text-purple-700',
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className={`border-2 rounded-xl p-4 shadow-sm ${card.accent}`}>
            <div className="flex items-center justify-between mb-2"><span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{card.label}</span>{card.icon}</div>
            <div className="text-2xl font-black text-gray-900">{card.value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{card.sub}</div>
            <span className={`inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full ${card.badgeClass}`}>{card.badge}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-orange-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} className="text-orange-500" />
          <h3 className="font-semibold text-gray-700">Normalised dh/dt KPI — Revision 11 Method</h3>
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">NUMERIC TARGET PENDING</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">The previous 0.95 covenant and coupon-step chart remains removed because v11 does not substantiate that number. Compliance and bond pricing remain unassessed until the calibrated target is approved.</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {DHDT_THRESHOLD_METHOD.map((step, index) => (
            <div key={step} className="rounded-lg border border-gray-100 bg-gray-50 p-3"><div className="text-xs font-black text-orange-600">STEP {index + 1}</div><div className="text-xs text-gray-600 mt-1 leading-relaxed">{step}</div></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><Sun size={16} className="text-yellow-500" /><h4 className="font-semibold text-gray-700">Floating Solar — Pro-forma Tracker</h4></div>
          {[
            { label: 'Instant output', value: `${solarStats.instantKW} kW`, pct: solarStats.instantKW / 6 },
            { label: 'Cumulative generation', value: `${solarStats.cumulativeMWh} MWh`, pct: solarStats.cumulativeMWh / 20 },
            { label: 'NEM 3.0 export credits', value: `MYR ${solarStats.nemCredits.toLocaleString()}`, pct: solarStats.nemCredits / 4000 },
            { label: 'Revenue vs pro-forma', value: `${Math.round((solarStats.revenueToDate / solarStats.proFormaRevenue) * 100)}%`, pct: solarStats.revenueToDate / solarStats.proFormaRevenue },
          ].map(item => (
            <div key={item.label} className="mb-3"><div className="flex justify-between text-sm mb-1"><span className="text-gray-500">{item.label}</span><span className="font-bold text-gray-800">{item.value}</span></div><div className="w-full bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-yellow-500" style={{ width: `${Math.min(100, item.pct * 100)}%` }} /></div></div>
          ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><Shield size={16} className="text-purple-500" /><h4 className="font-semibold text-gray-700">Avoided-Loss Ledger</h4></div>
          <div className="space-y-2">
            {avoidedLossEvents.map(event => (
              <div key={event.date} className="flex items-center gap-2 text-sm border-b border-gray-50 pb-2 last:border-0">
                <div className={`w-1.5 h-8 rounded-full ${event.alertLevel === 4 ? 'bg-red-500' : 'bg-orange-400'}`} />
                <div className="flex-1"><div className="font-medium text-gray-700">{event.date}</div><div className="text-xs text-gray-400">L{event.alertLevel} · {event.duration}hr · {event.householdsProtected.toLocaleString()} households</div></div>
                <div className="font-bold text-purple-700">MYR {(event.estimatedDamagesAvoided / 1e6).toFixed(2)}M</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between"><span className="font-semibold text-gray-700">Total · {totalHouseholds.toLocaleString()} households</span><span className="font-black text-purple-700">MYR {(totalAvoided / 1e6).toFixed(2)}M</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><WaterQualityCard reading={n6Reading} /><WaterQualityCard reading={n8Reading} /></div>
      <div className="flex flex-wrap gap-2">{MSMA_TARGETS.map(target => <span key={target.label} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">MSMA {target.label}: {target.target}%</span>)}</div>

      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <FileText size={18} className="text-gray-500" />
        <div><div className="font-semibold text-gray-700 text-sm">Tamper-Evident Audit Log</div><div className="text-xs text-gray-400">Append-only event store · SHA-256 hash chaining · KPI methodology, availability and controller-event evidence</div></div>
        <button className="ml-auto px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold whitespace-nowrap">View Audit Trail</button>
      </div>
    </div>
  )
}
