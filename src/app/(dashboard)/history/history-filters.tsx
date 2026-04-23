"use client"

import { Search, Filter } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function HistoryFilters() {
  return (
    <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center bg-slate-50">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Cari keterangan..." 
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
