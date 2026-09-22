'use client'

import { useState } from 'react'
import { updateVerification, markPaid } from './actions'
import { Check, X, DollarSign, ExternalLink } from 'lucide-react'

export default function WinnersList({ winners }: { winners: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
    setLoadingId(id)
    const res = await updateVerification(id, status)
    if (res?.error) alert(res.error)
    setLoadingId(null)
  }

  const handlePay = async (id: string) => {
    if (!window.confirm('Are you sure you want to mark this as paid?')) return
    setLoadingId(id)
    const res = await markPaid(id)
    if (res?.error) alert(res.error)
    setLoadingId(null)
  }

  return (
    <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="p-4 text-white/60 font-medium text-sm">User</th>
            <th className="p-4 text-white/60 font-medium text-sm">Draw / Tier</th>
            <th className="p-4 text-white/60 font-medium text-sm">Amount</th>
            <th className="p-4 text-white/60 font-medium text-sm">Proof</th>
            <th className="p-4 text-white/60 font-medium text-sm">Status</th>
            <th className="p-4 text-white/60 font-medium text-sm text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {winners.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-white/40">No winners found.</td>
            </tr>
          ) : winners.map(win => (
            <tr key={win.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="p-4">
                <div className="text-white font-medium">{win.profiles?.full_name || 'Unknown User'}</div>
                <div className="text-white/40 text-xs font-mono">{win.user_id}</div>
              </td>
              <td className="p-4 text-white/80">
                {win.draws?.period} <span className="text-indigo-400 font-bold ml-2">Tier {win.tier}</span>
              </td>
              <td className="p-4 font-bold text-green-400">
                ${win.amount.toFixed(2)}
              </td>
              <td className="p-4">
                {win.proof_url ? (
                  <a href={win.proof_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300">
                    <img src={win.proof_url} alt="Proof" className="w-10 h-10 object-cover rounded border border-white/20" />
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <span className="text-white/40 text-sm">Awaiting Upload</span>
                )}
              </td>
              <td className="p-4">
                <div className="flex flex-col gap-1">
                  <span className={`px-2 py-1 rounded text-xs font-semibold w-max ${
                    win.verification === 'approved' ? 'bg-green-500/20 text-green-400' :
                    win.verification === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    Verify: {win.verification.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold w-max ${
                    win.payment === 'paid' ? 'bg-green-500/20 text-green-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    Paid: {win.payment.toUpperCase()}
                  </span>
                </div>
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  {win.verification === 'pending' && win.proof_url && (
                    <>
                      <button 
                        onClick={() => handleVerify(win.id, 'approved')}
                        disabled={loadingId === win.id}
                        className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                        title="Approve Verification"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleVerify(win.id, 'rejected')}
                        disabled={loadingId === win.id}
                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Reject Verification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {win.verification === 'approved' && win.payment === 'pending' && (
                    <button 
                      onClick={() => handlePay(win.id)}
                      disabled={loadingId === win.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <DollarSign className="w-4 h-4" /> Pay
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
