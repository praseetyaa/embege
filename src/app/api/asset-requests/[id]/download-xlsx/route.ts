/**
 * GET /api/asset-requests/[id]/download-xlsx
 *
 * Mengisi template GA01 - FORM PERMINTAAN PERBAIKAN FIXED ASSET - ATK.xls
 * dengan data dari database, lalu mengembalikannya sebagai file download.
 *
 * Struktur template GA01 (dari analisis file):
 * Row 1 : Header judul (merged)
 * Row 2 : Reg.Form GA01 (kanan)
 * Row 3 : Nama Pemohon | nilai
 * Row 4 : Tanggal      | nilai
 * Row 5 : Department/Divisi/AREA | nilai
 * Row 6 : Header tabel: No. | Item Barang | Spesifikasi | Qty Permintaan
 * Row 7+: Data item (setiap item 1 baris)
 * Row N : Tanda tangan: Manager Terkait | GA MANAGER | Karyawan Terkait | FINANCE MANAGER
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import path from "path"
import fs from "fs"
import { formatRupiah } from "@/lib/terbilang"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // ── Fetch data ───────────────────────────────────────────────────────────
    const { data: assetRequest, error } = await supabase
      .from("asset_requests")
      .select(`
        *,
        asset_request_items (*),
        profiles (full_name, department, signature_url)
      `)
      .eq("id", id)
      .single()

    if (error || !assetRequest) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    // ── Load template ────────────────────────────────────────────────────────
    // Cari di folder templates/ (server-side accessible)
    const templatePath = path.join(
      process.cwd(),
      "templates",
      "GA01 - FORM PERMINTAAN PERBAIKAN FIXED ASSET - ATK.xls"
    )

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: "Template GA01 tidak ditemukan." },
        { status: 500 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XlsxPopulate = require("xlsx-populate")
    const workbook = await XlsxPopulate.fromFileAsync(templatePath)
    const sheet = workbook.sheets()[0]

    const profile = assetRequest.profiles || {}
    const items: any[] = assetRequest.asset_request_items || []

    // ── Format tanggal ───────────────────────────────────────────────────────
    const d = new Date(assetRequest.request_date)
    const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`

    // ── Isi header form ──────────────────────────────────────────────────────
    // Berdasarkan struktur GA01:
    // Kolom A = label, kolom C/D = nilai (setelah merged cell label di A-B)
    sheet.cell("C3").value(profile.full_name || "").style("fontSize", 10)
    sheet.cell("C4").value(dateStr).style("fontSize", 10)
    sheet.cell("C5").value(
      `${assetRequest.department || ""} / ${assetRequest.area || ""}`
    ).style("fontSize", 10)

    // ── Isi item barang ──────────────────────────────────────────────────────
    // Baris data mulai row 7 (row 6 = header kolom)
    // Kolom: A=No, B=Item Barang, C=Spesifikasi, D=Qty & Harga
    const START_ROW = 7

    items.forEach((item: any, index: number) => {
      const row = START_ROW + index
      sheet.cell(`A${row}`).value(index + 1).style("fontSize", 10)
      sheet.cell(`B${row}`).value(item.item_name || "").style("fontSize", 10)
      sheet.cell(`C${row}`).value(item.specification || "").style("fontSize", 10)
      // Tampilkan harga dan qty di kolom D, sesuai referensi: "Rp 165.100 / 1 unit"
      const qtyDisplay = item.unit_price && item.unit_price > 0
        ? `Rp ${formatRupiah(item.unit_price)} / ${item.quantity} unit`
        : `${item.quantity} unit`
      sheet.cell(`D${row}`).value(qtyDisplay).style("fontSize", 10)
    })

    // ── Response ─────────────────────────────────────────────────────────────
    const buffer: Buffer = await workbook.outputAsync()

    const nameSlug = (profile.full_name || "request")
      .toUpperCase()
      .replace(/\s+/g, "_")
    const filename = `GA01_${nameSlug}_${assetRequest.request_date ?? dateStr}.xlsx`

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err: any) {
    console.error("download-xlsx GA01 error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
