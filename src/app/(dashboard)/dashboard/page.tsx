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
    if (curr.status === 'pending') acc.pending++
    if (curr.status === 'approved') {
      acc.approved++
      acc.totalValue += Number(curr.total_amount)
    }
    if (curr.status === 'rejected') acc.rejected++
    return acc
  }, { total: 0, pending: 0, approved: 0, rejected: 0, totalValue: 0 }) || { total: 0, pending: 0, approved: 0, rejected: 0, totalValue: 0 }

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
          <p className="text-slate-500">Ringkasan pengajuan reimbursement Anda</p>
        </div>
        
        <Link 
          href="/new" 
          className="btn-primary"
        >
          <PlusCircle className="w-5 h-5" />
          Buat Pengajuan Baru
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm card-hover">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Pengajuan</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.total}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="text-sm text-blue-600 flex items-center gap-1 font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Bulan ini</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm card-hover">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Menunggu Konfirmasi</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.pending}</h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="text-sm text-amber-600 flex items-center gap-1 font-medium">
            <span>Proses review</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm card-hover">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Disetujui</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.approved}</h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="text-sm text-emerald-600 flex items-center gap-1 font-medium">
            <span>Siap dibayarkan</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm card-hover relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-95"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-blue-100 mb-1">Total Nilai Disetujui</p>
                <h3 className="text-2xl font-bold text-white truncate">{formatCurrency(stats.totalValue)}</h3>
              </div>
            </div>
            <div className="text-sm text-blue-100 flex items-center gap-1">
              <span>Bulan ini</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-slide-up stagger-1">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900">Pengajuan Terakhir</h2>
          <Link href="/history" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
            Lihat Semua <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        {(!recent || recent.length === 0) ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Belum ada pengajuan</h3>
            <p className="text-slate-500 mb-6">Anda belum pernah membuat pengajuan reimbursement.</p>
            <Link href="/new" className="btn-primary">
              Buat Pengajuan Pertama
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
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium text-blue-600">
                      <Link href={`/history/${item.id}`}>
                        #{item.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td>{item.period}</td>
                    <td>{item.title}</td>
                    <td className="font-medium">{formatCurrency(item.total_amount)}</td>
                    <td>
                      <span className={`status-badge ${
                        item.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        item.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {item.status === 'pending' ? 'Menunggu' :
                         item.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
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
