import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Share2, MessageSquarePlus, ClipboardList, Wifi, AlertTriangle, Map, Users, X } from 'lucide-react'
import { alertState, fusionState, residentReports, sensors } from '../../data/mockData'
import { strings } from '../../i18n/strings'
import type { AlertLevel } from '../../types'
import PublicMap from '../map/PublicMap'

const LEVEL_COLORS: Record<AlertLevel, string> = {
  1: '#16a34a',
  2: '#ca8a04',
  3: '#ea580c',
  4: '#dc2626',
}

// Level 3 human-chain coordinators — notified/acknowledged tracking
const COORDINATORS = [
  { name: 'Encik Razali', role: 'RT Ketua', notified: true, ack: true },
  { name: 'Pn. Habsah', role: 'RW', notified: true, ack: true },
  { name: 'Ustaz Karim', role: 'Surau Al-Hidayah', notified: true, ack: false },
  { name: 'Jabatan Bomba Klang', role: 'Emergency', notified: true, ack: true },
  { name: 'NADMA Selangor', role: 'Civil Defense', notified: false, ack: false },
]

export default function PublicView() {
  const [lang, setLang] = useState<'bm' | 'en'>('bm')
  const [now, setNow] = useState(new Date())
  const [reportModal, setReportModal] = useState(false)
  const [reportStatusModal, setReportStatusModal] = useState(false)
  const [mapModal, setMapModal] = useState(false)
  const [chainModal, setChainModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null)

  const t = strings[lang]
  const level = alertState.level
  const levelInfo = t.levels[level]
  const color = LEVEL_COLORS[level]
  const tidalNode = sensors.find(s => s.nodeId === 'N3')
  const rainfallSignal = fusionState.signals.find(s => s.id === 'rainfall')
  const riseSignal = fusionState.signals.find(s => s.id === 'dhdt')
  const publicReadings = [
    { label: t.sensorLabels.riverStage, value: t.sensorLabels.pending, icon: '🌊' },
    { label: t.sensorLabels.rainfallNow, value: rainfallSignal?.value ?? t.sensorLabels.pending, icon: '🌧️' },
    { label: t.sensorLabels.tidalLevel, value: tidalNode ? `${tidalNode.waterLevel.toFixed(2)} m` : t.sensorLabels.pending, icon: '🌊' },
    { label: t.sensorLabels.riseRate, value: riseSignal?.value ?? t.sensorLabels.pending, icon: '📈' },
  ]

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: color, transition: 'background 0.6s ease' }}>
      {/* Lang toggle */}
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <span className="text-white/70 text-sm font-medium tracking-wide">TSM FLOOD ALERT</span>
        <div className="flex gap-1">
          {(['bm', 'en'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1 rounded text-sm font-bold transition-all ${lang === l ? 'bg-white text-gray-900' : 'bg-white/20 text-white'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main status block */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 text-center">
        {/* Pulse ring + level badge */}
        <div className="relative mb-6">
          {level >= 3 && (
            <>
              <div className="absolute inset-0 rounded-full bg-white/20 pulse-ring scale-125" />
              <div className="absolute inset-0 rounded-full bg-white/10 pulse-ring scale-150" style={{ animationDelay: '0.5s' }} />
            </>
          )}
          <div className="relative flex items-center justify-center w-36 h-36 rounded-full bg-white/20 border-4 border-white shadow-2xl">
            <div className="text-center">
              <div className="text-5xl font-black text-white leading-none">{level}</div>
              <div className="text-white/90 text-xs font-bold mt-1">TAHAP / LEVEL</div>
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-black text-white tracking-tight mb-1">{levelInfo.label}</h1>
        <p className="text-white/80 text-sm mb-6">{t.alertTitle}</p>

        {/* Action box */}
        <div className="w-full max-w-md bg-white/20 backdrop-blur rounded-2xl p-5 mb-4 border border-white/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-white" size={18} />
            <span className="text-white font-bold text-sm uppercase tracking-wide">{t.prepare}</span>
          </div>
          <p className="text-white text-xl font-semibold leading-snug">{levelInfo.action}</p>
        </div>

        {/* Time remaining */}
        <div className="w-full max-w-md bg-black/20 rounded-2xl p-4 mb-4 border border-white/20">
          <div className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{t.timeRemaining}</div>
          <div className="text-white text-3xl font-black">
            {level >= 3 ? t.timeActionNow : t.timeEstimatePending}
          </div>
          <div className="text-white/60 text-xs mt-1">{t.timeEstimatePendingDetail}</div>
          <div className="grid grid-cols-4 gap-1 mt-3">
            {([1, 2, 3, 4] as AlertLevel[]).map(step => (
              <div key={step} className={`h-2 rounded-full ${step <= level ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>

        {/* Sensor readings strip — public-safe (no diagnostics) */}
        <div className="w-full max-w-md grid grid-cols-2 gap-2 mb-6">
          {publicReadings.map(s => (
            <div key={s.label} className="bg-black/20 rounded-xl p-3 border border-white/10">
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="text-white text-lg font-bold">{s.value}</div>
              <div className="text-white/60 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="w-full max-w-md flex flex-col gap-3">
          <button onClick={() => setReportModal(true)}
            className="flex items-center justify-center gap-2 w-full py-4 bg-white text-gray-900 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform">
            <MessageSquarePlus size={20} />
            {t.reportIncident}
          </button>
          <div className="flex gap-3">
            <button onClick={() => setReportStatusModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 text-white rounded-2xl font-semibold border border-white/30 active:scale-95 transition-transform">
              <ClipboardList size={18} />
              {t.reportStatus}
            </button>
            <button onClick={() => alert('Pautan disalin! / Link copied!')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 text-white rounded-2xl font-semibold border border-white/30 active:scale-95 transition-transform">
              <Share2 size={18} />
              {t.shareAlert}
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setMapModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 text-white rounded-2xl font-semibold border border-white/30 active:scale-95 transition-transform">
              <Map size={18} />
              {lang === 'bm' ? 'Peta Kawasan' : 'Area Map'}
            </button>
            {level >= 3 && (
              <button onClick={() => setChainModal(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 text-white rounded-2xl font-semibold border border-white/30 active:scale-95 transition-transform">
                <Users size={18} />
                {lang === 'bm' ? 'Penyelaras' : 'Coordinators'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer — Zone D Residents Association credit */}
      <div className="px-4 pb-4 space-y-1">
        <div className="flex items-center justify-between text-white/50 text-xs">
          <div className="flex items-center gap-1">
            <Wifi size={12} />
            <span>{t.lastUpdated}: {format(now, 'HH:mm')}</span>
          </div>
          <span>RIFAR · JPS · NADMA</span>
        </div>
        <div className="text-center text-white/40 text-xs">
          {lang === 'bm'
            ? 'Data komuniti disumbangkan oleh Persatuan Penduduk Zon D, Taman Sri Muda'
            : 'Community data contributed by Zone D Residents Association, Taman Sri Muda'}
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Report incident */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{lang === 'bm' ? 'Lapor Kejadian' : 'Report Incident'}</h2>
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-bold text-gray-800">{lang === 'bm' ? 'Laporan diterima!' : 'Report received!'}</p>
                <p className="text-gray-500 text-sm mt-1">ID: {submittedReportId}</p>
                <p className="text-gray-400 text-xs mt-1">{lang === 'bm' ? 'Dikongsi dengan Persatuan Penduduk Zon D' : 'Shared with Zone D Residents Association'}</p>
                <button onClick={() => { setSubmitted(false); setSubmittedReportId(null); setReportModal(false) }}
                  className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-full font-semibold">
                  {lang === 'bm' ? 'Tutup' : 'Close'}
                </button>
              </div>
            ) : (
              <>
                <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 h-24 resize-none"
                  placeholder={lang === 'bm' ? 'Terangkan kejadian...' : 'Describe the incident...'} />
                <div className="flex gap-2 mb-4">
                  <button className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">
                    📷 {lang === 'bm' ? 'Tambah Foto' : 'Add Photo'}
                  </button>
                  <button className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">
                    📍 {lang === 'bm' ? 'Lokasi' : 'Location'}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setReportModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700">
                    {lang === 'bm' ? 'Batal' : 'Cancel'}
                  </button>
                  <button onClick={() => { setSubmittedReportId(`R${Date.now().toString().slice(-4)}`); setSubmitted(true) }} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold">
                    {lang === 'bm' ? 'Hantar' : 'Submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Report status */}
      {reportStatusModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{lang === 'bm' ? 'Status Laporan' : 'Report Status'}</h2>
            {residentReports.slice(0, 3).map(r => (
              <div key={r.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === 'escalated' ? 'bg-red-500' : r.status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.location}</p>
                  <p className="text-xs text-gray-500">{r.description}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'escalated' ? 'bg-red-100 text-red-700' : r.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {r.status}
                </span>
              </div>
            ))}
            <button onClick={() => setReportStatusModal(false)} className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl font-bold">
              {lang === 'bm' ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Area map (public-safe — no diagnostics) */}
      {mapModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">{lang === 'bm' ? 'Peta Kawasan' : 'Area Map'}</h2>
              <button onClick={() => setMapModal(false)} className="p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
            </div>
            <PublicMap level={level} lang={lang} />
            <p className="text-xs text-gray-400 mt-2 text-center">
              {lang === 'bm' ? 'Peta menunjukkan kawasan yang terjejas. Untuk maklumat sensor penuh, hubungi operator.' : 'Map shows affected area. For full sensor detail, contact operator.'}
            </p>
            <button onClick={() => setMapModal(false)} className="w-full mt-3 py-3 bg-gray-900 text-white rounded-xl font-bold">
              {lang === 'bm' ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Human-chain coordination (Level 3+) */}
      {chainModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900">{lang === 'bm' ? 'Rantaian Penyelaras' : 'Coordinator Chain'}</h2>
              <button onClick={() => setChainModal(false)} className="p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-400 mb-4">{lang === 'bm' ? 'SMS + WhatsApp dihantar secara automatik apabila Tahap 3 dicapai.' : 'SMS + WhatsApp sent automatically when Level 3 triggered.'}</p>
            <div className="divide-y divide-gray-100">
              {COORDINATORS.map(c => (
                <div key={c.name} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.role}</div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {c.notified
                      ? <span className="text-xs font-bold text-blue-600">✓ {lang === 'bm' ? 'Dimaklum' : 'Notified'}</span>
                      : <span className="text-xs text-gray-300">{lang === 'bm' ? 'Belum dimaklum' : 'Not notified'}</span>}
                    {c.ack
                      ? <span className="text-xs font-bold text-green-600">✓ {lang === 'bm' ? 'Akui terima' : 'Acknowledged'}</span>
                      : c.notified
                        ? <span className="text-xs text-yellow-500">{lang === 'bm' ? 'Menunggu...' : 'Waiting...'}</span>
                        : null}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setChainModal(false)} className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl font-bold">
              {lang === 'bm' ? 'Tutup' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
