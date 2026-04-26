"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  Save, 
  CheckCircle,
  Loader2,
  Plus,
  Image as ImageIcon,
  X,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import imageCompression from "browser-image-compression"
import { Profile } from "@/lib/types"

interface AssetRequestItemForm {
  id: string;
  item_name: string;
  specification: string;
  quantity: number;
  imageFile?: File | null;
  imagePreviewUrl?: string;
  imageUploadProgress?: number;
  imageUrl?: string;
  imageError?: string;
}

export default function NewAssetRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0])
  const [department, setDepartment] = useState("")
  const [area, setArea] = useState("")
  
  const [items, setItems] = useState<AssetRequestItemForm[]>([{
    id: Date.now().toString(),
    item_name: "",
    specification: "",
    quantity: 1,
  }])
  
  const router = useRouter()
  const supabase = createClient()
  
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
          
        if (data) {
          setProfile(data)
          setDepartment(data.department || "")
          // Assuming area might be stored somewhere or we just leave it blank if not in profile
          setArea(data.department || "") 
        }
      }
    }
    loadProfile()
  }, [])

  const handleImageChange = async (itemId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(`File ${file.name} bukan gambar`)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          imageFile: file,
          imagePreviewUrl: previewUrl,
          imageUploadProgress: 0,
          imageError: undefined
        }
      }
      return item
    }))
  }

  const updateItem = (id: string, field: keyof AssetRequestItemForm, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.warning("Minimal harus ada 1 item")
      return
    }
    setItems(items.filter(item => item.id !== id))
  }

  const addNewItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        item_name: "",
        specification: "",
        quantity: 1,
      }
    ])
  }

  const handleSubmit = async () => {
    if (!profile) return
    
    // Validation
    const invalidItem = items.find(i => !i.item_name || !i.quantity)
    if (invalidItem) {
      toast.error("Mohon lengkapi nama barang dan jumlah untuk semua item")
      return
    }

    setIsSubmitting(true)
    
    try {
      // 1. Create main request record
      const { data: requestData, error: requestError } = await supabase
        .from('asset_requests')
        .insert({
          user_id: profile.id,
          request_date: requestDate,
          department: department,
          area: area,
        })
        .select()
        .single()
        
      if (requestError) throw requestError
      
      const requestId = requestData.id

      // 2. Upload images and prepare items
      const finalItems = []
      
      for (const item of items) {
        let uploadedImageUrl = null
        
        if (item.imageFile) {
          try {
            // Compress Image
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              onProgress: (p: number) => {
                const progress = Math.floor(p * 0.4) // 0-40%
                updateItem(item.id, 'imageUploadProgress', progress)
              }
            }
            
            const compressedFile = await imageCompression(item.imageFile, options)
            updateItem(item.id, 'imageUploadProgress', 40)
            
            // Upload to Supabase Storage
            const fileExt = compressedFile.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `atk/${fileName}`
            
            const { error: uploadError } = await supabase.storage
              .from('receipts') // using existing bucket
              .upload(filePath, compressedFile, {
                cacheControl: '3600',
                upsert: false
              })
              
            if (uploadError) throw uploadError
            updateItem(item.id, 'imageUploadProgress', 90)
            
            // Get Public URL
            const { data: urlData } = supabase.storage
              .from('receipts')
              .getPublicUrl(filePath)
              
            uploadedImageUrl = urlData.publicUrl
            updateItem(item.id, 'imageUploadProgress', 100)
            
          } catch (error: any) {
            console.error("Error uploading image:", error)
            toast.error(`Gagal upload gambar untuk item: ${item.item_name}`)
          }
        }
        
        finalItems.push({
          request_id: requestId,
          item_name: item.item_name,
          specification: item.specification,
          quantity: item.quantity,
          image_url: uploadedImageUrl
        })
      }

      // 3. Save items to database
      const { error: itemsError } = await supabase
        .from('asset_request_items')
        .insert(finalItems)
        
      if (itemsError) throw itemsError

      toast.success("Permintaan berhasil disimpan!")
      router.push("/asset-requests")
      router.refresh()
      
    } catch (error: any) {
      console.error(error)
      toast.error("Gagal menyimpan permintaan: " + (error.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Drag and drop helper component
  const ImageUploader = ({ item }: { item: AssetRequestItemForm }) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

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
        handleImageChange(item.id, e.dataTransfer.files[0])
      }
    }, [item.id])

    return (
      <div className="mt-2">
        {!item.imagePreviewUrl ? (
          <div 
            className={`w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <ImageIcon className={`w-6 h-6 mx-auto mb-2 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} />
            <p className="text-xs font-medium text-slate-600">Klik / Drag & Drop Foto Barang</p>
          </div>
        ) : (
          <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50 h-32 flex items-center justify-center">
            <img src={item.imagePreviewUrl} alt="preview" className="max-w-full max-h-full object-contain" />
            
            {/* Delete Button */}
            {!isSubmitting && (
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  updateItem(item.id, 'imagePreviewUrl', undefined)
                  updateItem(item.id, 'imageFile', undefined)
                }}
                className="absolute top-1 right-1 p-1 bg-white hover:bg-red-500 hover:text-white text-slate-600 rounded-full transition-colors z-10 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Progress Overlay */}
            {isSubmitting && item.imageUploadProgress !== undefined && item.imageUploadProgress < 100 && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <div className="text-white text-xs font-bold mb-1">{item.imageUploadProgress}%</div>
                <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${item.imageUploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleImageChange(item.id, e.target.files[0])
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Form Permintaan ATK & Asset</h1>
        <p className="text-slate-500">Buat permintaan baru untuk perbaikan asset atau permintaan ATK.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Detail Form</h2>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tanggal Pengajuan</label>
            <input 
              type="date" 
              value={requestDate} 
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Department</label>
            <input 
              type="text" 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Contoh: IT"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Area</label>
            <input 
              type="text" 
              value={area} 
              onChange={(e) => setArea(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Contoh: Purwokerto"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Daftar Barang</h2>
          <button 
            onClick={addNewItem}
            className="btn-secondary text-sm py-2"
          >
            <Plus className="w-4 h-4 mr-1" /> Tambah Barang
          </button>
        </div>

        <div className="p-6 space-y-6">
          {items.map((item, index) => (
            <div key={item.id} className="p-4 border border-slate-200 rounded-xl relative">
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                  title="Hapus Item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="font-medium text-slate-800 mb-4">Barang #{index + 1}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 space-y-2">
                  <label className="text-xs font-medium text-slate-600">Nama Barang *</label>
                  <input 
                    type="text" 
                    value={item.item_name} 
                    onChange={(e) => updateItem(item.id, 'item_name', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: RAM Komputer 4GB"
                  />
                </div>
                
                <div className="md:col-span-5 space-y-2">
                  <label className="text-xs font-medium text-slate-600">Spesifikasi</label>
                  <input 
                    type="text" 
                    value={item.specification} 
                    onChange={(e) => updateItem(item.id, 'specification', e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: Ukuran 4GB, Tipe DDR 3L"
                  />
                </div>
                
                <div className="md:col-span-3 space-y-2">
                  <label className="text-xs font-medium text-slate-600">Qty Permintaan *</label>
                  <input 
                    type="number" 
                    min="1"
                    value={item.quantity} 
                    onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                
                <div className="md:col-span-12 mt-2">
                  <label className="text-xs font-medium text-slate-600">Foto Barang (Opsional tapi disarankan)</label>
                  <ImageUploader item={item} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 flex justify-end border-t border-slate-200 bg-slate-50">
          <button 
            onClick={handleSubmit} 
            className="btn-primary flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Simpan & Selesai</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
