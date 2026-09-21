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
    <div className="relative inline-flex flex-col shrink-0">
      <button
        onClick={handleDownload}
        disabled={loading}
        className={className || "btn-success shrink-0 whitespace-nowrap"}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          <Download className="w-4 h-4 shrink-0" />
        )}
        <span className="whitespace-nowrap">{loading ? "Menyiapkan..." : "Download Excel"}</span>
      </button>

      {error && (
        <p className="absolute top-full right-0 mt-1 text-xs text-red-600 whitespace-nowrap bg-white px-2 py-0.5 rounded shadow border border-red-200 z-10">⚠ {error}</p>
      )}
    </div>
  )
}
