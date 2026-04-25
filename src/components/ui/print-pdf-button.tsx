"use client"

import { Printer } from "lucide-react"

export function PrintPdfButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className="btn-primary flex items-center justify-center gap-2 w-full print:hidden"
    >
      <Printer className="w-4 h-4" />
      Cetak&nbsp;PDF
    </button>
  )
}
