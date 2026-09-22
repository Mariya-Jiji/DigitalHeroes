'use client'

import { useActionState } from 'react'
import { createDraw } from './actions'

export default function CreateDrawForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await createDraw(prevState, formData)
      if (res.success) {
        (document.getElementById('create-draw-form') as HTMLFormElement).reset()
      }
      return res
    },
    { error: '', success: false }
  )

  const currentPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM

  return (
    <div className="bg-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
      <h2 className="text-xl font-bold text-white mb-4">Create New Draw</h2>
      <form id="create-draw-form" action={formAction} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <label htmlFor="period" className="text-sm text-white/60">Period (YYYY-MM)</label>
            <input 
              type="text" 
              id="period" 
              name="period" 
              defaultValue={currentPeriod}
              pattern="\d{4}-\d{2}"
              required
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div className="flex-1 space-y-2">
            <label htmlFor="mode" className="text-sm text-white/60">Mode</label>
            <select 
              id="mode" 
              name="mode" 
              required
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white"
            >
              <option value="random">Random</option>
              <option value="weighted">Weighted</option>
            </select>
          </div>
        </div>
        
        {state?.error && (
          <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
            {state.error}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Create Draw'}
        </button>
      </form>
    </div>
  )
}
