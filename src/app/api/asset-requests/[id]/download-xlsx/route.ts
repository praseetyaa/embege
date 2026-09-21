/**
 * GET /api/asset-requests/[id]/download-xlsx
 *
 * Mengisi template GA01 dan mengembalikannya sebagai file .xlsx.
 * Template GA01 di repository berekstensi .xls (format BIFF lama), sehingga
 * tidak boleh dibaca dengan xlsx-populate yang hanya mendukung OOXML .xlsx.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import path from "path"
import fs from "fs"
import XLSX from "xlsx"
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

    // The repository template is legacy .xls. SheetJS supports both BIFF .xls
    // input and OOXML .xlsx output, unlike xlsx-populate.
    const workbook = XLSX.read(fs.readFileSync(templatePath), {
      type: "buffer",
      cellStyles: true,
    })
    const sheetName = workbook.SheetNames[0]
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined

    if (!sheet) {
      throw new Error("Worksheet pada template GA01 tidak ditemukan.")
    }

    const profile = assetRequest.profiles || {}
    const items: any[] = assetRequest.asset_request_items || []
    const d = new Date(assetRequest.request_date)
    const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`

    const setCell = (address: string, value: string | number) => {
      sheet[address] = { t: typeof value === "number" ? "n" : "s", v: value }
    }

    // GA01 layout: C3-C5 are the form values and rows 7+ contain the items.
    setCell("C3", profile.full_name || "")
    setCell("C4", dateStr)
    setCell("C5", `${assetRequest.department || ""} / ${assetRequest.area || ""}`)

    const START_ROW = 7
    items.forEach((item: any, index: number) => {
      const row = START_ROW + index
      setCell(`A${row}`, index + 1)
      setCell(`B${row}`, item.item_name || "")
      setCell(`C${row}`, item.specification || "")

      const quantity = item.quantity ?? 0
      const qtyDisplay = Number(item.unit_price) > 0
        ? `Rp ${formatRupiah(Number(item.unit_price))} / ${quantity} unit`
        : `${quantity} unit`
      setCell(`D${row}`, qtyDisplay)
    })

    // Keep the original template range and output a valid OOXML workbook.
    const output = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
      cellStyles: true,
    })

    const nameSlug = (profile.full_name || "request")
      .toUpperCase()
      .replace(/\s+/g, "_")
    const filename = `GA01_${nameSlug}_${assetRequest.request_date ?? dateStr}.xlsx`

    return new NextResponse(output as Buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
