import { createClient } from "@/lib/supabase/server"
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Download, FileText, CheckCircle, XCircle, Clock } from "lucide-react"
import { DownloadExcelButton } from "@/components/ui/download-excel-button"

export default async function ReimbursementDetail({ params }: { params: Promise<{ id: string }> }) {
  // Await params first to satisfy Next 15+ 
  const p = await Promise.resolve(params)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: reimbursement } = await supabase
    .from("reimbursements")
    .select(`
      *,
      reimbursement_items (*, categories(*)),
      profiles (*)
    `)
    .eq("id", p.id)
    .eq("user_id", user.id)
    .single()

  if (!reimbursement) {
    notFound()
  }

  const items = reimbursement.reimbursement_items || []

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/history" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Detail Pengajuan</h1>
          <p className="text-slate-500">#{reimbursement.id.substring(0, 8).toUpperCase()}</p>
        </div>
        <div className="ml-auto">
          {reimbursement.status === 'approved' && (
            <DownloadExcelButton reimbursement={reimbursement} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">{reimbursement.title}</h2>
                <p className="text-slate-500 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Periode: {reimbursement.period}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(reimbursement.status)}`}>
                {getStatusLabel(reimbursement.status)}
              </span>
            </div>
            
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 font-semibold text-slate-600">Tanggal</th>
                    <th className="p-4 font-semibold text-slate-600">Keterangan</th>
                    <th className="p-4 font-semibold text-slate-600">Vendor</th>
                    <th className="p-4 text-right font-semibold text-slate-600">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="p-4">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 font-medium text-slate-800">{item.description}</td>
                      <td className="p-4 text-slate-600">{item.vendor}</td>
                      <td className="p-4 text-right font-medium text-slate-900">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 border-t border-blue-100">
                    <td colSpan={3} className="p-4 text-right font-bold text-slate-700">Total Keseluruhan:</td>
                    <td className="p-4 text-right font-bold text-blue-700 text-lg">{formatCurrency(reimbursement.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {reimbursement.notes && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-2">Catatan Pengaju</h3>
              <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">{reimbursement.notes}</p>
            </div>
          )}

          {reimbursement.admin_notes && (
            <div className={`p-6 rounded-xl shadow-sm border ${reimbursement.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <h3 className={`font-semibold mb-2 ${reimbursement.status === 'rejected' ? 'text-red-800' : 'text-emerald-800'}`}>
                Catatan Admin ({reimbursement.status === 'rejected' ? 'Alasan Penolakan' : 'Persetujuan'})
              </h3>
              <p className={reimbursement.status === 'rejected' ? 'text-red-700' : 'text-emerald-700'}>
                {reimbursement.admin_notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Timeline */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6">Status Timeline</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-blue-500 text-white shadow shrink-0 z-10">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-sm ml-4 md:ml-0 md:mr-4">
                  <h4 className="font-semibold text-slate-900 text-sm">Pengajuan Dibuat</h4>
                  <p className="text-xs text-slate-500 mt-1">{new Date(reimbursement.created_at).toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow shrink-0 z-10 ${
                  reimbursement.status === 'pending' ? 'bg-amber-400 text-white animate-pulse' : 
                  'bg-blue-500 text-white'
                }`}>
                  {reimbursement.status === 'pending' ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </div>
                <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-lg border shadow-sm ml-4 md:ml-0 md:mr-4 ${
                  reimbursement.status === 'pending' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
                }`}>
                  <h4 className="font-semibold text-slate-900 text-sm">Menunggu Review Admin</h4>
                  {reimbursement.status === 'pending' && <p className="text-xs text-amber-600 mt-1">Dalam proses</p>}
                </div>
              </div>

              {reimbursement.status !== 'pending' && (
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow shrink-0 z-10 ${
                    reimbursement.status === 'approved' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {reimbursement.status === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-lg border shadow-sm ml-4 md:ml-0 md:mr-4 ${
                    reimbursement.status === 'approved' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                  }`}>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {reimbursement.status === 'approved' ? 'Pengajuan Disetujui' : 'Pengajuan Ditolak'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{new Date(reimbursement.updated_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
