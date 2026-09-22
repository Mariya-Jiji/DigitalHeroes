'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

type Charity = {
  id: string
  name: string
  slug: string
  description: string
  image_url: string
}

export default function CharityDirectory({ charities }: { charities: Charity[] }) {
  const [search, setSearch] = useState('')

  const filtered = charities.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/40" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search charities by name..."
          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-xl transition-all"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-white/40">
            No charities found matching "{search}"
          </div>
        ) : (
          filtered.map(charity => (
            <Link 
              key={charity.id} 
              href={`/charities/${charity.slug}`}
              className="group block bg-black/20 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl hover:bg-white/5 hover:border-indigo-500/50 transition-all duration-300"
            >
              {charity.image_url ? (
                <div className="h-48 w-full overflow-hidden bg-white/5">
                  <img 
                    src={charity.image_url} 
                    alt={charity.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="h-48 w-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                  <span className="text-4xl">🌟</span>
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                  {charity.name}
                </h3>
                <p className="text-white/60 line-clamp-3 text-sm">
                  {charity.description || 'No description provided.'}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
