/**
 * GET /api/asset-requests/[id]/download-xlsx
 *
 * Mengisi template GA01 secara presisi:
 * - Membuka template XLSX sebagai ZIP langsung (surgical XML edit)
 * - Menjaga 100% style bawaan: border, font, warna header hitam, logo VIVO
 * - Untuk setiap item:
 *   1. Baris detail barang (No, Nama Barang, Spesifikasi merge C:D, Qty/Harga baris baru)
 *   2. Box gambar item (14 baris, merge B:D) dengan foto yang diupload
 * - Di bagian paling bawah: blok tanda tangan lengkap dengan tanda tangan pemohon
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import path from "path"
import fs from "fs"
import { formatRupiah } from "@/lib/terbilang"
import JSZip from "jszip"

const TRANSPARENT_1X1_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAA=",
  "base64"
)

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (!buffer || buffer.length < 10) return null
  if (buffer.length > 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) { offset++; continue }
      const marker = buffer[offset + 1]
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) }
      }
      const len = buffer.readUInt16BE(offset + 2)
      offset += 2 + len
    }
  }
  if (buffer.length > 30 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    const chunkType = buffer.toString("ascii", 12, 16)
    if (chunkType === "VP8 ") return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff }
    if (chunkType === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) }
  }
  return null
}

async function getImageBuffer(urlOrData: string): Promise<Buffer | null> {
  if (!urlOrData) return null
  if (urlOrData.startsWith("data:")) {
    const b64 = urlOrData.split(",")[1]
    return b64 ? Buffer.from(b64, "base64") : null
  }
  try {
    const res = await fetch(urlOrData)
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
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
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { data: assetRequest, error } = await supabase
      .from("asset_requests")
      .select(`*, asset_request_items (*), profiles (full_name, department, signature_url)`)
      .eq("id", id)
      .single()

    if (error || !assetRequest) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    const templatePath = path.join(process.cwd(), "templates", "GA01 - FORM PERMINTAAN PERBAIKAN FIXED ASSET - ATK.xlsx")
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: "Template GA01 tidak ditemukan." }, { status: 500 })
    }

    const zip = await JSZip.loadAsync(fs.readFileSync(templatePath))

    const profile: any = assetRequest.profiles || {}
    const items: any[] = assetRequest.asset_request_items || []
    const d = new Date(assetRequest.request_date)
    const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`

    const makeQty = (item: any) => {
      const qty = item.quantity ?? 0
      return Number(item.unit_price) > 0
        ? `Rp ${formatRupiah(Number(item.unit_price))}\n${qty} unit`
        : `${qty} unit`
    }

    // 1. Shared Strings (C7, C8, C9)
    let ssXml = await zip.file("xl/sharedStrings.xml")!.async("text")

    const replaceSi = (xml: string, idx: number, newVal: string): string => {
      let count = 0
      return xml.replace(/<si>[\s\S]*?<\/si>/g, (match) => {
        const r = count === idx ? `<si><t xml:space="preserve">${escapeXml(newVal)}</t></si>` : match
        count++
        return r
      })
    }

    const SS_C7 = 14, SS_C8 = 19, SS_C9 = 15
    ssXml = replaceSi(ssXml, SS_C7, `: ${profile.full_name || "-"}`)
    ssXml = replaceSi(ssXml, SS_C8, `: ${dateStr}`)
    ssXml = replaceSi(ssXml, SS_C9, `: ${assetRequest.department || "-"} / ${assetRequest.area || "-"}`)

    let nextSsIdx = (ssXml.match(/<si>/g) || []).length

    const itemSsIndices: Array<{ bIdx: number; cIdx: number; eIdx: number }> = []
    const newSiEntries: string[] = []

    for (let i = 0; i < items.length; i++) {
      const bIdx = nextSsIdx++
      const cIdx = nextSsIdx++
      const eIdx = nextSsIdx++
      itemSsIndices.push({ bIdx, cIdx, eIdx })
      newSiEntries.push(
        `<si><t xml:space="preserve">${escapeXml(items[i].item_name || "")}</t></si>`,
        `<si><t xml:space="preserve">${escapeXml(items[i].specification || "")}</t></si>`,
        `<si><t xml:space="preserve">${escapeXml(makeQty(items[i]))}</t></si>`
      )
    }

    if (newSiEntries.length > 0) {
      ssXml = ssXml.replace("</sst>", newSiEntries.join("") + "</sst>")
      ssXml = ssXml.replace(/(<sst[^>]* count=")[^"]*(")/, `$1${nextSsIdx}$2`)
      ssXml = ssXml.replace(/(<sst[^>]* uniqueCount=")[^"]*(")/, `$1${nextSsIdx}$2`)
    }
    zip.file("xl/sharedStrings.xml", ssXml)

    // 2. Fetch all images
    const itemImages: Array<{ buf: Buffer | null; dims: { width: number; height: number } | null }> = []
    for (let i = 0; i < items.length; i++) {
      let buf: Buffer | null = null
      let dims: { width: number; height: number } | null = null
      if (items[i].image_url) {
        buf = await getImageBuffer(items[i].image_url)
        if (buf) dims = getImageDimensions(buf)
      }
      itemImages.push({ buf, dims })
    }

    // 3. Build Sheet Rows & Merges
    let currentRow = 12
    const rowsXml: string[] = []
    const dynamicMerges: string[] = []
    const imageAnchorDefs: Array<{
      itemIndex: number
      boxStart: number
      boxEnd: number
      buf: Buffer
      dims: { width: number; height: number } | null
    }> = []

    const ROWS_PER_IMAGE_BOX = 14

    for (let i = 0; i < items.length; i++) {
      const itemNum = i + 1
      const { bIdx, cIdx, eIdx } = itemSsIndices[i]
      const detailRow = currentRow

      // Baris Detail Item
      rowsXml.push(
        `<row r="${detailRow}" spans="1:5" ht="30" customHeight="1">` +
        `<c r="A${detailRow}" s="6" t="n"><v>${itemNum}</v></c>` +
        `<c r="B${detailRow}" s="6" t="s"><v>${bIdx}</v></c>` +
        `<c r="C${detailRow}" s="27" t="s"><v>${cIdx}</v></c>` +
        `<c r="D${detailRow}" s="28"/>` +
        `<c r="E${detailRow}" s="7" t="s"><v>${eIdx}</v></c>` +
        `</row>`
      )
      dynamicMerges.push(`<mergeCell ref="C${detailRow}:D${detailRow}"/>`)
      currentRow++

      // Box Gambar Item (jika ada gambar, atau jika hanya ada 1 item seperti template kosong)
      const hasImage = !!itemImages[i]?.buf
      const shouldAddImageBox = hasImage || items.length === 1

      if (shouldAddImageBox) {
        const boxStart = currentRow
        const boxEnd = currentRow + ROWS_PER_IMAGE_BOX - 1

        for (let r = boxStart; r <= boxEnd; r++) {
          let sA: number, sB: number, sC: number, sD: number, sE: number
          if (r === boxStart) {
            sA = 9; sB = 12; sC = 18; sD = 13; sE = 9
          } else if (r === boxEnd) {
            sA = 11; sB = 16; sC = 20; sD = 17; sE = 11
          } else {
            sA = 10; sB = 14; sC = 19; sD = 15; sE = 10
          }

          rowsXml.push(
            `<row r="${r}" spans="1:5" ht="30" customHeight="1">` +
            `<c r="A${r}" s="${sA}"/>` +
            `<c r="B${r}" s="${sB}"/>` +
            `<c r="C${r}" s="${sC}"/>` +
            `<c r="D${r}" s="${sD}"/>` +
            `<c r="E${r}" s="${sE}"/>` +
            `</row>`
          )
        }

        dynamicMerges.push(
          `<mergeCell ref="A${boxStart}:A${boxEnd}"/>`,
          `<mergeCell ref="B${boxStart}:D${boxEnd}"/>`,
          `<mergeCell ref="E${boxStart}:E${boxEnd}"/>`
        )

        if (hasImage && itemImages[i].buf) {
          imageAnchorDefs.push({
            itemIndex: i,
            boxStart,
            boxEnd,
            buf: itemImages[i].buf!,
            dims: itemImages[i].dims,
          })
        }

        currentRow = boxEnd + 1
      }
    }

    // Blok Tanda Tangan
    const sigHeaderRow = currentRow
    rowsXml.push(
      `<row r="${sigHeaderRow}" spans="1:5" ht="32.25" customHeight="1">` +
      `<c r="A${sigHeaderRow}" s="27" t="s"><v>10</v></c>` +
      `<c r="B${sigHeaderRow}" s="28"/>` +
      `<c r="C${sigHeaderRow}" s="8" t="s"><v>11</v></c>` +
      `<c r="D${sigHeaderRow}" s="7" t="s"><v>12</v></c>` +
      `<c r="E${sigHeaderRow}" s="7" t="s"><v>13</v></c>` +
      `</row>`
    )
    dynamicMerges.push(`<mergeCell ref="A${sigHeaderRow}:B${sigHeaderRow}"/>`)

    const sigBoxStart = sigHeaderRow + 1
    const sigBoxEnd = sigHeaderRow + 4

    rowsXml.push(
      `<row r="${sigBoxStart}" spans="1:5" ht="20.1" customHeight="1">` +
      `<c r="A${sigBoxStart}" s="12"/><c r="B${sigBoxStart}" s="13"/><c r="C${sigBoxStart}" s="9"/><c r="D${sigBoxStart}" s="9"/><c r="E${sigBoxStart}" s="9"/>` +
      `</row>`,
      `<row r="${sigBoxStart + 1}" spans="1:5" ht="20.1" customHeight="1">` +
      `<c r="A${sigBoxStart + 1}" s="14"/><c r="B${sigBoxStart + 1}" s="15"/><c r="C${sigBoxStart + 1}" s="10"/><c r="D${sigBoxStart + 1}" s="10"/><c r="E${sigBoxStart + 1}" s="10"/>` +
      `</row>`,
      `<row r="${sigBoxStart + 2}" spans="1:5" ht="20.1" customHeight="1">` +
      `<c r="A${sigBoxStart + 2}" s="14"/><c r="B${sigBoxStart + 2}" s="15"/><c r="C${sigBoxStart + 2}" s="10"/><c r="D${sigBoxStart + 2}" s="10"/><c r="E${sigBoxStart + 2}" s="10"/>` +
      `</row>`,
      `<row r="${sigBoxEnd}" spans="1:5" ht="20.1" customHeight="1">` +
      `<c r="A${sigBoxEnd}" s="16"/><c r="B${sigBoxEnd}" s="17"/><c r="C${sigBoxEnd}" s="11"/><c r="D${sigBoxEnd}" s="11"/><c r="E${sigBoxEnd}" s="11"/>` +
      `</row>`
    )

    dynamicMerges.push(
      `<mergeCell ref="A${sigBoxStart}:B${sigBoxEnd}"/>`,
      `<mergeCell ref="C${sigBoxStart}:C${sigBoxEnd}"/>`,
      `<mergeCell ref="D${sigBoxStart}:D${sigBoxEnd}"/>`,
      `<mergeCell ref="E${sigBoxStart}:E${sigBoxEnd}"/>`
    )

    // 4. Update sheet1.xml
    let sheetXml = await zip.file("xl/worksheets/sheet1.xml")!.async("text")

    const sheetDataStart = sheetXml.indexOf("<sheetData>")
    const sheetDataEnd = sheetXml.indexOf("</sheetData>")
    const sheetDataContent = sheetXml.slice(sheetDataStart + 11, sheetDataEnd)

    const rows4to11: string[] = []
    for (let r = 4; r <= 11; r++) {
      const m = sheetDataContent.match(new RegExp(`<row r="${r}"[\\s\\S]*?<\\/row>`))
      if (m) rows4to11.push(m[0])
    }

    const newSheetData = `<sheetData>${rows4to11.join("")}${rowsXml.join("")}</sheetData>`
    sheetXml = sheetXml.slice(0, sheetDataStart) + newSheetData + sheetXml.slice(sheetDataEnd + 12)

    const topMerges = [
      '<mergeCell ref="A4:E4"/>',
      '<mergeCell ref="A5:E5"/>',
      '<mergeCell ref="A7:B7"/>',
      '<mergeCell ref="C7:E7"/>',
      '<mergeCell ref="A8:B8"/>',
      '<mergeCell ref="C8:E8"/>',
      '<mergeCell ref="A9:B9"/>',
      '<mergeCell ref="C9:D9"/>',
      '<mergeCell ref="A10:E10"/>',
      '<mergeCell ref="C11:D11"/>',
    ]
    const allMerges = [...topMerges, ...dynamicMerges]
    const newMergeCellsXml = `<mergeCells count="${allMerges.length}">${allMerges.join("")}</mergeCells>`
    sheetXml = sheetXml.replace(/<mergeCells[\s\S]*?<\/mergeCells>/, newMergeCellsXml)
    sheetXml = sheetXml.replace(/<dimension ref="[^"]*"/, `<dimension ref="A4:E${sigBoxEnd}"`)

    zip.file("xl/worksheets/sheet1.xml", sheetXml)

    // 5. Update Drawings & Rels
    const originalDrawingXml = (await zip.file("xl/drawings/drawing1.xml")?.async("text")) || ""
    const originalAnchors = originalDrawingXml.match(/<xdr:(?:twoCellAnchor|oneCellAnchor)[\s\S]*?<\/xdr:(?:twoCellAnchor|oneCellAnchor)>/g) || []
    const logoAnchorXml = originalAnchors.find((a) => a.includes("rId1")) || ""

    // Tanda Tangan Pemohon
    if (profile.signature_url) {
      const sigBuf = await getImageBuffer(profile.signature_url)
      zip.file("xl/media/image2.png", sigBuf || TRANSPARENT_1X1_PNG)
    } else {
      zip.file("xl/media/image2.png", TRANSPARENT_1X1_PNG)
    }

    const newSigAnchor =
      `<xdr:twoCellAnchor editAs="oneCell">` +
      `<xdr:from><xdr:col>3</xdr:col><xdr:colOff>733425</xdr:colOff><xdr:row>${sigBoxStart - 1}</xdr:row><xdr:rowOff>38100</xdr:rowOff></xdr:from>` +
      `<xdr:to><xdr:col>3</xdr:col><xdr:colOff>1600200</xdr:colOff><xdr:row>${sigBoxEnd - 1}</xdr:row><xdr:rowOff>219075</xdr:rowOff></xdr:to>` +
      `<xdr:pic>` +
      `<xdr:nvPicPr><xdr:cNvPr id="1168" name="Signature"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></xdr:cNvPicPr></xdr:nvPicPr>` +
      `<xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId2" cstate="print"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>` +
      `<xdr:spPr bwMode="auto"><a:xfrm><a:off x="6124575" y="10277475"/><a:ext cx="866775" cy="923925"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></xdr:spPr>` +
      `</xdr:pic><xdr:clientData/></xdr:twoCellAnchor>`

    const newItemAnchors: string[] = []
    const newRels: string[] = [
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.jpeg"/>`,
      `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image2.png"/>`,
    ]

    for (let idx = 0; idx < imageAnchorDefs.length; idx++) {
      const def = imageAnchorDefs[idx]
      const rId = `rId${3 + idx}`
      const mediaName = `image${3 + idx}.png`

      zip.file(`xl/media/${mediaName}`, def.buf)
      newRels.push(`<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${mediaName}"/>`)

      const MAX_CX = 5705475
      const boxRowCount = def.boxEnd - def.boxStart + 1
      const MAX_CY = boxRowCount * 30 * 12700 - 300000
      const BASE_COL_OFF = 1057275
      const BASE_ROW_OFF = 150000

      const dims = def.dims || { width: 100, height: 100 }
      const imgRatio = dims.width / dims.height
      const boxRatio = MAX_CX / MAX_CY

      let target_cx = MAX_CX
      let target_cy = MAX_CY
      let deltaX = 0
      let deltaY = 0

      if (imgRatio > boxRatio) {
        target_cy = Math.round(MAX_CX / imgRatio)
        deltaY = Math.round((MAX_CY - target_cy) / 2)
      } else {
        target_cx = Math.round(MAX_CY * imgRatio)
        deltaX = Math.round((MAX_CX - target_cx) / 2)
      }

      const itemAnchor =
        `<xdr:oneCellAnchor editAs="oneCell">` +
        `<xdr:from><xdr:col>1</xdr:col><xdr:colOff>${BASE_COL_OFF + deltaX}</xdr:colOff>` +
        `<xdr:row>${def.boxStart - 1}</xdr:row><xdr:rowOff>${BASE_ROW_OFF + deltaY}</xdr:rowOff></xdr:from>` +
        `<xdr:ext cx="${target_cx}" cy="${target_cy}"/>` +
        `<xdr:pic>` +
        `<xdr:nvPicPr><xdr:cNvPr id="${1200 + idx}" name="Item Image ${idx + 1}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></xdr:cNvPicPr></xdr:nvPicPr>` +
        `<xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>` +
        `<xdr:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="${target_cx}" cy="${target_cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></xdr:spPr>` +
        `</xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`

      newItemAnchors.push(itemAnchor)
    }

    if (imageAnchorDefs.length === 0) {
      zip.file("xl/media/image3.png", TRANSPARENT_1X1_PNG)
      newRels.push(`<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image3.png"/>`)
    }

    const newWsDr =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
      logoAnchorXml +
      newSigAnchor +
      newItemAnchors.join("") +
      `</xdr:wsDr>`

    zip.file("xl/drawings/drawing1.xml", newWsDr)

    const newRelsXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      newRels.join("") +
      `</Relationships>`
    zip.file("xl/drawings/_rels/drawing1.xml.rels", newRelsXml)

    const finalBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
    const nameSlug = (profile.full_name || "request").toUpperCase().replace(/\s+/g, "_")
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
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}