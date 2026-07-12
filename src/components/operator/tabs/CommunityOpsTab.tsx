import { useState } from 'react'
import { format } from 'date-fns'
import { MapPin, Camera, CheckCircle, AlertTriangle, ArrowUp, Clock, Users } from 'lucide-react'
import { residentReports } from '../../../data/mockData'

const STATUS_CONFIG = {
  received: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock size={12} />, label: 'Received' },
  verified: { color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle size={12} />, label: 'Verified' },
  escalated: { color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertTriangle size={12} />, label: 'Escalated' },
}

export default function CommunityOpsTab() {
  const [reports, setReports] = useState(residentReports)
  const [selected, setSelected] = useState<string | null>(null)

  const update = (id: string, status: 'received' | 'verified' | 'escalated') => {
    setReports(r => r.map(x => x.id === id ? { ...x, status } : x))
  }

  // Notification acknowledgement tracker
  const coordinators = [
    { name: 'Encik Razali (RT Ketua)', notified: true, ack: true },
    { name: 'Pn. Habsah (RW)', notified: true, ack: true },
    { name: 'Ustaz Karim (Surau Al-Hidayah)', notified: true, ack: false },
    { name: 'Jabatan Bomba Klang', notified: true, ack: true },
    { name: 'NADMA Selangor', notified: false, ack: false },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Reports received', value: reports.length, icon: <Camera size={18} className="text-gray-500" /> },
          { label: 'Verified', value: reports.filter(r => r.status === 'verified').length, icon: <CheckCircle size={18} className="text-green-500" /> },
          { label: 'Escalated', value: reports.filter(r => r.status === 'escalated').length, icon: <ArrowUp size={18} className="text-red-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
            {s.icon}
            <div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Triage queue */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Resident Report Queue</h3>
            <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
              {reports.filter(r => r.status === 'received').length} pending triage
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {reports.map(r => {
              const cfg = STATUS_CONFIG[r.status]
              return (
                <div
                  key={r.id}
                  className={`px-5 py-4 cursor-pointer transition-colors ${selected === r.id ? 'bg-blue-50' : 'hover:bg-gray-50/60'}`}
                  onClick={() => setSelected(r.id === selected ? null : r.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                      {cfg.icon}{cfg.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-800">
                        <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                        {r.location}
                        {r.photo && <Camera size={12} className="text-blue-400 ml-1" />}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{r.description}</div>
                      <div className="text-xs text-gray-300 mt-0.5">{format(r.timestamp, 'HH:mm dd MMM')} · {r.id}</div>
                    </div>
                  </div>

                  {selected === r.id && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={e => { e.stopPropagation(); update(r.id, 'verified') }}
                        className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold">
                        ✓ Verify
                      </button>
                      <button onClick={e => { e.stopPropagation(); update(r.id, 'escalated') }}
                        className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold">
                        ↑ Escalate
                      </button>
                      <button onClick={e => { e.stopPropagation(); update(r.id, 'received') }}
                        className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold">
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Coordinator notifications */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-700">Level 3 Coordinator Chain</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {coordinators.map(c => (
              <div key={c.name} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                  {c.name[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.notified ? `Notified ${format(new Date(), 'HH:mm')}` : 'Not yet notified'}</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  {c.notified && (
                    <span className="text-xs text-blue-600 font-bold">SENT</span>
                  )}
                  {c.ack ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><CheckCircle size={11} />ACK</span>
                  ) : c.notified ? (
                    <span className="text-xs text-yellow-600 font-bold">WAITING</span>
                  ) : (
                    <button className="text-xs text-blue-600 underline">Notify</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 rounded-b-xl">
            <div className="text-xs text-gray-400">Automated SMS + WhatsApp broadcast triggered at Level 3. No human watch required.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
