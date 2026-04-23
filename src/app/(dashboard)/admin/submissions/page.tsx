import { createClient } from "@/lib/supabase/server"
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils"
import Link from "next/link"
import { Search, Filter, ChevronRight, FileText } from "lucide-react"
import { SubmissionFilters } from "./submission-filters"

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("reimbursements")
    .select(`
      id, created_at, period, title, total_amount, status,
      profiles (full_name, department)
    `)
    .order("created_at", { ascending: false })

  if (params.status) {
    query = query.eq("status", params.status)
  }
  
  // Basic search matching title (a real app might use a text search vector or ILIKE on RPC)
  if (params.search) {
    query = query.ilike("title", `%${params.search}%`)
  }

  const { data: reimbursements } = await query

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Semua Catatan</h1>
          <p className="text-slate-500">Kelola daftar seluruh catatan pengeluaran karyawan</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <SubmissionFilters initialSearch={params.search} />

        {/* List */}
        <div className="flex-1 overflow-x-auto">
          {(!reimbursements || reimbursements.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Data tidak ditemukan</h3>
              <p className="text-slate-500">Tidak ada catatan yang sesuai dengan pencarian Anda.</p>
            </div>
          ) : (
            <table className="data-table w-full relative">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr>
                  <th>Pengguna</th>
                  <th>Departemen</th>
                  <th>Judul Catatan</th>
                  <th>Periode</th>
                  <th>Total Nilai</th>
                  <th>Tanggal Dicatat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reimbursements.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="font-medium text-slate-900">{item.profiles?.full_name}</td>
                    <td className="text-slate-600">{item.profiles?.department || '-'}</td>
                    <td className="font-medium text-slate-800">{item.title}</td>
                    <td className="text-slate-600">{item.period}</td>
                    <td className="font-bold text-slate-900">{formatCurrency(item.total_amount)}</td>
                    <td className="text-slate-600">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <Link 
                        href={`/admin/submissions/${item.id}`}
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
