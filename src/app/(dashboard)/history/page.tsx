import { createClient } from "@/lib/supabase/server"
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils"
import Link from "next/link"
import { FileText, ChevronRight } from "lucide-react"
import { HistoryFilters } from "./history-filters"

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; period?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Await the search parameters to fix Next.js 15+ error where searchParams is a promise
  const params = await searchParams

  let query = supabase
    .from("reimbursements")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (params.status) {
    query = query.eq("status", params.status)
  }

  if (params.period) {
    query = query.eq("period", params.period)
  }

  const { data: reimbursements } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Pengajuan</h1>
          <p className="text-slate-500">Daftar semua reimbursement yang pernah Anda ajukan</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
        <HistoryFilters initialStatus={params.status} />

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {(!reimbursements || reimbursements.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Belum ada data</h3>
              <p className="text-slate-500">Tidak ada pengajuan yang sesuai dengan kriteria.</p>
            </div>
          ) : (
            <table className="data-table w-full relative">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr>
                  <th>ID</th>
                  <th>Tanggal Pengajuan</th>
                  <th>Periode</th>
                  <th>Judul/Keterangan</th>
                  <th>Total Nilai</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reimbursements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-medium text-slate-900">
                      #{item.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="text-slate-600">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="text-slate-600">{item.period}</td>
                    <td className="font-medium text-slate-900">{item.title}</td>
                    <td className="font-bold text-slate-900">{formatCurrency(item.total_amount)}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <Link 
                        href={`/history/${item.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                      >
                        Detail <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
