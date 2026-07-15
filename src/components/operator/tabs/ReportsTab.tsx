import { useState } from 'react'
import { format } from 'date-fns'
import { FileText, Download, Check, Leaf, BarChart2, Shield, FileCheck } from 'lucide-react'
import { controllerEvents } from '../../../data/controllerConfig'

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
    desc: 'Asset uptime, v11 enclosure/power/access basis, maintenance log, calibration records and LoRa performance.',
    period: 'Q2 2026',
    format: 'PDF',
    ready: true,
  },
  {
    icon: <FileCheck size={20} className="text-teal-500" />,
    title: 'Green Bond Compliance Report',
    desc: 'dh/dt calibration evidence, data availability, N7 storage basis, NEM credits and avoided-loss ledger.',
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
  // Demo build: exports are stubs — clicking gives visible "queued" feedback instead of a dead click.
  const [queued, setQueued] = useState<Set<string>>(new Set())

  const queue = (title: string) => {
    setQueued(prev => new Set(prev).add(title))
    setTimeout(() => setQueued(prev => {
      const next = new Set(prev)
      next.delete(title)
      return next
    }), 2500)
  }

  const auditEntries = [
    ...controllerEvents.map(event => ({
      ts: format(event.timestamp, "yyyy-MM-dd'T'HH:mm:ssxxx"),
      hash: event.id,
      event: `${event.controllerId} ${event.type} source=${event.source} acknowledged=${event.acknowledged} message=${event.message}`,
    })),
    { ts: '2026-06-29T10:14:33Z', hash: 'a3f9...c12e', event: 'L3_WARNING_SEQUENCE_ACTIVE source=hardwired_occupancy_safeguard before_state=ADMIT' },
    { ts: '2026-06-29T10:09:21Z', hash: '7b2d...88fa', event: 'L4_QUORUM_STATE active=1/4 required=3 excluded=[N2,N4]' },
    { ts: '2026-06-29T09:30:12Z', hash: 'f56a...9911', event: 'N6_REINSTATED channels=[NH3-N,TSS] bod5=false role=monitoring_only' },
    { ts: '2026-07-15T14:12:00Z', hash: 'r11a...0011', event: 'MAP_STATUS physical_nodes=7 resolved=7 api_only=[N2]' },
    { ts: '2026-07-15T14:11:00Z', hash: 'r11p...0010', event: 'POWER_BASIS C1=mains_plus_72h_UPS_recommended C2=mains_or_genset_required tie_ins=open' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Reports & Exports</h3>
        <button
          onClick={() => REPORTS.filter(r => r.ready).forEach(r => queue(r.title))}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors">
          <Download size={14} />
          Bulk Export All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              onClick={() => queue(r.title)}
              className={`self-start flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                !r.ready ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : queued.has(r.title) ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {queued.has(r.title) ? <Check size={12} /> : <Download size={12} />}
              {!r.ready ? 'Coming soon' : queued.has(r.title) ? 'Queued (demo)' : 'Export'}
            </button>
          </div>
        ))}
      </div>

      {/* Audit trail */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h4 className="font-semibold text-gray-700 mb-4">Recent Audit Log Entries</h4>
        <div className="font-mono text-xs space-y-1.5 text-gray-600">
          {auditEntries.map(entry => (
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
