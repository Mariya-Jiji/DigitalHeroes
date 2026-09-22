'use client'

import { useState } from 'react'
import { UploadCloud, CheckCircle } from 'lucide-react'
import { uploadProof } from './actions'

export default function WinnerProofUpload({ winningId }: { winningId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)

    const res = await uploadProof(winningId, formData)
    setIsUploading(false)

    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3 backdrop-blur-xl">
        <CheckCircle className="w-12 h-12 text-green-400" />
        <h3 className="text-xl font-bold text-white">Proof Uploaded!</h3>
        <p className="text-green-200/80">Your screenshot is under review by the admins. You will receive your payout soon.</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/50">
          <span className="text-3xl">🎉</span>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white">You Won!</h2>
          <p className="text-indigo-200/80 mt-1">Please upload a screenshot verifying your identity/account to claim your prize.</p>
        </div>

        <form onSubmit={handleUpload} className="w-full max-w-sm mt-4 space-y-4">
          <div className="relative">
            <input 
              type="file" 
              accept="image/*"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div className="bg-black/40 border border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/50 transition-colors">
              <UploadCloud className="w-6 h-6 text-white/40" />
              <span className="text-sm text-white/60 font-medium">
                {file ? file.name : 'Click to select screenshot'}
              </span>
            </div>
          </div>
          
          {error && <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">{error}</div>}
          
          <button 
            type="submit"
            disabled={!file || isUploading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)]"
          >
            {isUploading ? 'Uploading...' : 'Submit Proof'}
          </button>
        </form>
      </div>
    </div>
  )
}
