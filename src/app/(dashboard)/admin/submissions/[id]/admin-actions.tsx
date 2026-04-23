"use client"

import { useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AdminActions({ reimbursementId }: { reimbursementId: string }) {
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !notes.trim()) {
      toast.error("Catatan admin wajib diisi untuk penolakan!")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/admin/reimbursements/${reimbursementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_notes: notes })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Terjadi kesalahan")
      }

      toast.success(`Pengajuan berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}!`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Catatan Admin <span className="text-slate-400 font-normal">(wajib jika ditolak)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tambahkan pesan, alasan penolakan, atau instruksi pembayaran..."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
        />
      </div>
      
      <div className="flex gap-3">
        <button 
          onClick={() => handleAction('rejected')}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" /> Tolak
        </button>
        <button 
          onClick={() => handleAction('approved')}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" /> Setujui
        </button>
      </div>
    </div>
  )
}
