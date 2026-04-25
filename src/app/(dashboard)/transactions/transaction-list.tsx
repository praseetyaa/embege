"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { FileText, CheckCircle, ArrowRight, Search, Filter } from "lucide-react"

type FilterStatus = "semua" | "belum_diajukan" | "sudah_diajukan"

export function TransactionList({ initialData }: { initialData: any[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("belum_diajukan")
  
  const router = useRouter()

  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      // Filter by search query
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.vendor && item.vendor.toLowerCase().includes(searchLower))

      // Filter by status
      const isAssigned = !!item.reimbursement_id
      const matchesStatus = 
        filterStatus === "semua" ? true :
        filterStatus === "sudah_diajukan" ? isAssigned :
        !isAssigned // belum_diajukan

      return matchesSearch && matchesStatus
    })
  }, [initialData, searchQuery, filterStatus])

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const unassignedFilteredItems = filteredData.filter(item => !item.reimbursement_id)
  
  const toggleSelectAll = () => {
    if (selectedIds.length === unassignedFilteredItems.length && unassignedFilteredItems.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(unassignedFilteredItems.map(item => item.id))
    }
  }

  const handleReimburse = () => {
    if (selectedIds.length === 0) return
    router.push(`/reimburse?items=${selectedIds.join(',')}`)
  }

  const allSelected = unassignedFilteredItems.length > 0 && selectedIds.length === unassignedFilteredItems.length

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari keterangan atau vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="block w-full sm:w-auto pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="belum_diajukan">Belum Diajukan</option>
            <option value="sudah_diajukan">Sudah Diajukan</option>
            <option value="semua">Semua Transaksi</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative min-h-[400px]">
        
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Data tidak ditemukan</h3>
            <p className="text-slate-500 mb-6">
              {initialData.length === 0 
                ? "Anda belum pernah menginput nota apapun." 
                : "Tidak ada nota yang sesuai dengan pencarian atau filter Anda."}
            </p>
            {initialData.length === 0 && (
              <button onClick={() => router.push('/transactions/new')} className="btn-primary">
                Input Nota Sekarang
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto pb-20">
            <table className="data-table w-full relative">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input 
                      type="checkbox" 
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      disabled={unassignedFilteredItems.length === 0}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 disabled:opacity-50"
                    />
                  </th>
                  <th className="text-left font-semibold text-sm text-slate-600 p-4">Tanggal</th>
                  <th className="text-left font-semibold text-sm text-slate-600 p-4">Keterangan</th>
                  <th className="text-left font-semibold text-sm text-slate-600 p-4">Vendor</th>
                  <th className="text-right font-semibold text-sm text-slate-600 p-4">Jumlah (Rp)</th>
                  <th className="text-center font-semibold text-sm text-slate-600 p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const isAssigned = !!item.reimbursement_id
                  const isSelected = selectedIds.includes(item.id)

                  return (
                    <tr 
                      key={item.id} 
                      className={`border-b border-slate-100 transition-colors ${
                        isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                      } ${isAssigned ? 'opacity-70' : ''}`}
                      onClick={() => !isAssigned && toggleSelect(item.id)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          disabled={isAssigned}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 disabled:opacity-50"
                        />
                      </td>
                      <td className="p-4 text-slate-700 text-sm">
                        {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 font-medium text-slate-900 text-sm">
                        {item.description}
                      </td>
                      <td className="p-4 text-slate-600 text-sm">
                        {item.vendor || '-'}
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="p-4 text-center">
                        {isAssigned ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sudah Diajukan
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Belum Diajukan
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Floating Action Bar */}
        {selectedIds.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-between items-center animate-slide-up">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">
                {selectedIds.length}
              </div>
              <span className="text-slate-700 font-medium">Nota dipilih</span>
            </div>
            
            <button 
              onClick={handleReimburse}
              className="btn-primary flex items-center bg-blue-600 hover:bg-blue-700"
            >
              Reimburse Sekarang <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
