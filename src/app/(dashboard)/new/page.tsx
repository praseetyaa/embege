"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { 
  Upload, 
  FileImage, 
  X, 
  Plus, 
  Save, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Loader2,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import { EXPENSE_CATEGORIES } from "@/lib/constants"

export default function NewReimbursementPage() {
  const [step, setStep] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [period, setPeriod] = useState("")
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  
  const [items, setItems] = useState<any[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // 1. Handle File Upload & OCR
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    // For MVP, process one by one
    const newItems = [...items]
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append("file", file)
      
      try {
        const response = await fetch("/api/ocr", {
          method: "POST",
          body: formData
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.error) {
            toast.error(`Gagal membaca struk: ${data.error}`)
          }
          newItems.push({
            id: Date.now().toString() + i,
            ...data,
          })
        } else {
          const errData = await response.json().catch(() => ({}))
          toast.error(`Gagal upload struk: ${errData.error || response.statusText}`)
        }
      } catch (error) {
        console.error("OCR Error:", error)
        toast.error("Terjadi kesalahan sistem saat menghubungi server OCR.")
      }
    }
    
    setItems(newItems)
    setIsUploading(false)
    if (newItems.length > 0) setStep(2)
  }

  // 2. Handle Item Editing
  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const addNewItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: "",
        category: "Lain-lain",
        vendor: "",
        amount: 0,
        receipt_url: ""
      }
    ])
  }

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  // 3. Handle Submit
  const handleSubmit = async () => {
    if (!period || !title || items.length === 0) {
      toast.warning("Mohon lengkapi periode, judul, dan minimal 1 item pengeluaran")
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
          items
        })
      })

      if (response.ok) {
        toast.success("Pengajuan berhasil dikirim!")
        router.push("/dashboard")
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Buat Pengajuan Baru</h1>
        <p className="text-slate-500">Upload struk, edit detail, dan kirim pengajuan reimbursement</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 rounded-full transition-all duration-500"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        ></div>
        
        {[1, 2, 3].map((s) => (
          <div 
            key={s} 
            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-colors ${
              step >= s ? 'bg-blue-600 border-white text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Upload Struk/Nota</h2>
            
            <div 
              className="upload-zone mx-auto max-w-2xl mb-8"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-lg font-medium text-slate-700">Sedang memindai dengan AI...</p>
                  <p className="text-sm text-slate-500 mt-2">Membaca detail struk otomatis</p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-lg font-medium text-slate-700 mb-1">Klik atau Drag & Drop file disini</p>
                  <p className="text-sm text-slate-500">Mendukung JPG, PNG, PDF (Max. 5MB)</p>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              accept="image/*,.pdf" 
              onChange={handleFileUpload}
            />

            <div className="flex justify-center">
              <button 
                onClick={() => setStep(2)}
                className="text-slate-500 hover:text-slate-700 font-medium"
              >
                Lewati & Input Manual
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW & EDIT */}
        {step === 2 && (
          <div className="p-0">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Review Item Pengeluaran</h2>
              <button 
                onClick={addNewItem}
                className="btn-secondary text-sm py-2"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Item Manual
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                Belum ada item pengeluaran.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 font-semibold text-sm text-slate-600">Tanggal</th>
                      <th className="p-4 font-semibold text-sm text-slate-600">Keterangan</th>
                      <th className="p-4 font-semibold text-sm text-slate-600">Kategori</th>
                      <th className="p-4 font-semibold text-sm text-slate-600">Toko/Vendor</th>
                      <th className="p-4 font-semibold text-sm text-slate-600">Jumlah (Rp)</th>
                      <th className="p-4 font-semibold text-sm text-slate-600 w-16"></th>
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
                            placeholder="Makan siang..."
                          />
                        </td>
                        <td className="p-3">
                          <select 
                            value={item.category} 
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
                            value={item.vendor} 
                            onChange={(e) => updateItem(item.id, 'vendor', e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Nama toko"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            value={item.amount} 
                            onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-right font-medium"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50 border-t-2 border-blue-100">
                      <td colSpan={4} className="p-4 text-right font-bold text-slate-700">Total Pengajuan:</td>
                      <td className="p-4 text-right font-bold text-blue-700 text-lg">{formatCurrency(totalAmount)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="p-6 flex justify-between border-t border-slate-200 bg-white">
              <button onClick={() => setStep(1)} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
              </button>
              <button 
                onClick={() => setStep(3)} 
                className="btn-primary"
                disabled={items.length === 0}
              >
                Lanjutkan <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUBMIT */}
        {step === 3 && (
          <div className="p-8">
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
                <select 
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white transition-all"
                  required
                >
                  <option value="" disabled>Pilih Periode</option>
                  <option value="Januari 2024">Januari 2024</option>
                  <option value="Februari 2024">Februari 2024</option>
                  <option value="Maret 2024">Maret 2024</option>
                  <option value="April 2024">April 2024</option>
                  <option value="Mei 2024">Mei 2024</option>
                  <option value="Juni 2024">Juni 2024</option>
                  <option value="Juli 2024">Juli 2024</option>
                  <option value="Agustus 2024">Agustus 2024</option>
                  <option value="September 2024">September 2024</option>
                  <option value="Oktober 2024">Oktober 2024</option>
                  <option value="November 2024">November 2024</option>
                  <option value="Desember 2024">Desember 2024</option>
                </select>
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

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total yang diajukan</p>
                  <p className="text-xs text-blue-500">{items.length} item pengeluaran</p>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
              </button>
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
        )}

      </div>
    </div>
  )
}
