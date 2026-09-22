'use client'

import { useActionState, useState } from 'react'
import { createCharity, updateCharity } from './actions'

type Charity = {
  id?: string
  name: string
  slug: string
  description: string
  image_url: string
  is_featured: boolean
}

export default function CharityForm({ initialData, onSuccess }: { initialData?: Charity, onSuccess?: () => void }) {
  const isEditing = !!initialData?.id
  const action = isEditing ? updateCharity : createCharity
  
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await action(prevState, formData)
      if (res.success) {
        if (!isEditing) (document.getElementById('charity-form') as HTMLFormElement).reset()
        if (onSuccess) onSuccess()
      }
      return res
    },
    { error: '' } as any
  )

  return (
    <form id="charity-form" action={formAction} className="space-y-4">
      {isEditing && <input type="hidden" name="id" value={initialData.id} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">Name</label>
          <input 
            type="text" name="name" required defaultValue={initialData?.name}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white" 
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">Slug</label>
          <input 
            type="text" name="slug" required defaultValue={initialData?.slug}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white" 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1">Image URL</label>
        <input 
          type="url" name="image_url" defaultValue={initialData?.image_url}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white" 
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1">Description</label>
        <textarea 
          name="description" rows={3} defaultValue={initialData?.description}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white" 
        />
      </div>

      <div className="flex items-center gap-2">
        <input 
          type="checkbox" name="is_featured" id={`featured-${initialData?.id || 'new'}`} value="true"
          defaultChecked={initialData?.is_featured}
          className="w-4 h-4 bg-black/40 border-white/10 rounded" 
        />
        <label htmlFor={`featured-${initialData?.id || 'new'}`} className="text-sm text-white">Featured on Homepage</label>
      </div>

      {state?.error && <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{state.error}</div>}

      <div className="flex justify-end gap-3 pt-2">
        <button 
          type="submit" disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving...' : (isEditing ? 'Update Charity' : 'Create Charity')}
        </button>
      </div>
    </form>
  )
}
