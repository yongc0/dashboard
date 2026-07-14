import {
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, Area
} from 'recharts'
import { TrendingUp, Sun, Shield, DollarSign, FileText, Lock, Droplets } from 'lucide-react'
import { kpiTrend, avoidedLossEvents, solarStats } from '../../../data/mockData'
import { bod5Samples, n6Decision, n8Reading, MSMA_TARGETS, breachesStdA } from '../../../data/waterQuality'

export default function SLBKPITab() {
  const latestKPI = kpiTrend[kpiTrend.length - 1]
  // Covenant semantics: HIGHER ratio = better. ≥ threshold → compliant, coupon on rate.
  const compliant = latestKPI.dhdt >= latestKPI.threshold
  const couponStatus = latestKPI.couponAdj === 0
    ? 'On covenant — no adjustment'
    : `Step-up +${(latestKPI.couponAdj * 100).toFixed(0)} bps (below-covenant penalty)`

  const totalAvoided = avoidedLossEvents.reduce((s, e) => s + e.estimatedDamagesAvoided, 0)
  const totalHouseholds = avoidedLossEvents.reduce((s, e) => s + e.householdsProtected, 0)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Headline KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'dh/dt Ratio',
            value: latestKPI.dhdt.toFixed(3),
            sub: `Covenant: ≥ ${latestKPI.threshold}`,
            icon: <TrendingUp size={18} className={compliant ? 'text-green-500' : 'text-red-500'} />,
            accent: compliant ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50',
            badge: compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
            badgeText: compliant ? 'COMPLIANT' : 'BELOW COVENANT',
          },
          {
            label: 'Coupon Status',
            value: latestKPI.couponAdj === 0 ? 'On rate' : `+${(latestKPI.couponAdj * 100).toFixed(0)} bps`,
            sub: couponStatus,
            icon: <DollarSign size={18} className="text-blue-500" />,
            accent: 'border-blue-200 bg-blue-50',
            badge: 'bg-blue-100 text-blue-700',
            badgeText: 'SLB BOND',
          },
          {
            label: 'Solar Revenue',
            value: `MYR ${solarStats.revenueToDate.toLocaleString()}`,
            sub: `Pro-forma: MYR ${solarStats.proFormaRevenue.toLocaleString()}`,
            icon: <Sun size={18} className="text-yellow-500" />,
            accent: 'border-yellow-200 bg-yellow-50',
            badge: 'bg-yellow-100 text-yellow-700',
            badgeText: `${Math.round((solarStats.revenueToDate / solarStats.proFormaRevenue) * 100)}% OF TARGET`,
          },
          {
            label: 'Avoided Losses',
            value: `MYR ${(totalAvoided / 1e6).toFixed(1)}M`,
            sub: `${totalHouseholds.toLocaleString()} households protected`,
            icon: <Shield size={18} className="text-purple-500" />,
            accent: 'border-purple-200 bg-purple-50',
            badge: 'bg-purple-100 text-purple-700',
            badgeText: '5 EVENTS',
          },
        ].map(card => (
          <div key={card.label} className={`border-2 rounded-xl p-4 shadow-sm ${card.accent}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{card.label}</span>
              {card.icon}
            </div>
            <div className="text-2xl font-black text-gray-900">{card.value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{card.sub}</div>
            <span className={`inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded-full ${card.badge}`}>{card.badgeText}</span>
          </div>
        ))}
      </div>

      {/* dh/dt KPI chart — 90-day trend vs covenant */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-700">Normalised dh/dt Performance Ratio — 90-Day Trend</h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Lock size={11} />
            <span>Append-only audit log · tamper-evident</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          SLB covenant: ≥ 0.95 normalised ratio = coupon on rate. Below 0.95 = +25 bps step-up. Below 0.85 = +50 bps step-up.
          This chart is the instrument that prices the bond.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={kpiTrend.filter((_, i) => i % 3 === 0)} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis domain={[0.8, 1.0]} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v) => typeof v === 'number' ? v.toFixed(3) : v} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0.95} stroke="#dc2626" strokeDasharray="5 3" label={{ value: 'Covenant 0.95', position: 'right', style: { fontSize: 10, fill: '#dc2626' } }} />
            <ReferenceLine y={0.85} stroke="#f97316" strokeDasharray="4 2" label={{ value: '+50 bps below 0.85', position: 'right', style: { fontSize: 10, fill: '#f97316' } }} />
            <Area type="monotone" dataKey="dhdt" fill="url(#kpiGrad)" stroke="#8b5cf6" strokeWidth={2} name="dh/dt ratio" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Solar + revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sun size={16} className="text-yellow-500" />
            <h4 className="font-semibold text-gray-700">Floating Solar — Revenue Tracker</h4>
          </div>
          {[
            { label: 'Instant output', value: `${solarStats.instantKW} kW`, pct: solarStats.instantKW / 6 },
            { label: 'Cumulative generation', value: `${solarStats.cumulativeMWh} MWh`, pct: solarStats.cumulativeMWh / 20 },
            { label: 'NEM 3.0 export credits', value: `MYR ${solarStats.nemCredits.toLocaleString()}`, pct: solarStats.nemCredits / 4000 },
            { label: 'Revenue vs pro-forma', value: `${Math.round((solarStats.revenueToDate / solarStats.proFormaRevenue) * 100)}%`, pct: solarStats.revenueToDate / solarStats.proFormaRevenue },
          ].map(item => (
            <div key={item.label} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-bold text-gray-800">{item.value}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-yellow-500 transition-all" style={{ width: `${Math.min(100, item.pct * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Avoided loss ledger */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-purple-500" />
            <h4 className="font-semibold text-gray-700">Avoided-Loss Ledger</h4>
          </div>
          <div className="space-y-2">
            {avoidedLossEvents.map(e => (
              <div key={e.date} className="flex items-center gap-2 text-sm border-b border-gray-50 pb-2 last:border-0">
                <div className={`flex-shrink-0 w-1.5 h-8 rounded-full ${e.alertLevel === 4 ? 'bg-red-500' : 'bg-orange-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-700">{e.date}</div>
                  <div className="text-xs text-gray-400">L{e.alertLevel} · {e.duration}hr · {e.householdsProtected.toLocaleString()} HH</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-700">MYR {(e.estimatedDamagesAvoided / 1e6).toFixed(2)}M</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
            <span className="font-semibold text-gray-700">Total Avoided</span>
            <span className="font-black text-purple-700">MYR {(totalAvoided / 1e6).toFixed(2)}M</span>
          </div>
        </div>
      </div>

      {/* Revision 7 water-quality evidence position */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-orange-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2"><Droplets size={16} className="text-orange-500" /><h4 className="font-semibold text-gray-700">N6 Primary-Outfall Water Quality</h4><span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">CONDITIONAL · D1</span></div>
          <p className="text-sm font-semibold text-orange-800 mt-3">N6 remains removed. No live N6 compliance evidence is available.</p>
          <p className="text-xs text-gray-500 mt-2">{n6Decision.gap}</p>
          <div className="mt-3 space-y-1">{n6Decision.options.map(option => <div key={option} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1">{option}</div>)}</div>
          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2 mt-3"><strong>Revision 7 recommendation:</strong> {n6Decision.recommendation}.</div>
        </div>
        <div className="bg-white border border-teal-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2"><Droplets size={16} className="text-teal-500" /><h4 className="font-semibold text-gray-700">N8 Confirmed Water-Quality Evidence</h4><span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">CONTINUOUS</span></div>
          <div className="grid grid-cols-2 gap-2 mt-3">{n8Reading.params.map(param => { const over = breachesStdA(param); return <div key={param.key} className={`rounded-lg border p-3 ${over ? 'bg-red-50 border-red-200' : 'bg-teal-50 border-teal-100'}`}><div className={`text-lg font-black ${over ? 'text-red-700' : 'text-teal-800'}`}>{param.value}<span className="text-xs font-normal ml-1">{param.unit}</span></div><div className="text-xs text-gray-500">{param.label} · advisory ≤ {param.stdA}</div></div> })}</div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mt-2"><div className="font-bold text-purple-800">BOD₅ {bod5Samples[0].value} {bod5Samples[0].unit}</div><div className="text-xs text-gray-500">Lab sample {bod5Samples[0].sampledAt} · next due {bod5Samples[0].nextDue}</div></div>
          <div className="mt-3 flex flex-wrap gap-2">{MSMA_TARGETS.map(target => <span key={target.label} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{target.label}: {target.target}%</span>)}</div>
          <p className="text-[11px] text-gray-400 mt-3">Continuous channels are NH₃-N and TSS. BOD₅ is periodic laboratory sampling. EQA Standard A is advisory for stormwater.</p>
        </div>
      </div>

      {/* Audit log link */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <FileText size={18} className="text-gray-500 flex-shrink-0" />
        <div>
          <div className="font-semibold text-gray-700 text-sm">Tamper-Evident Audit Log</div>
          <div className="text-xs text-gray-400">Append-only event store · SHA-256 hash chaining · export to PDF or green bond compliance format</div>
        </div>
        <button className="ml-auto px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold whitespace-nowrap">
          View Audit Trail
        </button>
      </div>
    </div>
  )
}
