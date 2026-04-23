"use client"

import { Download } from "lucide-react"
import { generateReimbursementExcel } from "@/lib/excel/generator"

import { toast } from "sonner"

interface Props {
  reimbursement: any
  className?: string
}

export function DownloadExcelButton({ reimbursement, className }: Props) {
  const handleDownload = () => {
    try {
      generateReimbursementExcel(reimbursement)
      toast.success("Berhasil mengunduh Excel")
    } catch (error) {
      console.error("Failed to generate excel:", error)
      toast.error("Gagal mengunduh file Excel")
    }
  }

  return (
    <button 
      onClick={handleDownload}
      className={className || "btn-primary flex items-center justify-center gap-2 w-full"}
    >
      <Download className="w-4 h-4" /> Download Excel
    </button>
  )
}
