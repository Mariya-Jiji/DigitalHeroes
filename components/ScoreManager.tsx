'use client';

import { useState, useActionState, useEffect } from 'react';
import { Trash2, Edit2, Check, X, Calendar, Hash } from 'lucide-react';
import { addScore, updateScore, deleteScore } from '@/app/dashboard/actions';

type Score = {
  id: string;
  value: number;
  played_on: string;
};

export default function ScoreManager({ initialScores }: { initialScores: Score[] }) {
  const [scores, setScores] = useState<Score[]>(initialScores);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number | ''>('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Keep client state in sync with server state (needed after insertions/deletions)
  useEffect(() => {
    setScores(initialScores);
  }, [initialScores]);

  // useActionState for the form
  const [addState, formAction, isAdding] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await addScore(prevState, formData);
      if (res.success) {
        // Reset form on success
        const form = document.getElementById('score-form') as HTMLFormElement;
        form?.reset();
      }
      return res;
    },
    { error: null, success: false }
  );

  // Today's date string for the max attribute
  const today = new Date().toISOString().split('T')[0];

  const handleEditClick = (score: Score) => {
    setEditingId(score.id);
    setEditValue(score.value);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSaveEdit = async (id: string) => {
    if (editValue === '' || editValue < 1 || editValue > 45) {
      alert('Score must be between 1 and 45');
      return;
    }
    
    setIsUpdating(true);
    const res = await updateScore(id, editValue as number);
    setIsUpdating(false);
    
    if (res.error) {
      alert(res.error);
    } else {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this score?')) {
      setIsUpdating(true);
      const res = await deleteScore(id);
      setIsUpdating(false);
      
      if (res.error) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 space-y-8">
      {/* Score Entry Form */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none" />
        
        <h2 className="text-2xl font-bold text-white mb-6 relative z-10">Add New Score</h2>
        
        <form id="score-form" action={formAction} className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label htmlFor="value" className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Hash className="w-4 h-4" /> Score (1-45)
              </label>
              <input
                type="number"
                id="value"
                name="value"
                min="1"
                max="45"
                required
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Enter score..."
              />
            </div>
            
            <div className="flex-1 space-y-2">
              <label htmlFor="played_on" className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Date Played
              </label>
              <input
                type="date"
                id="played_on"
                name="played_on"
                max={today}
                defaultValue={today}
                required
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          </div>
          
          {addState?.error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
              {addState.error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isAdding}
            className="w-full bg-white text-black hover:bg-gray-100 font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isAdding ? 'Adding Score...' : 'Submit Score'}
          </button>
        </form>
      </div>

      {/* Scores List */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-end mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-white">Your Scores</h2>
          <div className="text-sm">
            <span className={`font-medium ${scores.length >= 5 ? 'text-green-400' : 'text-amber-400'}`}>
              {scores.length} / 5
            </span>
          </div>
        </div>

        {scores.length < 5 && (
          <div className="mb-6 bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 px-4 py-3 rounded-xl text-sm flex items-start gap-3 relative z-10">
            <div className="mt-0.5 animate-pulse">💡</div>
            <p>Enter {5 - scores.length} more scores to become eligible for monthly draws. Only your 5 most recent scores are kept.</p>
          </div>
        )}

        <div className="relative z-10">
          {scores.length === 0 ? (
            <div className="text-center py-8 text-white/50 border border-dashed border-white/10 rounded-xl">
              No scores recorded yet. Add your first score above!
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((score) => (
                <div 
                  key={score.id}
                  className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:border-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-4 w-1/3">
                    <Calendar className="w-5 h-5 text-white/40" />
                    <span className="text-white/80 font-medium">
                      {new Date(score.played_on).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex-1 flex justify-center">
                    {editingId === score.id ? (
                      <input
                        type="number"
                        min="1"
                        max="45"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value ? Number(e.target.value) : '')}
                        className="w-24 bg-black/40 border border-indigo-500/50 rounded-lg px-3 py-1 text-center text-white font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(score.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white tracking-tight">
                        {score.value}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 w-1/3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {editingId === score.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(score.id)}
                          disabled={isUpdating}
                          className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="p-2 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClick(score)}
                          disabled={isUpdating || editingId !== null}
                          className="p-2 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(score.id)}
                          disabled={isUpdating || editingId !== null}
                          className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
