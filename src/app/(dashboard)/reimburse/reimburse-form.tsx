"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { Save, Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { EXPENSE_CATEGORIES } from "@/lib/constants"
import Link from "next/link"

export function ReimburseForm({ initialItems }: { initialItems: any[] }) {
  const [items, setItems] = useState<any[]>(initialItems)
  const [title, setTitle] = useState("")
  const [period, setPeriod] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  const handleSubmit = async () => {
    if (!period || !title) {
      toast.warning("Mohon lengkapi judul pengajuan dan periode")
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/reimbursements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          period,
          title,
          notes,
          total_amount: totalAmount,
          items // These items will be updated and linked to the new reimbursement
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Pengajuan berhasil dikirim!")
        // Redirect to detail page
        router.push(`/history/${data.id}`)
        router.refresh()
      } else {
        const data = await response.json()
        toast.error("Error: " + data.error)
      }
    } catch (error) {
      console.error(error)
      toast.error("Gagal mengirim pengajuan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-0">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Daftar Nota Terpilih</h2>
          <p className="text-sm text-slate-500 mt-1">Anda dapat melakukan penyesuaian (edit) sebelum mengajukan.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm text-slate-600">Tanggal</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Keterangan</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Kategori</th>
                <th className="p-4 font-semibold text-sm text-slate-600">Toko/Vendor</th>
                <th className="p-4 font-semibold text-sm text-slate-600 text-right">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="p-3">
                    <input 
                      type="date" 
                      value={item.date} 
                      onChange={(e) => updateItem(item.id, 'date', e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      type="text" 
                      value={item.description} 
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <select 
                      value={item.category || "Lain-lain"} 
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="Lain-lain" disabled>Pilih Kategori</option>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <input 
                      type="text" 
                      value={item.vendor || ''} 
                      onChange={(e) => updateItem(item.id, 'vendor', e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      type="text" 
                      value={item.amount ? Number(item.amount).toLocaleString('id-ID') : ''} 
                      onChange={(e) => updateItem(item.id, 'amount', Number(e.target.value.replace(/\D/g, '')))}
                      className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-right font-medium"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-blue-100">
                <td colSpan={4} className="p-4 text-right font-bold text-slate-700">Total Pengajuan:</td>
                <td className="p-4 text-right font-bold text-blue-700 text-lg">{formatCurrency(totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="p-8 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Detail Pengajuan</h2>
        
        <div className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul Pengajuan *</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Misal: Reimbursement Mei 2024"
              className="w-full p-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Periode *</label>
            <input 
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opsional..."
              rows={3}
              className="w-full p-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
          <Link href="/transactions" className="btn-secondary flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Batal
          </Link>
          <button 
            onClick={handleSubmit} 
            className="btn-primary flex items-center bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            disabled={isSubmitting || !title || !period}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Kirim Pengajuan</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
