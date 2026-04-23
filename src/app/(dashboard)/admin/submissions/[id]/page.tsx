import { createClient } from "@/lib/supabase/server"
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { PrintPdfButton } from "@/components/ui/print-pdf-button"
import { ArrowLeft, Download, FileText, User, Building, CreditCard } from "lucide-react"
import { DownloadExcelButton } from "@/components/ui/download-excel-button"
import { ExpenseFormTemplate } from "@/components/print/ExpenseFormTemplate"
import { SingleDocumentPasteTemplate } from "@/components/print/SingleDocumentPasteTemplate"

export default async function AdminSubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const supabase = await createClient()

  const { data: reimbursement } = await supabase
    .from("reimbursements")
    .select(`
      *,
      reimbursement_items (*, categories(*)),
      profiles (full_name, email, department, bank_name, bank_account)
    `)
    .eq("id", p.id)
    .single()

  if (!reimbursement) {
    notFound()
  }

  const items = reimbursement.reimbursement_items || []
  const profile = reimbursement.profiles

  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto pb-12 print:hidden">
        <div className="flex items-center gap-4 print:hidden">
        <Link href="/admin/submissions" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Detail Catatan</h1>
          <p className="text-slate-500">#{reimbursement.id.substring(0, 8).toUpperCase()}</p>
        </div>
        <div className="ml-auto flex gap-2 print:hidden">
          <DownloadExcelButton reimbursement={reimbursement} />
          <PrintPdfButton />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main Info */}
        <div className="space-y-6">
          {/* User Info Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Informasi Pengaju</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 text-xs">Nama Lengkap</p>
                    <p className="font-medium text-slate-900">{profile?.full_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 text-xs">Departemen</p>
                    <p className="font-medium text-slate-900">{profile?.department || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-500 text-xs">Rekening Bank</p>
                    <p className="font-medium text-slate-900">{profile?.bank_name || '-'}</p>
                    <p className="text-slate-600 font-mono mt-0.5">{profile?.bank_account || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-1">{reimbursement.title}</h2>
              <p className="text-slate-500 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Periode: {reimbursement.period}
              </p>
            </div>
            
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 font-semibold text-slate-600">Tanggal</th>
                    <th className="p-4 font-semibold text-slate-600">Keterangan</th>
                    <th className="p-4 font-semibold text-slate-600">Vendor</th>
                    <th className="p-4 font-semibold text-slate-600">Struk/Bukti</th>
                    <th className="p-4 text-right font-semibold text-slate-600">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="p-4">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                      <td className="p-4 font-medium text-slate-800">{item.description}</td>
                      <td className="p-4 text-slate-600">{item.vendor}</td>
                      <td className="p-4">
                        {item.receipt_url ? (
                          <a 
                            href={item.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> Lihat
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Tidak ada</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-medium text-slate-900">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 border-t border-blue-100">
                    <td colSpan={4} className="p-4 text-right font-bold text-slate-700">Total Pengajuan:</td>
                    <td className="p-4 text-right font-bold text-blue-700 text-lg">{formatCurrency(reimbursement.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {reimbursement.notes && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
              <h3 className="font-semibold text-slate-800 mb-2">Catatan Tambahan</h3>
              <p className="text-slate-600 bg-amber-50 p-4 rounded-lg border border-amber-100">{reimbursement.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>

      <div className="hidden print:block print:w-[297mm]">
        <ExpenseFormTemplate reimbursement={reimbursement} />
        <div className="break-before-page"></div>
        <SingleDocumentPasteTemplate reimbursement={reimbursement} />
      </div>
    </>
  )
}
