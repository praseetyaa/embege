"use client"

import { Search, Filter } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export function SubmissionFilters({ initialSearch, initialStatus }: { initialSearch?: string, initialStatus?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status) {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    router.push(`/admin/submissions?${params.toString()}`)
  }

  return (
    <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center bg-slate-50">
      <form className="relative flex-1 min-w-[200px] max-w-sm flex items-center">
        <Search className="w-4 h-4 absolute left-3 text-slate-400" />
        <input 
          name="search"
          type="text" 
          defaultValue={initialSearch || ""}
          placeholder="Cari keterangan pengajuan..." 
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {initialStatus && <input type="hidden" name="status" value={initialStatus} />}
      </form>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            defaultValue={initialStatus || ""}
            className="bg-transparent border-none outline-none text-slate-600 focus:ring-0 cursor-pointer"
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu Review</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>
    </div>
  )
}
