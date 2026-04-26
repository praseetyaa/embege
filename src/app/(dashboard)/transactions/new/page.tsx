"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { 
  Upload, 
  Trash2,
  Save, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Loader2,
  Plus,
  Image as ImageIcon,
  X
} from "lucide-react"
import { toast } from "sonner"
import { EXPENSE_CATEGORIES } from "@/lib/constants"
import imageCompression from "browser-image-compression"

export default function NewTransactionPage() {
  const [step, setStep] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingEvidence, setIsDraggingEvidence] = useState(false)
  
  const [items, setItems] = useState<any[]>([])
  
  interface EvidenceFile {
    id: string;
    file: File;
    previewUrl: string;
    progress: number;
    uploadedUrl?: string;
    error?: string;
  }
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const evidenceInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    
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
          
          if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item: any, idx: number) => {
              newItems.push({
                id: Date.now().toString() + "_" + i + "_" + idx,
                date: item.date || new Date().toISOString().split('T')[0],
                description: item.description || "",
                category: item.category || "Lain-lain",
                vendor: item.vendor || "",
                amount: item.amount || 0,
                receipt_url: data.receipt_url || "",
              })
            })
          }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [items])

  const processEvidenceFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return

    const newEvidences: EvidenceFile[] = []
    
    // Setup initial state for new files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} bukan gambar`)
        continue
      }
      
      const id = Date.now().toString() + "_" + i
      const previewUrl = URL.createObjectURL(file)
      
      newEvidences.push({
        id,
        file,
        previewUrl,
        progress: 0
      })
    }
    
    if (newEvidences.length === 0) return
    
    setEvidenceFiles(prev => [...prev, ...newEvidences])
    
    // Process and upload each file
    for (const evidence of newEvidences) {
      try {
        setEvidenceFiles(prev => prev.map(f => f.id === evidence.id ? { ...f, progress: 10 } : f))
        
        // 1. Compress Image
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (p: number) => {
            // scale 10 to 40 for compression progress
            const progress = 10 + Math.floor(p * 0.3)
            setEvidenceFiles(prev => prev.map(f => f.id === evidence.id ? { ...f, progress } : f))
          }
        }
        
        const compressedFile = await imageCompression(evidence.file, options)
        
        // 2. Upload to Supabase Storage
        setEvidenceFiles(prev => prev.map(f => f.id === evidence.id ? { ...f, progress: 40 } : f))
        
        // We will store in 'receipts' bucket since it's the most appropriate existing one, or just assume it exists
        // Wait, what bucket was the receipt uploaded to? Let's check api/ocr or just use 'receipts'
        const fileExt = compressedFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `evidences/${fileName}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts') // Ensure this bucket exists or use default
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false
          })
          
        if (uploadError) throw uploadError
        
        setEvidenceFiles(prev => prev.map(f => f.id === evidence.id ? { ...f, progress: 90 } : f))
        
        // 3. Get Public URL
        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath)
          
        setEvidenceFiles(prev => prev.map(f => f.id === evidence.id ? { 
          ...f, 
          progress: 100,
          uploadedUrl: urlData.publicUrl 
        } : f))
        
      } catch (error: any) {
        console.error("Error uploading evidence:", error)
        setEvidenceFiles(prev => prev.map(f => f.id === evidence.id ? { 
          ...f, 
          error: error.message || "Gagal upload" 
        } : f))
      }
    }
  }

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processEvidenceFiles(e.target.files)
    }
  }

  const onDragOverEvidence = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingEvidence(true)
  }, [])

  const onDragLeaveEvidence = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingEvidence(false)
  }, [])

  const onDropEvidence = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingEvidence(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processEvidenceFiles(e.dataTransfer.files)
    }
  }, [])

  const removeEvidence = (id: string) => {
    setEvidenceFiles(prev => prev.filter(f => f.id !== id))
  }

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

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.warning("Mohon masukkan minimal 1 item nota")
      return
    }

    setIsSubmitting(true)
    
    const uploadedEvidenceUrls = evidenceFiles
      .filter(f => f.uploadedUrl)
      .map(f => f.uploadedUrl);

    const itemsWithEvidence = items.map(item => ({
      ...item,
      evidence_urls: uploadedEvidenceUrls
    }))
    
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: itemsWithEvidence
        })
      })

      if (response.ok) {
        toast.success("Nota berhasil disimpan!")
        router.push("/transactions")
        router.refresh()
      } else {
        const data = await response.json()
        toast.error("Error: " + data.error)
      }
    } catch (error) {
      console.error(error)
      toast.error("Gagal menyimpan nota")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Input Nota</h1>
        <p className="text-slate-500">Upload struk, cek detailnya, lalu simpan ke Riwayat Transaksi Anda.</p>
      </div>

      <div className="flex items-center justify-center relative mb-12 max-w-sm mx-auto">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 rounded-full transition-all duration-500"
          style={{ width: `${((step - 1) / 1) * 100}%` }}
        ></div>
        
        <div className="w-full flex justify-between z-10">
          {[1, 2].map((s) => (
            <div 
              key={s} 
              className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-colors ${
                step >= s ? 'bg-blue-600 border-white text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Upload Struk/Nota</h2>
            
            <div 
              className={`upload-zone mx-auto max-w-2xl mb-8 p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-lg font-medium text-slate-700">Sedang memindai dengan AI...</p>
                  <p className="text-sm text-slate-500 mt-2">Membaca detail struk otomatis</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDragging ? 'bg-blue-100' : 'bg-blue-50'}`}>
                    <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-blue-500'}`} />
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
              <h2 className="text-lg font-bold text-slate-800">Review Item Nota</h2>
              <button 
                onClick={addNewItem}
                className="btn-secondary text-sm py-2"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Manual
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                Belum ada nota.
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
                            type="text" 
                            value={item.amount ? Number(item.amount).toLocaleString('id-ID') : ''} 
                            onChange={(e) => updateItem(item.id, 'amount', Number(e.target.value.replace(/\D/g, '')))}
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
                      <td colSpan={4} className="p-4 text-right font-bold text-slate-700">Total Nota:</td>
                      <td className="p-4 text-right font-bold text-blue-700 text-lg">{formatCurrency(totalAmount)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* EVIDENCE UPLOAD SECTION */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Bukti Fisik / Barang (Opsional)</h3>
              
              <div 
                className={`upload-zone p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-center ${
                  isDraggingEvidence ? 'border-blue-500 bg-blue-100' : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
                onClick={() => evidenceInputRef.current?.click()}
                onDragOver={onDragOverEvidence}
                onDragLeave={onDragLeaveEvidence}
                onDrop={onDropEvidence}
              >
                <ImageIcon className={`w-8 h-8 mx-auto mb-2 ${isDraggingEvidence ? 'text-blue-600' : 'text-slate-400'}`} />
                <p className="text-sm font-medium text-slate-600 mb-1">Upload foto barang yang dibeli</p>
                <p className="text-xs text-slate-500">Bisa lebih dari 1 gambar (JPG/PNG)</p>
              </div>

              <input 
                type="file" 
                ref={evidenceInputRef} 
                className="hidden" 
                multiple 
                accept="image/*" 
                onChange={handleEvidenceUpload}
              />

              {evidenceFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {evidenceFiles.map(file => (
                    <div key={file.id} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <img src={file.previewUrl} alt="preview" className="w-full h-24 object-cover" />
                      
                      {/* Delete Button */}
                      <button 
                        onClick={() => removeEvidence(file.id)}
                        className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-red-500 hover:text-white text-slate-600 rounded-full transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Progress or Error Overlay */}
                      {file.error ? (
                        <div className="absolute inset-x-0 bottom-0 bg-red-500/90 text-white text-[10px] p-1 text-center truncate">
                          {file.error}
                        </div>
                      ) : file.progress < 100 ? (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                          <div className="text-white text-xs font-bold mb-1">{file.progress}%</div>
                          <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 flex justify-between border-t border-slate-200 bg-white">
              <button onClick={() => setStep(1)} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
              </button>
              <button 
                onClick={handleSubmit} 
                className="btn-primary flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={items.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Simpan Nota</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
