'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { simulateDraw, publishDraw } from '../actions'

export default function DrawControls({ drawId, status }: { drawId: string, status: string }) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleSimulate = async () => {
    setIsSimulating(true)
    setError(null)
    const res = await simulateDraw(drawId)
    setIsSimulating(false)
    if (res?.error) setError(res.error)
  }

  const handlePublish = async () => {
    if (!window.confirm('WARNING: Publishing is irreversible. Are you sure you want to lock in these numbers and distribute prizes?')) return
    
    setIsPublishing(true)
    setError(null)
    const res = await publishDraw(drawId)
    setIsPublishing(false)
    if (res?.error) setError(res.error)
  }

  return (
    <div className="space-y-4 mt-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}
      
      <div className="flex gap-4">
        {status !== 'published' && (
          <button
            onClick={handleSimulate}
            disabled={isSimulating || isPublishing}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSimulating ? 'Simulating...' : (status === 'simulated' ? 'Re-Simulate Draw' : 'Simulate Draw')}
          </button>
        )}
        
        {status === 'simulated' && (
          <button
            onClick={handlePublish}
            disabled={isSimulating || isPublishing}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
          >
            {isPublishing ? 'Publishing...' : 'Publish Draw & Lock Prizes'}
          </button>
        )}
      </div>
    </div>
  )
}
