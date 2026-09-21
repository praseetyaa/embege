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
import JSZip from "jszip"

const TRANSPARENT_1X1_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAA=",
  "base64"
)

function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (!buffer || buffer.length < 10) return null
  // PNG
  if (
    buffer.length > 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    return { width, height }
  }
  // JPEG
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++
        continue
      }
      const marker = buffer[offset + 1]
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const height = buffer.readUInt16BE(offset + 5)
        const width = buffer.readUInt16BE(offset + 7)
        return { width, height }
      }
      const len = buffer.readUInt16BE(offset + 2)
      offset += 2 + len
    }
  }
  // WEBP
  if (
    buffer.length > 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const chunkType = buffer.toString("ascii", 12, 16)
    if (chunkType === "VP8 ") {
      const width = buffer.readUInt16LE(26) & 0x3fff
      const height = buffer.readUInt16LE(28) & 0x3fff
      return { width, height }
    } else if (chunkType === "VP8L") {
      const b1 = buffer[21],
        b2 = buffer[22],
        b3 = buffer[23],
        b4 = buffer[24]
      const width = 1 + (((b2 & 0x3f) << 8) | b1)
      const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6))
      return { width, height }
    } else if (chunkType === "VP8X") {
      const width = 1 + buffer.readUIntLE(24, 3)
      const height = 1 + buffer.readUIntLE(27, 3)
      return { width, height }
    }
  }
  return null
}

async function getImageBuffer(urlOrData: string): Promise<Buffer | null> {
  if (!urlOrData) return null
  if (urlOrData.startsWith("data:")) {
    const base64Data = urlOrData.split(",")[1]
    return base64Data ? Buffer.from(base64Data, "base64") : null
  }
  try {
    const res = await fetch(urlOrData)
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    console.error("Failed to fetch image buffer:", err)
    return null
  }
}

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

    // ── Load template ────────────────────────────────────────────────────────
    const templatePath = path.join(
      process.cwd(),
      "templates",
      "GA01 - FORM PERMINTAAN PERBAIKAN FIXED ASSET - ATK.xlsx"
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

    // ── Generate buffer awal dari XlsxPopulate ─────────────────────────────────
    const baseBuffer: Buffer = await workbook.outputAsync()

    // ── Inject Gambar & Tanda Tangan ke dalam OpenXML ─────────────────────────
    // Di template:
    // - xl/media/image1.jpeg = Logo VIVO (tetap dipertahankan)
    // - xl/media/image2.png  = Tanda Tangan Karyawan Terkait (Row 32-35 Col D)
    // - xl/media/image3.png  = Gambar Item Barang (Row 13-28 Col B-D)
    const zip = await JSZip.loadAsync(baseBuffer)

    // 1. Gambar Item Barang:
    const itemWithImage = items.find((i: any) => i.image_url)
    if (itemWithImage?.image_url) {
      const itemImageBuffer = await getImageBuffer(itemWithImage.image_url)
      if (itemImageBuffer) {
        zip.file("xl/media/image3.png", itemImageBuffer)

        // Sesuaikan aspect ratio agar proporsional & tidak gepeng / terdistorsi
        const dims = getImageDimensions(itemImageBuffer)
        if (dims && dims.width > 0 && dims.height > 0) {
          const MAX_CX = 5705475
          const MAX_CY = 5734050
          const BASE_COL_OFF = 1057275
          const BASE_ROW_OFF = 247650
          const BASE_X = 1381125
          const BASE_Y = 3219450

          const imgRatio = dims.width / dims.height
          const boxRatio = MAX_CX / MAX_CY

          let target_cx = MAX_CX
          let target_cy = MAX_CY
          let deltaX = 0
          let deltaY = 0

          if (imgRatio > boxRatio) {
            // Gambar landscape: paskan lebar, hitung tinggi proporsional, posisikan tengah vertikal
            target_cx = MAX_CX
            target_cy = Math.round(MAX_CX / imgRatio)
            deltaY = Math.round((MAX_CY - target_cy) / 2)
          } else {
            // Gambar portrait (screenshot hp): paskan tinggi, hitung lebar proporsional, posisikan tengah horizontal
            target_cy = MAX_CY
            target_cx = Math.round(MAX_CY * imgRatio)
            deltaX = Math.round((MAX_CX - target_cx) / 2)
          }

          const finalColOff = BASE_COL_OFF + deltaX
          const finalRowOff = BASE_ROW_OFF + deltaY
          const finalX = BASE_X + deltaX
          const finalY = BASE_Y + deltaY

          let drawingXml = await zip.file("xl/drawings/drawing1.xml")?.async("text")
          if (drawingXml) {
            const singleAnchorRegex =
              /<xdr:(?:twoCellAnchor|oneCellAnchor)[\s\S]*?<\/xdr:(?:twoCellAnchor|oneCellAnchor)>/g
            const allAnchors = drawingXml.match(singleAnchorRegex) || []
            const itemAnchor = allAnchors.find((a) => a.includes("rId3"))

            if (itemAnchor) {
              const picMatch = itemAnchor.match(/<xdr:pic>[\s\S]*?<\/xdr:pic>/)
              if (picMatch) {
                let picXml = picMatch[0]
                picXml = picXml.replace(
                  /<a:xfrm>[\s\S]*?<\/a:xfrm>/,
                  `<a:xfrm><a:off x="${finalX}" y="${finalY}"/><a:ext cx="${target_cx}" cy="${target_cy}"/></a:xfrm>`
                )
                const newAnchor = `<xdr:oneCellAnchor editAs="oneCell"><xdr:from><xdr:col>1</xdr:col><xdr:colOff>${finalColOff}</xdr:colOff><xdr:row>12</xdr:row><xdr:rowOff>${finalRowOff}</xdr:rowOff></xdr:from><xdr:ext cx="${target_cx}" cy="${target_cy}"/>${picXml}<xdr:clientData/></xdr:oneCellAnchor>`
                drawingXml = drawingXml.replace(itemAnchor, newAnchor)
                zip.file("xl/drawings/drawing1.xml", drawingXml)
              }
            }
          }
        }
      } else {
        zip.file("xl/media/image3.png", TRANSPARENT_1X1_PNG)
      }
    } else {
      // Jika tidak ada gambar yang diupload, ganti dengan 1x1 transparan agar dummy template tidak muncul
      zip.file("xl/media/image3.png", TRANSPARENT_1X1_PNG)
    }

    // 2. Tanda Tangan Pemohon:
    if (profile.signature_url) {
      const sigBuffer = await getImageBuffer(profile.signature_url)
      if (sigBuffer) {
        zip.file("xl/media/image2.png", sigBuffer)
      } else {
        zip.file("xl/media/image2.png", TRANSPARENT_1X1_PNG)
      }
    } else {
      zip.file("xl/media/image2.png", TRANSPARENT_1X1_PNG)
    }

    const finalBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // ── Response ─────────────────────────────────────────────────────────────
    const nameSlug = (profile.full_name || "request")
      .toUpperCase()
      .replace(/\s+/g, "_")
    const filename = `GA01_${nameSlug}_${assetRequest.request_date ?? dateStr}.xlsx`

    return new NextResponse(finalBuffer as any, {
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
