"use client"

import { Printer } from "lucide-react"

export function PrintPdfButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button 
      onClick={handlePrint}
      className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors print:hidden"
    >
      <Printer className="w-4 h-4" />
      Cetak PDF
    </button>
  )
}
