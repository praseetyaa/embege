import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import {
  FileText,
  Clock,
  CheckCircle,
  PlusCircle,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch summary stats
  // We'll use mock numbers if DB is empty or fails
  const { data: reimbursements } = await supabase
    .from("reimbursements")
    .select("status, total_amount")
    .eq("user_id", user.id)

  const stats = reimbursements?.reduce((acc, curr) => {
    acc.total++
    // In personal mode, all reimbursements count towards total value
    acc.totalValue += Number(curr.total_amount)
    return acc
  }, { total: 0, totalValue: 0 }) || { total: 0, totalValue: 0 }

  // Fetch recent reimbursements
  const { data: recent } = await supabase
    .from("reimbursements")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Ringkasan pengeluaran Anda</p>
        </div>

        <Link
          href="/transactions/new"
          className="btn-primary shadow-sm shadow-blue-500/20"
        >
          <PlusCircle className="w-5 h-5" />
          Catat Pengeluaran Baru
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm card-hover relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <FileText className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Transaksi</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.total}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="text-sm text-blue-600 flex items-center gap-1 font-medium relative z-10">
            <TrendingUp className="w-4 h-4" />
            <span>Semua waktu</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm card-hover relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-[0.98]"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-emerald-50 mb-1">Total Pengeluaran</p>
                <h3 className="text-3xl font-bold text-white truncate">{formatCurrency(stats.totalValue)}</h3>
              </div>
            </div>
            <div className="text-sm text-emerald-100 flex items-center gap-1">
              <span>Semua waktu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-slide-up stagger-1">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-900">Catatan Terakhir</h2>
          <Link href="/history" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
            Lihat Semua <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {(!recent || recent.length === 0) ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-100 shadow-sm">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Belum ada catatan</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Anda belum pernah mencatat pengeluaran. Mulai scan struk Anda sekarang.</p>
            <Link href="/new" className="btn-primary">
              Catat Pengeluaran Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Periode</th>
                  <th>Keterangan</th>
                  <th>Total</th>
                  <th>Tanggal Dicatat</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id} className="group cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="font-medium text-blue-600 group-hover:text-blue-700">
                      <Link href={`/history/${item.id}`} className="flex items-center gap-2">
                        #{item.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                        {item.period}
                      </span>
                    </td>
                    <td className="text-slate-700 font-medium">{item.title}</td>
                    <td className="font-semibold text-slate-900">{formatCurrency(item.total_amount)}</td>
                    <td className="text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
