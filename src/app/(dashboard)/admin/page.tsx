import { createClient } from "@/lib/supabase/server"
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils"
import Link from "next/link"
import { Users, FileText, CheckCircle, Clock, ChevronRight, XCircle } from "lucide-react"

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch pending submissions
  const { data: pendingReimbursements } = await supabase
    .from("reimbursements")
    .select(`
      id, created_at, period, title, total_amount, status,
      profiles (full_name, department)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch stats
  const { count: pendingCount } = await supabase
    .from("reimbursements")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  const { count: approvedCount } = await supabase
    .from("reimbursements")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")

  const { count: rejectedCount } = await supabase
    .from("reimbursements")
    .select("*", { count: "exact", head: true })
    .eq("status", "rejected")

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">Kelola dan tinjau semua pengajuan reimbursement</p>
        </div>
        <Link href="/admin/submissions" className="btn-primary">
          Lihat Semua Pengajuan
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="stats-card">
          <div className="stats-icon bg-amber-100 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <p className="stats-title">Menunggu Review</p>
          <p className="stats-value">{pendingCount || 0}</p>
        </div>
        <div className="stats-card">
          <div className="stats-icon bg-emerald-100 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="stats-title">Disetujui</p>
          <p className="stats-value">{approvedCount || 0}</p>
        </div>
        <div className="stats-card">
          <div className="stats-icon bg-red-100 text-red-600">
            <XCircle className="w-6 h-6" />
          </div>
          <p className="stats-title">Ditolak</p>
          <p className="stats-value">{rejectedCount || 0}</p>
        </div>
        <div className="stats-card">
          <div className="stats-icon bg-blue-100 text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <p className="stats-title">Total Karyawan</p>
          <p className="stats-value">{userCount || 0}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Perlu Ditinjau Segera
          </h2>
          <Link href="/admin/submissions" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
            Lihat Semua <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {(!pendingReimbursements || pendingReimbursements.length === 0) ? (
            <div className="p-8 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-lg font-medium text-slate-900">Semua Beres!</p>
              <p>Tidak ada pengajuan yang menunggu untuk ditinjau saat ini.</p>
            </div>
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Pengaju</th>
                  <th>Departemen</th>
                  <th>Periode</th>
                  <th>Total Pengajuan</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingReimbursements.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="font-medium text-slate-900">{item.profiles?.full_name}</td>
                    <td className="text-slate-600">{item.profiles?.department || '-'}</td>
                    <td className="text-slate-600">{item.period}</td>
                    <td className="font-bold text-slate-900">{formatCurrency(item.total_amount)}</td>
                    <td className="text-slate-600">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <Link 
                        href={`/admin/submissions/${item.id}`}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Tinjau
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
