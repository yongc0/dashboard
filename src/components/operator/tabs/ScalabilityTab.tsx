import { Globe, Wifi, CheckCircle, Clock } from 'lucide-react'
import { multiSiteTemplates } from '../../../data/mockData'

const RISK_COLOR: Record<string, string> = { High: 'bg-red-100 text-red-700', Medium: 'bg-yellow-100 text-yellow-700' }
const STATUS_COLOR: Record<string, string> = {
  'Feasibility study': 'bg-blue-100 text-blue-700',
  'Proposal stage': 'bg-purple-100 text-purple-700',
  'Interested': 'bg-gray-100 text-gray-700',
}

const API_ENDPOINTS = [
  { endpoint: 'GET /api/v1/alert-level', desc: 'Contract for current alert level (L1–L4), active signals, and pending-signal flags', status: 'contract' },
  { endpoint: 'GET /api/v1/sensor/{nodeId}', desc: 'Contract for latest node reading, provenance, caveats, and confidence state', status: 'contract' },
  { endpoint: 'GET /api/v1/forecast', desc: 'Contract for 72hr pond level + rainfall forecast once Met/JPS feed is wired', status: 'pending' },
  { endpoint: 'POST /api/v1/report', desc: 'Contract for inbound resident flood report (geotagged)', status: 'prototype' },
  { endpoint: 'GET /api/v1/kpi', desc: 'Contract for SLB KPI snapshot and append-only audit feed', status: 'contract' },
  { endpoint: 'GET /api/v1/infobanjir', desc: 'JPS/NADMA InfoBanjir-compatible export after station IDs and terms are approved', status: 'pending' },
]

const API_STATUS_COLOR: Record<string, string> = {
  contract: 'bg-blue-100 text-blue-700',
  prototype: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-gray-200 text-gray-600',
}

const DEPLOYMENT_CHECKLIST = [
  { done: false, task: 'Field survey — Z_invert, catchment area' },
  { done: false, task: 'Hydrological calibration (rainfall hyetograph)' },
  { done: true, task: 'Sensor node procurement + factory cal.' },
  { done: true, task: 'LoRaWAN gateway siting + cellular SIM' },
  { done: false, task: 'Alert-ladder threshold tuning after field data' },
  { done: true, task: 'RT/RW coordinator onboarding' },
  { done: false, task: 'Multi-language SMS template localisation' },
  { done: false, task: 'Site-specific SLB covenant calibration' },
]

export default function ScalabilityTab() {
  return (
    <div className="p-6 space-y-6">
      {/* Multi-site header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={20} />
          <h3 className="font-bold text-lg">TSM as a Deployable Product</h3>
        </div>
        <p className="text-blue-100 text-sm max-w-2xl">
          Every component of this system is parameterised — swap sensor IDs, Z_invert, catchment area, and hyetograph.
          The same stack deploys to any Malaysian flood-prone township. This is not a one-off installation; it's a replicable infrastructure product.
        </p>
        <div className="flex gap-4 mt-4">
          {[
            { label: 'Sensor nodes', value: '4 types' },
            { label: 'Deployment time', value: '~8 weeks' },
            { label: 'Config params', value: '12 to swap' },
            { label: 'Pipeline sites', value: `${multiSiteTemplates.length} identified` },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl px-4 py-3 text-center">
              <div className="text-xl font-black">{s.value}</div>
              <div className="text-blue-200 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline sites */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-700">Deployment Pipeline — Identified Sites</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {[{ name: 'Taman Sri Muda', state: 'Selangor', status: 'Live', risk: 'High' }, ...multiSiteTemplates].map(site => (
            <div key={site.name} className="px-5 py-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm">
                {site.name === 'Taman Sri Muda' ? '✅' : '🏗️'}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{site.name}</div>
                <div className="text-xs text-gray-400">{site.state}</div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RISK_COLOR[site.risk] || 'bg-gray-100 text-gray-700'}`}>
                {site.risk} Flood Risk
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                site.status === 'Live' ? 'bg-green-100 text-green-700' : STATUS_COLOR[site.status] || 'bg-gray-100 text-gray-700'
              }`}>
                {site.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Open API */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Wifi size={16} className="text-blue-500" />
          <h3 className="font-semibold text-gray-700">Open API — JPS / NADMA InfoBanjir Integration Contract</h3>
          <div className="ml-auto flex items-center gap-1 text-xs text-blue-600 font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            CONTRACT DRAFT
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {API_ENDPOINTS.map(ep => (
            <div key={ep.endpoint} className="px-5 py-3 flex items-center gap-3">
              <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">{ep.endpoint}</code>
              <div className="flex-1 text-sm text-gray-500">{ep.desc}</div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${API_STATUS_COLOR[ep.status]}`}>{ep.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-gray-50 rounded-b-xl">
          <div className="text-xs text-gray-400">
            InfoBanjir-compatible export is a target integration. DID water-level station ID, feed terms, and backend deployment are still pending.
          </div>
        </div>
      </div>

      {/* ArcGIS reference — do not duplicate, reference it */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} className="text-blue-500" />
          <h3 className="font-semibold text-gray-700">Related Public Reference Dashboards</h3>
        </div>
        <div className="p-3 rounded-xl border border-blue-100 bg-blue-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-blue-800 text-sm">ArcGIS — "3D Flood Level in Taman Sri Muda"</div>
              <div className="text-xs text-blue-600 mt-1">
                Public ArcGIS dashboard showing 3D flood-level visualisation for TSM. Built and maintained by a separate team.
                This system does NOT duplicate it — it provides the sensor instrumentation and SLB-KPI layer that feeds into it.
              </div>
              <div className="text-xs text-blue-500 mt-2 font-medium">Role of this system: real-time sensor data provider · alert-ladder engine · SLB bond KPI instrument</div>
              <div className="text-xs text-blue-500">Role of ArcGIS dashboard: 3D spatial visualisation layer for public/authority use</div>
            </div>
            <div className="flex-shrink-0">
              <div className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-lg whitespace-nowrap">Reference only</div>
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          InfoBanjir (JPS/NADMA) integration also targets a separate national-level feed — this system pushes data upstream, not duplicate downstream visualisation.
        </div>
      </div>

      {/* Replication checklist */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">New Site Deployment Checklist</h3>
        <div className="grid grid-cols-2 gap-3">
          {DEPLOYMENT_CHECKLIST.map(item => (
            <div key={item.task} className="flex items-center gap-2 text-sm">
              {item.done
                ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                : <Clock size={14} className="text-gray-300 flex-shrink-0" />}
              <span className={item.done ? 'text-gray-700' : 'text-gray-400'}>{item.task}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
