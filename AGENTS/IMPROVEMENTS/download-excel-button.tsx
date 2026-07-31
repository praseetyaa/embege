"use client"

/**
 * Tombol download Excel berbasis template FORM_REMBESAN.xlsx
 * Simpan file ini di:
 *   src/components/ui/download-excel-button.tsx
 *
 * Menggantikan implementasi lama yang generate Excel dari nol.
 * Sekarang mengisi template asli (format identik dengan yang diterima Finance).
 */

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"

interface DownloadExcelButtonProps {
  reimbursement: { id: string; title?: string }
}

export function DownloadExcelButton({ reimbursement }: DownloadExcelButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/reimbursements/${reimbursement.id}/download-xlsx`
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Gagal download (HTTP ${res.status})`)
      }

      // Baca sebagai blob dan trigger download di browser
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      // Ambil filename dari Content-Disposition header jika ada
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] ?? `reimburse_${reimbursement.id}.xlsx`

      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {loading ? "Menyiapkan..." : "Download Excel"}
      </button>

      {error && (
        <p className="text-xs text-red-600">⚠ {error}</p>
      )}
    </div>
  )
}
