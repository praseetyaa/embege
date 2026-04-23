"use client"

import { Search, Filter } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function SubmissionFilters({ initialSearch }: { initialSearch?: string }) {
  return (
    <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center bg-slate-50">
      <form className="relative flex-1 min-w-[200px] max-w-sm flex items-center">
        <Search className="w-4 h-4 absolute left-3 text-slate-400" />
        <input 
          name="search"
          type="text" 
          defaultValue={initialSearch || ""}
          placeholder="Cari keterangan catatan..." 
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>
    </div>
  )
}
