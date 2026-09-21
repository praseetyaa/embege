"use client"

import { Printer } from "lucide-react"

export function PrintPdfButton({ className }: { className?: string }) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className={
        className ||
        "btn-primary shrink-0 whitespace-nowrap"
      }
    >
      <Printer className="w-4 h-4 shrink-0" />
      <span>Cetak PDF</span>
    </button>
  )
}
