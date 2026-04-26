"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AssetRequest, Profile, AssetRequestItem } from "@/lib/types"
import { ArrowLeft, Printer, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AssetRequestPrint } from "@/components/print/AssetRequestPrint"
import Link from "next/link"

export default function AssetRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [request, setRequest] = useState<AssetRequest & { profiles?: Profile, asset_request_items?: AssetRequestItem[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchRequest()
  }, [resolvedParams.id])

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from("asset_requests")
        .select(`
          *,
          profiles:user_id (*),
          asset_request_items (*)
        `)
        .eq("id", resolvedParams.id)
        .single()

      if (error) throw error
      setRequest(data as any)
    } catch (error) {
      console.error("Error fetching request:", error)
      toast.error("Gagal memuat data permintaan")
      router.push("/asset-requests")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Permintaan tidak ditemukan</p>
        <Link href="/asset-requests" className="text-blue-600 hover:underline mt-4 inline-block">
          Kembali ke Daftar
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top action bar - Hidden on print */}
      <div className="flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <Link href="/asset-requests" className="btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Link>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()}
            className="btn-primary flex items-center bg-blue-600 hover:bg-blue-700"
          >
            <Printer className="w-4 h-4 mr-2" /> Print PDF
          </button>
        </div>
      </div>

      {/* The Printable Form */}
      <div className="bg-white shadow-sm border border-slate-200 print:shadow-none print:border-none print:m-0 overflow-auto">
        <div className="min-w-[800px] print:min-w-full">
          <AssetRequestPrint request={request} />
        </div>
      </div>
      
      {/* Print Instructions */}
      <div className="print:hidden text-center text-sm text-slate-500 mt-4">
        <p>Tips: Saat nge-print (Ctrl+P), pastikan opsi <strong>Background graphics</strong> dicentang dan margin diset ke <strong>None</strong> atau <strong>Minimum</strong>.</p>
        <p>Format yang disarankan: <strong>A4 Portrait</strong>.</p>
      </div>
    </div>
  )
}
