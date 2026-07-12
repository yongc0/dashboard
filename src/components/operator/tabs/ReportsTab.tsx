import { FileText, Download, Leaf, BarChart2, Shield, FileCheck } from 'lucide-react'

const REPORTS = [
  {
    icon: <BarChart2 size={20} className="text-blue-500" />,
    title: 'Flood Event Summary',
    desc: '5 events recorded YTD. Includes sensor data, response times, households affected.',
    period: 'Jan–Jun 2026',
    format: 'PDF',
    ready: true,
  },
  {
    icon: <Leaf size={20} className="text-green-500" />,
    title: 'Environmental Co-Benefits Report',
    desc: 'Carbon sequestration from wetland retention, floating solar offset, biodiversity indicators.',
    period: 'Q1–Q2 2026',
    format: 'PDF',
    ready: true,
  },
  {
    icon: <Shield size={20} className="text-purple-500" />,
    title: 'Infrastructure Reliability Report',
    desc: 'Asset uptime, maintenance log, sensor calibration records, LoRa network performance.',
    period: 'Q2 2026',
    format: 'PDF',
    ready: true,
  },
  {
    icon: <FileCheck size={20} className="text-teal-500" />,
    title: 'Green Bond Compliance Report',
    desc: 'One-click: dh/dt KPI vs covenant, NEM credits, avoided-loss ledger. Adaptation Fund format.',
    period: 'H1 2026',
    format: 'PDF + XLSX',
    ready: true,
  },
  {
    icon: <FileText size={20} className="text-orange-500" />,
    title: 'Avoided-Loss Ledger Export',
    desc: 'Full event log with damage estimates for investor review.',
    period: 'All time',
    format: 'XLSX',
    ready: true,
  },
  {
    icon: <BarChart2 size={20} className="text-gray-400" />,
    title: 'Dashboard Feed Export',
    desc: 'JSON/CSV data feed for downstream analytics or InfoBanjir integration.',
    period: 'Live',
    format: 'JSON / CSV',
    ready: false,
  },
]

export default function ReportsTab() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Reports & Exports</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold">
          <Download size={14} />
          Bulk Export All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {REPORTS.map(r => (
          <div key={r.title} className={`bg-white border rounded-xl p-5 shadow-sm flex gap-4 ${!r.ready ? 'opacity-60' : ''}`}>
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
              {r.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 text-sm">{r.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.period}</span>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-mono">{r.format}</span>
              </div>
            </div>
            <button
              disabled={!r.ready}
              className={`self-start flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                r.ready ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Download size={12} />
              {r.ready ? 'Export' : 'Coming soon'}
            </button>
          </div>
        ))}
      </div>

      {/* Audit trail */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h4 className="font-semibold text-gray-700 mb-4">Recent Audit Log Entries</h4>
        <div className="font-mono text-xs space-y-1.5 text-gray-600">
          {[
            { ts: '2026-06-29T10:14:33Z', hash: 'a3f9...c12e', event: 'ALERT_L3_TRIGGERED signals=[fluvial_dhdt, rainfall_high, tidal_near_zinvert]' },
            { ts: '2026-06-29T10:09:21Z', hash: '7b2d...88fa', event: 'SENSOR_READING node=tidal level=3.10 dhdt=0.22 confidence=degraded' },
            { ts: '2026-06-29T09:45:00Z', hash: 'e1c7...3409', event: 'KPI_SNAPSHOT dhdt_ratio=0.847 coupon_adj=-0.25bps' },
            { ts: '2026-06-29T09:30:12Z', hash: 'f56a...9911', event: 'RESIDENT_REPORT id=R003 location=Jln_Sri_Muda_8 status=escalated' },
            { ts: '2026-06-29T08:00:00Z', hash: '2c3b...5518', event: 'SOLAR_SNAPSHOT instant_kw=4.2 today_kwh=18.6 nem_credits=2847' },
          ].map(entry => (
            <div key={entry.hash} className="flex gap-3 border-b border-gray-50 pb-1.5 last:border-0">
              <span className="text-gray-300 flex-shrink-0">{entry.ts}</span>
              <span className="text-purple-600 flex-shrink-0">[{entry.hash}]</span>
              <span className="text-gray-700 break-all">{entry.event}</span>
            </div>
          ))}
        </div>
        <button className="mt-3 text-xs text-blue-600 hover:underline">View full audit trail →</button>
      </div>
    </div>
  )
}
