"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"

interface DownloadAtkExcelButtonProps {
  assetRequestId: string
  className?: string
}

export function DownloadAtkExcelButton({ assetRequestId, className }: DownloadAtkExcelButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/asset-requests/${assetRequestId}/download-xlsx`)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Gagal download (HTTP ${res.status})`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] ?? `GA01_${assetRequestId}.xlsx`

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
        className={
          className ||
          "flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
        }
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
