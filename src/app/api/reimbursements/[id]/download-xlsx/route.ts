/**
 * GET /api/reimbursements/[id]/download-xlsx
 *
 * Mengisi template FORM_REMBESAN.xlsx / REFERENSI FORM.xlsx
 * secara presisi sesuai format referensi Finance.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import path from "path"
import fs from "fs"
import { terbilangRupiah, formatRupiah } from "@/lib/terbilang"

// ─── Nama bulan untuk kalimat cost reasons ────────────────────────────────────
const MONTH_NAMES = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER",
]

// ─── Category → baris G (kolom amount) di template Excel (berdasarkan REFERENSI FORM.xlsx) ───
const CATEGORY_TO_G_ROW: Record<string, number> = {
  // Row 3  (office rent, vehicle, car rental, social insurance, exhibitions)
  "office rent": 3, "vehicle": 3, "car rental": 3, "social insurance": 3, "exhibitions": 3,
  // Row 4  (warehouse rent, computer, delivery, medical insurance, space branding rent)
  "warehouse rent": 4, "computer": 4, "delivery": 4, "medical insurance": 4, "space branding rent": 4,
  // Row 5  (electricity&water, printer, express, accident insurance, operating rental)
  "electricity&water": 5, "printer": 5, "express": 5, "accident insurance": 5, "accident Insurance": 5, "operating rental": 5,
  // Row 6  (property management, projector, gasoline, welfare, advertising/promotion)
  "property management": 6, "projector": 6, "gasoline": 6, "welfare": 6, "advertising/promotion": 6,
  // Row 7  (office supplies, office furniture, parking, training expenses, Marketing Fee)
  "office supplies": 7, "office furniture": 7, "parking": 7, "training expenses": 7, "Marketing Fee": 7,
  // Row 8  (service maintenance, office appliances, toll, Service fee, claim price protection)
  "service maintenance": 8, "office appliances": 8, "toll": 8, "Service fee": 8, "claim price protection": 8,
  // Row 9  (tools & spare part, repairing, Adv. Production/installation)
  "tools & spare part": 9, "repairing": 9, "Adv. Production/installation": 9,
  // Row 10 (drinking water, Adv. Material)
  "drinking water": 10, "Adv. Material": 10,
  // Row 11 (legal&professional fee, allowance, public relation activity)
  "legal&professional fee": 11, "allowance": 11, "public relation activity": 11,
  // Row 12 (personnel recruitment, Transportation, BNS entertain-meals)
  "personnel recruitment": 12, "Transportation": 12, "BNS entertain-meals": 12,
  // Row 13 (document expense, hotel, BNS entertain-entertainment)
  "document expense": 13, "hotel": 13, "BNS entertain-entertainment": 13,
  // Row 14 (telephone&fax, taxi, BNS entertain-hotel expense)
  "telephone&fax": 14, "taxi": 14, "BNS entertain-hotel expense": 14,
  // Row 15 (internet, vehicle rent, Bonus, BNS entertain-gift)
  "internet": 15, "vehicle rent": 15, "Bonus": 15, "BNS entertain-gift": 15,
  // Row 16 (supplies, asset insurance, Miscelaneous Expenses, BNS entertain-Transportation)
  "supplies": 16, "asset insurance": 16, "Miscelaneous Expenses": 16, "BNS entertain-Transportation": 16,
  // Row 17 (Tax Reklame, mobil insurance, meeting-meals)
  "Tax Reklame": 17, "mobil insurance": 17, "meeting-meals": 17,
  // Row 18-20 (meeting categories)
  "meeting-accommodation": 18,
  "meeting-rental": 19,
  "meeting-gift": 20,
}

// ─── Category → Cell coordinate di grid B3:F20 ──────────────────────────────
const CATEGORY_TO_CELL: Record<string, string> = {
  // Column B
  "office rent": "B3",
  "warehouse rent": "B4",
  "electricity&water": "B5",
  "property management": "B6",
  "office supplies": "B7",
  "service maintenance": "B8",
  "tools & spare part": "B9",
  "drinking water": "B10",
  "legal&professional fee": "B11",
  "personnel recruitment": "B12",
  "document expense": "B13",
  "telephone&fax": "B14",
  "internet": "B15",
  "supplies": "B16",
  "Tax Reklame": "B17",

  // Column C
  "vehicle": "C3",
  "computer": "C4",
  "printer": "C5",
  "projector": "C6",
  "office furniture": "C7",
  "office appliances": "C8",
  "vehicle rent": "C15",
  "asset insurance": "C16",
  "mobil insurance": "C17",

  // Column D
  "car rental": "D3",
  "delivery": "D4",
  "express": "D5",
  "gasoline": "D6",
  "parking": "D7",
  "toll": "D8",
  "repairing": "D9",

  // Column E
  "social insurance": "E3",
  "medical insurance": "E4",
  "accident insurance": "E5",
  "accident Insurance": "E5",
  "welfare": "E6",
  "training expenses": "E7",
  "Service fee": "E8",
  "allowance": "E11",
  "Transportation": "E12",
  "hotel": "E13",
  "taxi": "E14",
  "Bonus": "E15",
  "Miscelaneous Expenses": "E16",

  // Column F
  "exhibitions": "F3",
  "space branding rent": "F4",
  "operating rental": "F5",
  "advertising/promotion": "F6",
  "Marketing Fee": "F7",
  "claim price protection": "F8",
  "Adv. Production/installation": "F9",
  "Adv. Material": "F10",
  "public relation activity": "F11",
  "BNS entertain-meals": "F12",
  "BNS entertain-entertainment": "F13",
  "BNS entertain-hotel expense": "F14",
  "BNS entertain-gift": "F15",
  "BNS entertain-Transportation": "F16",
  "meeting-meals": "F17",
  "meeting-accommodation": "F18",
  "meeting-rental": "F19",
  "meeting-gift": "F20",
}

const ALL_CATEGORY_CELLS = [
  "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12", "B13", "B14", "B15", "B16", "B17",
  "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14", "C15", "C16", "C17",
  "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13", "D14", "D15", "D16", "D17",
  "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17",
  "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20",
]

// ─── Label ringkas kategori untuk kalimat cost reasons ────────────────────────
const CATEGORY_DISPLAY: Record<string, string> = {
  "office rent": "OFFICE RENT",
  "warehouse rent": "WAREHOUSE RENT",
  "electricity&water": "ELECTRICITY & WATER",
  "property management": "PROPERTY MANAGEMENT",
  "office supplies": "OFFICE SUPPLIES",
  "service maintenance": "SERVICE MAINTENANCE",
  "tools & spare part": "TOOLS & SPARE PART",
  "drinking water": "DRINKING WATER",
  "legal&professional fee": "LEGAL & PROFESSIONAL FEE",
  "personnel recruitment": "PERSONNEL RECRUITMENT",
  "document expense": "DOCUMENT EXPENSE",
  "telephone&fax": "TELEPHONE & FAX",
  "internet": "INTERNET",
  "supplies": "SUPPLIES",
  "Tax Reklame": "TAX REKLAME",
  "vehicle": "VEHICLE",
  "computer": "COMPUTER",
  "printer": "PRINTER",
  "projector": "PROJECTOR",
  "office furniture": "OFFICE FURNITURE",
  "office appliances": "OFFICE APPLIANCES",
  "exhibitions": "EXHIBITIONS",
  "space branding rent": "SPACE BRANDING RENT",
  "operating rental": "OPERATING RENTAL",
  "vehicle rent": "VEHICLE RENT",
  "asset insurance": "ASSET INSURANCE",
  "mobil insurance": "MOBIL INSURANCE",
  "car rental": "CAR RENTAL",
  "delivery": "DELIVERY",
  "express": "EXPRESS",
  "gasoline": "GASOLINE",
  "parking": "PARKING",
  "toll": "TOLL",
  "repairing": "REPAIRING",
  "social insurance": "SOCIAL INSURANCE",
  "medical insurance": "MEDICAL INSURANCE",
  "accident insurance": "ACCIDENT INSURANCE",
  "welfare": "WELFARE",
  "training expenses": "TRAINING EXPENSES",
  "Service fee": "SERVICE FEE",
  "allowance": "ALLOWANCE",
  "Transportation": "TRANSPORTATION",
  "hotel": "HOTEL",
  "taxi": "TAXI",
  "Bonus": "BONUS",
  "advertising/promotion": "ADVERTISING/PROMOTION",
  "Marketing Fee": "MARKETING FEE",
  "claim price protection": "CLAIM PRICE PROTECTION",
  "Adv. Production/installation": "ADV. PRODUCTION/INSTALLATION",
  "Adv. Material": "ADV. MATERIAL",
  "public relation activity": "PUBLIC RELATION ACTIVITY",
  "BNS entertain-meals": "BNS MEALS",
  "BNS entertain-entertainment": "BNS ENTERTAINMENT",
  "BNS entertain-hotel expense": "BNS HOTEL EXPENSE",
  "BNS entertain-Transportation": "BNS TRANSPORTATION",
  "BNS entertain-gift": "BNS GIFT",
  "meeting-meals": "MEETING MEALS",
  "meeting-accommodation": "MEETING ACCOMMODATION",
  "meeting-rental": "MEETING RENTAL",
  "meeting-gift": "MEETING GIFT",
}

// ─── Handler ──────────────────────────────────────────────────────────────────
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

    // Fetch reimbursement
    const { data: reimb, error } = await supabase
      .from("reimbursements")
      .select(`
        *,
        reimbursement_items (*, categories(*)),
        profiles (full_name, department, bank_name, bank_account)
      `)
      .eq("id", id)
      .single()

    if (error || !reimb) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 })
    }

    // ── Load template ───────────────────────────────────────────────────────
    let templatePath = path.join(process.cwd(), "templates", "TEMPLATE.xlsx")
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), "templates", "FORM_REMBESAN.xlsx")
    }
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), "public", "template", "REFERENSI FORM.xlsx")
    }

    if (!fs.existsSync(templatePath)) {
      console.error("Template not found at:", templatePath)
      return NextResponse.json(
        { error: "Template Excel tidak ditemukan." },
        { status: 500 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XlsxPopulate = require("xlsx-populate")
    const workbook = await XlsxPopulate.fromFileAsync(templatePath)
    const sheet = workbook.sheets()[0]

    const profile = reimb.profiles || {}
    const items: any[] = reimb.reimbursement_items || []
    const total: number = reimb.total_amount || 0

    // ── 1. Tanggal (format: 01.07.2026) ───────────────────────────────────
    const d = new Date(reimb.created_at)
    const dateStr = [
      String(d.getDate()).padStart(2, "0"),
      String(d.getMonth() + 1).padStart(2, "0"),
      d.getFullYear(),
    ].join(".")
    sheet.cell("A3").value(dateStr).style("fontColor", "000000").style("fontSize", 8)

    // ── 2. Data karyawan (kiri) ─────────────────────────────────────────────
    sheet.cell("A5").value((profile.full_name || "").toUpperCase()).style("fontColor", "000000").style("fontSize", 8)
    sheet.cell("A7").value((profile.department || "SERVICE CENTER PURWOKERTO").toUpperCase()).style("fontColor", "000000").style("fontSize", 8)
    sheet.cell("A9").value("DUAN LONGCHANG").style("fontColor", "000000").style("fontSize", 8)
    sheet.cell("A11").value((profile.bank_name || "BCA").toUpperCase()).style("fontColor", "000000").style("fontSize", 8)
    sheet.cell("A13").value((profile.bank_account || "").replace(/-/g, " ")).style("fontColor", "000000").style("fontSize", 8)

    // Note: Sel A15 berisi TTD (gambar), jangan di-overwrite.
    // Note: Sel A17 biarkan kosong sesuai referensi TEMPLATE.xlsx.

    // ── 3. Data rekening pusat (kanan) ──────────────────────────────────────
    sheet.cell("H3").value("DUAN LONGCHANG").style("fontColor", "000000").style("fontSize", 8)
    const bankDisplay = [
      (profile.bank_name || "BCA").toUpperCase(),
      (profile.bank_account || "").replace(/-/g, " "),
    ].join("  ")
    sheet.cell("H5").value(bankDisplay).style("fontColor", "000000").style("fontSize", 8)

    // ── 4. Resett Kategori Highlight & Amount per Kategori di kolom G ──────
    for (let row = 3; row <= 20; row++) {
      sheet.cell(`G${row}`).value(null)
    }

    // Reset background fill kategori pada grid B3:F20
    for (const cellAddr of ALL_CATEGORY_CELLS) {
      sheet.cell(cellAddr).style("fill", null)
    }

    const DB_TO_TEMPLATE: Record<string, string> = {
      "ATK": "office supplies",
      "Konsumsi": "BNS entertain-meals",
      "Air Minum": "drinking water",
      "Transportasi": "Transportation",
      "Lain-lain": "supplies",
    }

    const amountByGRow: Record<number, number> = {}
    const activeCategories = new Set<string>()

    for (const item of items) {
      let catName: string = item.categories?.name || item.category || ""
      catName = DB_TO_TEMPLATE[catName] || catName
      activeCategories.add(catName)

      const gRow = CATEGORY_TO_G_ROW[catName]
      if (gRow) {
        amountByGRow[gRow] = (amountByGRow[gRow] || 0) + Number(item.amount)
      }
    }

    // Isi amount di kolom G dengan warna teks hitam dan font size 7
    for (const [rowStr, amount] of Object.entries(amountByGRow)) {
      sheet.cell(`G${rowStr}`).value(amount).style("fontColor", "000000").style("fontSize", 7)
    }

    // Highlight sel kategori terpilih dengan warna biru #CCECFF
    for (const catName of activeCategories) {
      const targetCell = CATEGORY_TO_CELL[catName]
      if (targetCell) {
        sheet.cell(targetCell).style("fill", "CCECFF")
      }
    }

    // ── 5. Grand total (G21) ────────────────────────────────────────────────
    const totalFormatted = formatRupiah(total)
    const rtG21 = new XlsxPopulate.RichText()
    rtG21.add("RP：                        ", { fontColor: "7030A0", fontSize: 7, fontFamily: "Calibri" })
    rtG21.add(totalFormatted, { fontColor: "000000", fontSize: 7, fontFamily: "Calibri" })
    sheet.cell("G21").value(rtG21)

    // ── 6. Cost reasons (B18) ───────────────────────────────────────────────
    let mainCatName: string = items[0]?.categories?.name || items[0]?.category || ""
    mainCatName = DB_TO_TEMPLATE[mainCatName] || mainCatName
    const categoryDisplay = CATEGORY_DISPLAY[mainCatName] || mainCatName.toUpperCase()

    const periodeMonth = reimb.period
      ? MONTH_NAMES[parseInt(reimb.period.split("-")[1], 10) - 1] ?? ""
      : ""

    const costReasons = [
      (profile.full_name || "").toUpperCase(),
      "REIMB PAID DUAN LONGCHANG BIAYA",
      categoryDisplay,
      "PERIODE",
      periodeMonth,
      "VIVO PURWOKERTO",
      `Rp${totalFormatted},-`,
    ].join(" ")

    const prefixB18 = "Cost reasons and completion\n费用支出原因及完成情况                                                                                                                                                                     "
    const rtB18 = new XlsxPopulate.RichText()
    rtB18.add(prefixB18, { fontColor: "7030A0", bold: true, fontSize: 7, fontFamily: "Calibri" })
    rtB18.add(costReasons, { fontColor: "000000", bold: true, fontSize: 7, fontFamily: "Calibri" })
    sheet.cell("B18").value(rtB18)

    // ── 7. Terbilang (B21) ──────────────────────────────────────────────────
    const rtB21 = new XlsxPopulate.RichText()
    rtB21.add("合计（大写）total（words）：", { fontColor: "7030A0", bold: true, fontSize: 7, fontFamily: "Calibri" })
    rtB21.add(terbilangRupiah(total), { fontColor: "000000", bold: true, fontSize: 7, fontFamily: "Calibri" })
    sheet.cell("B21").value(rtB21)

    // ── 8. Field keuangan bawah (B22, C22, E23) ────────────────────────────
    const rtB22 = new XlsxPopulate.RichText()
    rtB22.add("Excluding VAT\nRP: ", { fontColor: "7030A0", fontSize: 7, fontFamily: "Calibri" })
    rtB22.add(totalFormatted, { fontColor: "000000", fontSize: 7, fontFamily: "Calibri" })
    sheet.cell("B22").value(rtB22)

    const rtC22 = new XlsxPopulate.RichText()
    rtC22.add("入账金额：amount AC\nRP : ", { fontColor: "7030A0", fontSize: 7, fontFamily: "Calibri" })
    rtC22.add(totalFormatted, { fontColor: "000000", fontSize: 7, fontFamily: "Calibri" })
    sheet.cell("C22").value(rtC22)

    const rtE23 = new XlsxPopulate.RichText()
    rtE23.add("实付金额ACTUAL PAYMENT\nRP:  ", { fontColor: "7030A0", fontSize: 7, fontFamily: "Calibri" })
    rtE23.add(totalFormatted, { fontColor: "000000", fontSize: 7, fontFamily: "Calibri" })
    sheet.cell("E23").value(rtE23)

    // ── 9. Response buffer ──────────────────────────────────────────────────
    const buffer: Buffer = await workbook.outputAsync()

    const employeeSlug = (profile.full_name || "reimb")
      .toUpperCase()
      .replace(/\s+/g, "_")
    const filename = `REIMB_${employeeSlug}_${reimb.period ?? dateStr}.xlsx`

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err: any) {
    console.error("download-xlsx error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

