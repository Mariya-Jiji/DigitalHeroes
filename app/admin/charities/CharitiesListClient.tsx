'use client'

import { useState } from 'react'
import CharityForm from './CharityForm'
import { deleteCharity } from './actions'
import { Trash2, Edit2 } from 'lucide-react'

export default function CharitiesListClient({ charities }: { charities: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this charity? This may fail if users are linked to it.')) return
    const res = await deleteCharity(id)
    if (res?.error) alert(res.error)
  }

  return (
    <div className="space-y-8">
      {/* Create New */}
      <div className="bg-black/20 border border-white/10 rounded-xl p-6 backdrop-blur-xl">
        <h2 className="text-xl font-bold text-white mb-4">Add New Charity</h2>
        <CharityForm />
      </div>

      {/* List */}
      <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-4 text-white/60 font-medium text-sm">Charity</th>
              <th className="p-4 text-white/60 font-medium text-sm">Featured</th>
              <th className="p-4 text-white/60 font-medium text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {charities.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-white/40">No charities found.</td>
              </tr>
            ) : charities.map(charity => (
              <tr key={charity.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4">
                  {editingId === charity.id ? (
                    <div className="bg-black/40 p-4 rounded-xl border border-indigo-500/30 mb-2">
                      <CharityForm initialData={charity} onSuccess={() => setEditingId(null)} />
                      <button onClick={() => setEditingId(null)} className="text-white/60 hover:text-white text-sm mt-2">Cancel Edit</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {charity.image_url ? (
                        <img src={charity.image_url} alt="Logo" className="w-12 h-12 rounded bg-white/5 object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-indigo-500/20 flex items-center justify-center text-xl">🌟</div>
                      )}
                      <div>
                        <div className="text-white font-medium">{charity.name}</div>
                        <div className="text-white/40 text-xs">/{charity.slug}</div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="p-4">
                  {charity.is_featured && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-bold">Featured</span>}
                </td>
                <td className="p-4 text-right align-top">
                  {editingId !== charity.id && (
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditingId(charity.id)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(charity.id)} className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
