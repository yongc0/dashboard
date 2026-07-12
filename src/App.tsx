import { useState } from 'react'
import PublicView from './components/public/PublicView'
import OperatorConsole from './components/operator/OperatorConsole'

type Face = 'public' | 'operator'

export default function App() {
  const [face, setFace] = useState<Face>('public')

  // Switch buttons overlaid for demo
  return (
    <div className="relative">
      {face === 'public'
        ? <PublicView />
        : <OperatorConsole onSwitchToPublic={() => setFace('public')} />}

      {/* Demo switcher pill */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex bg-white rounded-full shadow-2xl border border-gray-200 p-1 z-50">
        <button
          onClick={() => setFace('public')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${face === 'public' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Public View
        </button>
        <button
          onClick={() => setFace('operator')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${face === 'operator' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Operator Console
        </button>
      </div>
    </div>
  )
}
