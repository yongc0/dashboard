import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  LayoutDashboard, Radio, Wrench, CloudRain, BarChart2,
  FileText, Users, AlertOctagon, LogOut
} from 'lucide-react'
import { alertState, getSystemMode } from '../../data/mockData'
import OverviewTab from './tabs/OverviewTab'
import LiveSystemTab from './tabs/LiveSystemTab'
import InfraHealthTab from './tabs/InfraHealthTab'
import FloodRiskTab from './tabs/FloodRiskTab'
import SLBKPITab from './tabs/SLBKPITab'
import ReportsTab from './tabs/ReportsTab'
import CommunityOpsTab from './tabs/CommunityOpsTab'

const TABS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} />, badge: null },
  { id: 'live', label: 'Live System', icon: <Radio size={16} />, badge: 'LIVE' },
  { id: 'infra', label: 'Infra Health', icon: <Wrench size={16} />, badge: null },
  { id: 'risk', label: 'Flood Risk', icon: <CloudRain size={16} />, badge: null },
  { id: 'slbkpi', label: 'SLB KPI / Finance', icon: <BarChart2 size={16} />, badge: 'KEY' },
  { id: 'reports', label: 'Reports', icon: <FileText size={16} />, badge: null },
  { id: 'community', label: 'Community Ops', icon: <Users size={16} />, badge: null },
]

const LEVEL_COLORS = ['', 'bg-green-600', 'bg-yellow-500', 'bg-orange-500', 'bg-red-600']
const LEVEL_LABELS = ['', 'WATCH', 'CAUTION', 'WARNING', 'CRITICAL']

interface Props {
  onSwitchToPublic: () => void
}

export default function OperatorConsole({ onSwitchToPublic }: Props) {
  const [activeTab, setActiveTab] = useState('overview')
  const [now, setNow] = useState(new Date())
  const level = alertState.level
  const mode = getSystemMode()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />
      case 'live': return <LiveSystemTab />
      case 'infra': return <InfraHealthTab />
      case 'risk': return <FloodRiskTab />
      case 'slbkpi': return <SLBKPITab />
      case 'reports': return <ReportsTab />
      case 'community': return <CommunityOpsTab />
      default: return <OverviewTab />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#111b57] rounded-lg px-2 py-1">
            <img src="/logo.png" alt="Resilience 360" className="h-9 w-auto object-contain" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">Flood Monitoring Dashboard</div>
            <div className="text-xs text-gray-400">Taman Sri Muda · Operator Console</div>
          </div>
        </div>

        {/* Alert badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-bold ml-4 ${LEVEL_COLORS[level]}`}>
          <AlertOctagon size={14} />
          LEVEL {level} — {LEVEL_LABELS[level]}
        </div>

        {/* System mode — derived from sensor state */}
        {mode.reduced && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-xs font-semibold"
            title={`Stale: ${mode.staleIds.join(', ') || 'none'} · Feed pending: ${mode.pendingIds.join(', ') || 'none'}`}>
            ⚠ REDUCED MODE — {mode.reportingCount}/{mode.totalCount} nodes reporting
          </div>
        )}

        <div className="ml-auto flex items-center gap-4 text-xs text-gray-400">
          <span className="hidden sm:inline">{format(now, 'HH:mm:ss · dd MMM yyyy')}</span>
          <button
            onClick={onSwitchToPublic}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={13} />
            Public View
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-white border-b border-gray-200 px-6 sticky top-[57px] z-30">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  tab.badge === 'KEY' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — bottom padding clears the fixed demo-switcher pill */}
      <div className="flex-1 overflow-auto pb-16">
        {renderTab()}
      </div>
    </div>
  )
}
