"use client"

import { User, Building, CreditCard, Mail } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

import { profileSchema } from "@/lib/validations"

export function ProfileForm({ profile }: { profile: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    const data = {
      department: formData.get("department") as string,
      bank_name: formData.get("bank_name") as string,
      bank_account: formData.get("bank_account") as string,
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

      <div className="pt-4 flex justify-end">
        <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50">
          {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  )
}
