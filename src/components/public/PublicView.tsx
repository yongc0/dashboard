import { useState, useEffect, type ReactNode } from 'react'
import { format } from 'date-fns'
import { Share2, MessageSquarePlus, ClipboardList, Wifi, AlertTriangle, Map, Users, X, Check, Phone } from 'lucide-react'
import { alertState, fusionState, residentReports, sensors } from '../../data/mockData'
import { strings, LANG_ORDER } from '../../i18n/strings'
import type { AlertLevel, LangCode } from '../../types'
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

// Bottom sheet with backdrop-tap close
function Sheet({ onClose, children, padded = true }: { onClose: () => void; children: ReactNode; padded?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={onClose}>
      <div className={`w-full max-w-md bg-white rounded-t-3xl shadow-xl ${padded ? 'p-6' : 'p-4'}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default function PublicView() {
  const [lang, setLang] = useState<LangCode>(() => {
    try {
      const saved = localStorage.getItem('tsm-lang')
      if (saved && (LANG_ORDER as string[]).includes(saved)) return saved as LangCode
    } catch { /* private mode — fall through */ }
    return 'bm'
  })
  const [now, setNow] = useState(new Date())
  const [reportModal, setReportModal] = useState(false)
  const [reportStatusModal, setReportStatusModal] = useState(false)
  const [mapModal, setMapModal] = useState(false)
  const [chainModal, setChainModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null)
  const [photoAttached, setPhotoAttached] = useState(false)
  const [locationAttached, setLocationAttached] = useState(false)
  const [copied, setCopied] = useState(false)

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
    { label: t.sensorLabels.tidalLevel, value: tidalNode?.waterLevel !== undefined ? `${tidalNode.waterLevel.toFixed(2)} m` : t.sensorLabels.pending, icon: '🌊' },
    { label: t.sensorLabels.riseRate, value: riseSignal?.value ?? t.sensorLabels.pending, icon: '📈' },
  ]

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(id)
  }, [])

  // Escape closes whichever sheet is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setReportModal(false); setReportStatusModal(false); setMapModal(false); setChainModal(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const switchLang = (l: LangCode) => {
    setLang(l)
    try { localStorage.setItem('tsm-lang', l) } catch { /* private mode — non-fatal */ }
  }

  const shareAlert = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Older browsers / non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const closeReportModal = () => {
    setReportModal(false)
    setSubmitted(false)
    setSubmittedReportId(null)
    setPhotoAttached(false)
    setLocationAttached(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: color, transition: 'background 0.6s ease' }}>
      {/* Copied-link toast */}
      {copied && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-full shadow-xl">
          <Check size={15} className="text-green-400" />
          {t.linkCopied}
        </div>
      )}

      {/* Header — logo + always-visible 4-language selector */}
      <div className="px-4 pt-4 pb-2 w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2.5">
          <div className="bg-[#111b57] rounded-lg px-2 py-1 shadow-md">
            <img src="/logo.png" alt="Resilience 360" className="h-9 w-auto object-contain" />
          </div>
          <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">Flood Alert</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {LANG_ORDER.map(code => (
            <button key={code} onClick={() => switchLang(code)}
              aria-pressed={lang === code}
              className={`py-1.5 rounded-lg text-sm font-bold transition-all ${lang === code ? 'bg-white text-gray-900 shadow' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              {strings[code].nativeName}
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

        {/* Four-level warning legend — labels follow the selected language */}
        <div className="w-full max-w-md bg-white rounded-2xl p-3 mb-4 shadow-lg text-left">
          <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">{t.levelLegend}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([1, 2, 3, 4] as AlertLevel[]).map(legendLevel => {
              const active = legendLevel === level
              const info = t.levels[legendLevel]
              return (
                <div
                  key={legendLevel}
                  aria-current={active ? 'true' : undefined}
                  className={`rounded-xl border-2 px-2 py-2 transition-all ${active ? 'border-gray-900 shadow-md scale-[1.02]' : 'border-transparent'}`}
                  style={{ background: `${LEVEL_COLORS[legendLevel]}18` }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: LEVEL_COLORS[legendLevel] }} />
                    <span className="text-xs font-black text-gray-800">{legendLevel}</span>
                    {active && <span className="ml-auto text-[9px] font-black text-gray-900">{t.nowLabel}</span>}
                  </div>
                  <div className="text-[11px] font-bold text-gray-700 mt-1 leading-tight">{info.label}</div>
                </div>
              )
            })}
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
          {/* Tap-to-call emergency — surfaced only when action is urgent (Level 3+) */}
          {level >= 3 && (
            <a href="tel:999"
              className="flex items-center justify-center gap-2 w-full py-4 bg-red-700 text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform ring-2 ring-white/50">
              <Phone size={20} />
              {t.callEmergency}
            </a>
          )}
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
            <button onClick={shareAlert}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 text-white rounded-2xl font-semibold border border-white/30 active:scale-95 transition-transform">
              <Share2 size={18} />
              {t.shareAlert}
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setMapModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 text-white rounded-2xl font-semibold border border-white/30 active:scale-95 transition-transform">
              <Map size={18} />
              {t.areaMap}
            </button>
            {level >= 3 && (
              <button onClick={() => setChainModal(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 text-white rounded-2xl font-semibold border border-white/30 active:scale-95 transition-transform">
                <Users size={18} />
                {t.coordinators}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer — Zone D Residents Association credit. Extra bottom padding clears the demo pill. */}
      <div className="px-4 pb-20 space-y-1">
        <div className="flex items-center justify-between text-white/50 text-xs">
          <div className="flex items-center gap-1">
            <Wifi size={12} />
            <span>{t.lastUpdated}: {format(now, 'HH:mm')}</span>
          </div>
          <span>RIFAR · JPS · NADMA</span>
        </div>
        <div className="text-center text-white/40 text-xs">{t.communityCredit}</div>
      </div>

      {/* ── Modals ── */}

      {/* Report incident */}
      {reportModal && (
        <Sheet onClose={closeReportModal}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t.reportModalTitle}</h2>
          {submitted ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-bold text-gray-800">{t.reportReceived}</p>
              <p className="text-gray-500 text-sm mt-1">ID: {submittedReportId}</p>
              <p className="text-gray-400 text-xs mt-1">{t.sharedWithZoneD}</p>
              <button onClick={closeReportModal}
                className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-full font-semibold">
                {t.close}
              </button>
            </div>
          ) : (
            <>
              <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 h-24 resize-none"
                placeholder={t.reportPlaceholder} />
              <div className="flex gap-2 mb-4">
                <button onClick={() => setPhotoAttached(p => !p)}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${photoAttached ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                  {photoAttached ? `✓ ${t.attached}` : `📷 ${t.addPhoto}`}
                </button>
                <button onClick={() => setLocationAttached(p => !p)}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${locationAttached ? 'border-green-500 bg-green-50 text-green-700 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                  {locationAttached ? `✓ ${t.attached}` : `📍 ${t.addLocation}`}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={closeReportModal} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700">
                  {t.cancel}
                </button>
                <button onClick={() => { setSubmittedReportId(`R${Date.now().toString().slice(-4)}`); setSubmitted(true) }} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold">
                  {t.submit}
                </button>
              </div>
            </>
          )}
        </Sheet>
      )}

      {/* Report status */}
      {reportStatusModal && (
        <Sheet onClose={() => setReportStatusModal(false)}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t.reportStatusTitle}</h2>
          {residentReports.slice(0, 3).map(r => (
            <div key={r.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === 'escalated' ? 'bg-red-500' : r.status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{r.location}</p>
                <p className="text-xs text-gray-500">{r.description}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'escalated' ? 'bg-red-100 text-red-700' : r.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {t.reportStatuses[r.status]}
              </span>
            </div>
          ))}
          <button onClick={() => setReportStatusModal(false)} className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl font-bold">
            {t.close}
          </button>
        </Sheet>
      )}

      {/* Area map (public-safe — no diagnostics) */}
      {mapModal && (
        <Sheet onClose={() => setMapModal(false)} padded={false}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">{t.areaMap}</h2>
            <button onClick={() => setMapModal(false)} className="p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
          </div>
          <PublicMap level={level} levelLabel={levelInfo.label} areaPrefix={t.areaLevelPrefix} />
          <p className="text-xs text-gray-400 mt-2 text-center">{t.mapCaption}</p>
          <button onClick={() => setMapModal(false)} className="w-full mt-3 py-3 bg-gray-900 text-white rounded-xl font-bold">
            {t.close}
          </button>
        </Sheet>
      )}

      {/* Human-chain coordination (Level 3+) */}
      {chainModal && (
        <Sheet onClose={() => setChainModal(false)}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-900">{t.coordinatorChain}</h2>
            <button onClick={() => setChainModal(false)} className="p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
          </div>
          <p className="text-xs text-gray-400 mb-4">{t.coordinatorAutoNote}</p>
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
                    ? <span className="text-xs font-bold text-blue-600">✓ {t.notified}</span>
                    : <span className="text-xs text-gray-300">{t.notNotified}</span>}
                  {c.ack
                    ? <span className="text-xs font-bold text-green-600">✓ {t.acknowledged}</span>
                    : c.notified
                      ? <span className="text-xs text-yellow-500">{t.waiting}</span>
                      : null}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setChainModal(false)} className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl font-bold">
            {t.close}
          </button>
        </Sheet>
      )}
    </div>
  )
}
