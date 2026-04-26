"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { 
  Package,
  Plus,
  Search,
  Eye,
  Trash2,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { AssetRequest, Profile } from "@/lib/types"

export default function AssetRequestsPage() {
  const [requests, setRequests] = useState<AssetRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  const supabase = createClient()

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      let query = supabase
        .from("asset_requests")
        .select(`
          *,
          profiles:user_id (*),
          asset_request_items (*)
        `)
        .order('created_at', { ascending: false })
        
      // For normal users, only show their own. RLS already handles this, but let's be explicit
      // Wait, RLS handles it. But we should just fetch.
        
      const { data, error } = await query

      if (error) throw error
      
      setRequests(data as any)
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast.error("Gagal memuat daftar permintaan")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus permintaan ini?")) return
    
    try {
      const { error } = await supabase
        .from("asset_requests")
        .delete()
        .eq("id", id)
        
      if (error) throw error
      
      toast.success("Permintaan berhasil dihapus")
      setRequests(requests.filter(r => r.id !== id))
    } catch (error) {
      console.error("Error deleting request:", error)
      toast.error("Gagal menghapus permintaan")
    }
  }

  const filteredRequests = requests.filter(req => {
    const searchLower = searchTerm.toLowerCase()
    const itemMatch = req.asset_request_items?.some(item => 
      item.item_name.toLowerCase().includes(searchLower)
    )
    return req.reg_form_no.toLowerCase().includes(searchLower) || itemMatch
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Permintaan ATK & Asset</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola dan pantau permintaan perbaikan asset dan ATK Anda.</p>
        </div>
        <Link href="/asset-requests/new" className="btn-primary flex items-center shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Buat Permintaan
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari form, nama barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm text-slate-600">No. Form</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Tanggal</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Department / Area</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Total Item</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                      <p>Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-1">Belum ada permintaan</h3>
                      <p className="text-slate-500 mb-4">Mulai buat form permintaan ATK & Asset baru.</p>
                      <Link href="/asset-requests/new" className="btn-primary text-sm">
                        Buat Permintaan
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-slate-800">{req.reg_form_no || 'GA01'}</span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {format(new Date(req.request_date), "dd MMM yyyy", { locale: idLocale })}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-800">{req.department || '-'}</div>
                      <div className="text-xs text-slate-500">{req.area || '-'}</div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {req.asset_request_items?.length || 0} Barang
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          href={`/asset-requests/${req.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5"
                          title="Lihat & Print Detail"
                        >
                          <Eye className="w-4 h-4" /> <span className="text-xs font-medium">Detail</span>
                        </Link>
                        <button 
                          onClick={() => handleDelete(req.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
