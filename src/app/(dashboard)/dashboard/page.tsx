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
  AlertCircle,
  Package,
  Receipt,
  ArrowRight
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch summary stats
  const { data: reimbursements } = await supabase
    .from("reimbursements")
    .select("status, total_amount")
    .eq("user_id", user.id)

  const stats = reimbursements?.reduce((acc, curr) => {
    acc.total++
    acc.totalValue += Number(curr.total_amount)
    return acc
  }, { total: 0, totalValue: 0 }) || { total: 0, totalValue: 0 }

  // Fetch Asset Requests count
  const { count: assetRequestsCount } = await supabase
    .from("asset_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Fetch recent reimbursements
  const { data: recent } = await supabase
    .from("reimbursements")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Reminder Logic: Check for unassigned transactions older than 15 days
  const fifteenDaysAgo = new Date()
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)
  
  const { count: oldTransactionsCount } = await supabase
    .from("reimbursement_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("reimbursement_id", null)
    .lt("created_at", fifteenDaysAgo.toISOString())

  if (oldTransactionsCount && oldTransactionsCount > 0) {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: existingNotif } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .like("title", "%Reminder: Nota%")
      .gte("created_at", threeDaysAgo.toISOString())
      .limit(1)

    if (!existingNotif || existingNotif.length === 0) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Reminder: Nota Belum Diajukan",
        message: `Anda memiliki ${oldTransactionsCount} nota transaksi yang sudah lebih dari 15 hari belum diajukan. Segera buat pengajuan reimbursement!`,
        is_read: false
      })
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Selamat datang kembali! Berikut ringkasan aktivitas Anda.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/transactions/new"
            className="flex-1 sm:flex-none btn-primary shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 border-none hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Input Nota
          </Link>
          <Link
            href="/asset-requests/new"
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
          >
            <Package className="w-5 h-5 mr-2 text-amber-500" />
            Request ATK
          </Link>
        </div>
      </div>

      {/* Reminder Banner */}
      {oldTransactionsCount && oldTransactionsCount > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-amber-800">Reminder Pengajuan Reimbursement</h3>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              Ada <strong>{oldTransactionsCount} nota</strong> yang sudah mengendap lebih dari 15 hari. 
              Segera kelompokkan nota tersebut menjadi sebuah pengajuan agar proses reimbursement lebih cepat.
            </p>
            <Link 
              href="/transactions" 
              className="inline-flex items-center mt-3 text-sm font-bold text-amber-800 hover:text-amber-900 group"
            >
              Lihat Nota Sekarang
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      ) : null}

      {/* Main Stats - Row 1 (1 Col) */}
      <div className="w-full">
        <div className="relative bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden group p-8 min-h-[180px] flex flex-col justify-center">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full -ml-16 -mb-16 blur-3xl opacity-60"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Total Pengeluaran</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(stats.totalValue)}
              </h2>
              <p className="text-slate-400 text-sm font-medium">Akumulasi seluruh pengajuan reimbursement yang telah dicatat</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-12 w-[1px] bg-slate-100 hidden md:block"></div>
              <Link href="/history" className="group/btn flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20">
                Lihat Detail Riwayat
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 (2 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Transaksi */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <Receipt className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pengajuan</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.total}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Dokumen Reimbursement</p>
          </div>
        </div>

        {/* Total Permintaan ATK */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <Package className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Permintaan ATK</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{assetRequestsCount || 0}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Total Pengajuan ATK</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Aktivitas Terakhir</h2>
          <Link href="/history" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
            Lihat Semua <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          {(!recent || recent.length === 0) ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Belum ada aktivitas</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">Anda belum pernah mencatat pengeluaran. Mulai scan struk Anda sekarang.</p>
              <Link href="/transactions/new" className="btn-primary inline-flex items-center px-8">
                <PlusCircle className="w-5 h-5 mr-2" />
                Input Nota Pertama
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ID / Periode</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Keterangan</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Total Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recent.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                        <Link href={`/history/${item.id}`} className="block">
                          <span className="text-sm font-black text-blue-600 group-hover:underline">#{item.id.substring(0, 8)}</span>
                          <span className="block text-[10px] font-bold text-slate-400 mt-0.5">{item.period}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-5 font-bold text-slate-700">{item.title}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          item.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          item.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          item.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-slate-900">{formatCurrency(item.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
