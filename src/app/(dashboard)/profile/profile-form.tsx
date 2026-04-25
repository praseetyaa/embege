"use client"

import { User, Building, CreditCard, Mail, Upload, X, PenTool } from "lucide-react"
import { toast } from "sonner"
import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

import { profileSchema } from "@/lib/validations"

export function ProfileForm({ profile }: { profile: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(profile?.signature_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    let signature_url = profile?.signature_url || null;

    if (signatureFile) {
      try {
        const fileExt = signatureFile.name.split('.').pop()
        const filePath = `${profile.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('signatures').upload(filePath, signatureFile)
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage.from('signatures').getPublicUrl(filePath)
        signature_url = publicUrl
      } catch (err) {
        toast.error("Gagal mengunggah tanda tangan")
        setIsSubmitting(false)
        return
      }
    }

    const data = {
      department: formData.get("department") as string,
      bank_name: formData.get("bank_name") as string,
      bank_account: formData.get("bank_account") as string,
      signature_url,
    }

    // 1. Validate with Zod
    const result = profileSchema.safeParse(data)
    if (!result.success) {
      toast.error(result.error.errors[0].message)
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", profile.id)

      if (error) throw error
      toast.success("Profil berhasil diperbarui!")
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui profil")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Informasi Personal</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" /> Nama Lengkap
          </label>
          <input 
            type="text" 
            defaultValue={profile?.full_name} 
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            readOnly
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" /> Email
          </label>
          <input 
            type="email" 
            defaultValue={profile?.email} 
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
            readOnly
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-400" /> Departemen
          </label>
          <input 
            name="department"
            type="text" 
            defaultValue={profile?.department || ""} 
            placeholder="Contoh: IT, HR, Finance"
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 pt-4">Informasi Rekening</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-400" /> Nama Bank
          </label>
          <input 
            name="bank_name"
            type="text" 
            defaultValue={profile?.bank_name || ""} 
            placeholder="Contoh: BCA, Mandiri"
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" /> Nomor Rekening
          </label>
          <input 
            name="bank_account"
            type="text" 
            defaultValue={profile?.bank_account || ""} 
            placeholder="Contoh: 1234567890"
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 pt-4">Tanda Tangan</h3>
      <div className="space-y-4">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <PenTool className="w-4 h-4 text-slate-400" /> Tanda Tangan (Untuk Form Reimbursement)
        </label>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-48 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden group">
            {signaturePreview ? (
              <>
                <img src={signaturePreview} alt="Signature Preview" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button" 
                    onClick={() => {
                      setSignaturePreview(null)
                      setSignatureFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <PenTool className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <span className="text-xs text-slate-400">Belum ada tanda tangan</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setSignatureFile(file)
                  setSignaturePreview(URL.createObjectURL(file))
                }
              }} 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <Upload className="w-4 h-4" /> Unggah Tanda Tangan
            </button>
            <p className="text-xs text-slate-500">
              Unggah file gambar (PNG, JPG) berisi tanda tangan Anda dengan background transparan atau putih. Maksimal 2MB.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50">
          {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  )
}
