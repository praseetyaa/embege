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
import { formatCostReasons } from "@/lib/reimbursement-helper"

// ─── Nama bulan untuk kalimat cost reasons ────────────────────────────────────
const MONTH_NAMES = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER",
]

// ─── Category → baris G (kolom amount) di template Excel (berdasarkan REFERENSI FORM.xlsx) ───
const CATEGORY_TO_G_ROW: Record<string, number> = {
  "office rent": 3, "vehicle": 3, "car rental": 3, "social insurance": 3, "exhibitions": 3,
  "warehouse rent": 4, "computer": 4, "delivery": 4, "medical insurance": 4, "space branding rent": 4,
  "electricity&water": 5, "printer": 5, "express": 5, "accident insurance": 5, "accident Insurance": 5, "operating rental": 5,
  "property management": 6, "projector": 6, "gasoline": 6, "welfare": 6, "advertising/promotion": 6,
  "office supplies": 7, "office furniture": 7, "parking": 7, "training expenses": 7, "Marketing Fee": 7,
  "service maintenance": 8, "office appliances": 8, "toll": 8, "Service fee": 8, "claim price protection": 8,
  "tools & spare part": 9, "repairing": 9, "Adv. Production/installation": 9,
  "drinking water": 10, "Adv. Material": 10,
  "legal&professional fee": 11, "allowance": 11, "public relation activity": 11,
  "personnel recruitment": 12, "Transportation": 12, "BNS entertain-meals": 12,
  "document expense": 13, "hotel": 13, "BNS entertain-entertainment": 13,
  "telephone&fax": 14, "taxi": 14, "BNS entertain-hotel expense": 14,
  "internet": 15, "vehicle rent": 15, "Bonus": 15, "BNS entertain-gift": 15,
  "supplies": 16, "asset insurance": 16, "Miscelaneous Expenses": 16, "BNS entertain-Transportation": 16,
  "Tax Reklame": 17, "mobil insurance": 17, "meeting-meals": 17,
  "meeting-accommodation": 18, "meeting-rental": 19, "meeting-gift": 20,
}

// ─── Category → Cell coordinate di grid B3:F20 ──────────────────────────────
const CATEGORY_TO_CELL: Record<string, string> = {
  "office rent": "B3", "warehouse rent": "B4", "electricity&water": "B5", "property management": "B6",
  "office supplies": "B7", "service maintenance": "B8", "tools & spare part": "B9", "drinking water": "B10",
  "legal&professional fee": "B11", "personnel recruitment": "B12", "document expense": "B13",
  "telephone&fax": "B14", "internet": "B15", "supplies": "B16", "Tax Reklame": "B17",
  "vehicle": "C3", "computer": "C4", "printer": "C5", "projector": "C6", "office furniture": "C7",
  "office appliances": "C8", "vehicle rent": "C15", "asset insurance": "C16", "mobil insurance": "C17",
  "car rental": "D3", "delivery": "D4", "express": "D5", "gasoline": "D6", "parking": "D7",
  "toll": "D8", "repairing": "D9",
  "social insurance": "E3", "medical insurance": "E4", "accident insurance": "E5", "accident Insurance": "E5",
  "welfare": "E6", "training expenses": "E7", "Service fee": "E8", "allowance": "E11", "Transportation": "E12",
  "hotel": "E13", "taxi": "E14", "Bonus": "E15", "Miscelaneous Expenses": "E16",
  "exhibitions": "F3", "space branding rent": "F4", "operating rental": "F5", "advertising/promotion": "F6",
  "Marketing Fee": "F7", "claim price protection": "F8", "Adv. Production/installation": "F9", "Adv. Material": "F10",
  "public relation activity": "F11", "BNS entertain-meals": "F12", "BNS entertain-entertainment": "F13",
  "BNS entertain-hotel expense": "F14", "BNS entertain-gift": "F15", "BNS entertain-Transportation": "F16",
  "meeting-meals": "F17", "meeting-accommodation": "F18", "meeting-rental": "F19", "meeting-gift": "F20",
}

const ALL_CATEGORY_CELLS = Object.values(CATEGORY_TO_CELL)

const CATEGORY_DISPLAY: Record<string, string> = Object.fromEntries(
  Object.keys(CATEGORY_TO_CELL).map((category) => [category, category.toUpperCase()])
)

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
    const { data: reimb, error } = await supabase
      .from("reimbursements")
      .select(`*, reimbursement_items (*, categories(*)), profiles (full_name, department, bank_name, bank_account)`)
      .eq("id", id)
      .single()

    if (error || !reimb) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 })
    }

    let templatePath = path.join(process.cwd(), "templates", "TEMPLATE.xlsx")
    if (!fs.existsSync(templatePath)) templatePath = path.join(process.cwd(), "templates", "FORM_REMBESAN.xlsx")
    if (!fs.existsSync(templatePath)) templatePath = path.join(process.cwd(), "public", "template", "REFERENSI FORM.xlsx")

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: "Template Excel tidak ditemukan." }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XlsxPopulate = require("xlsx-populate")
    const workbook = await XlsxPopulate.fromFileAsync(templatePath)
    const sheet = workbook.sheets()[0]
    if (!sheet) throw new Error("Worksheet pada template Excel tidak ditemukan.")

    const profile = reimb.profiles || {}
    const items: any[] = reimb.reimbursement_items || []
    const total: number = Number(reimb.total_amount || 0)

    const d = new Date(reimb.created_at)
    const dateStr = [String(d.getDate()).padStart(2, "0"), String(d.getMonth() + 1).padStart(2, "0"), d.getFullYear()].join(".")
    sheet.cell("A3").value(dateStr).style("fontColor", "000000").style("fontSize", 8)
    sheet.cell("A5").value((profile.full_name || "").toUpperCase()).style("fontColor", "000000").style("fontSize", 8)
    sheet.cell("A7").value((profile.department || "SERVICE CENTER PURWOKERTO").toUpperCase()).style("fontColor", "000000").style("fontSize", 8)
    sheet.cell("A9").value("DUAN LONGCHANG").style("fontColor", "000000").style("fontSize", 8)
    sheet.cell("A11").value((profile.bank_name || "BCA").toUpperCase()).style("fontColor", "000000").style("fontSize", 8)
    sheet.cell("A13").value((profile.bank_account || "").replace(/-/g, " ")).style("fontColor", "000000").style("fontSize", 8)
    sheet.cell("H3").value("DUAN LONGCHANG").style("fontColor", "000000").style("fontSize", 8)
    sheet.cell("H5").value([(profile.bank_name || "BCA").toUpperCase(), (profile.bank_account || "").replace(/-/g, " ")].join("  ")).style("fontColor", "000000").style("fontSize", 8)

    // Do not pass null to xlsx-populate style(). Its style XML writer expects a
    // real fill object and crashes with: "Cannot read properties of null
    // (reading 'children')". A new workbook is loaded for every request, so
    // clearing old highlights is unnecessary; use an empty string for values.
    for (let row = 3; row <= 20; row++) sheet.cell(`G${row}`).value("")

    const DB_TO_TEMPLATE: Record<string, string> = {
      "ATK": "office supplies", "Konsumsi": "BNS entertain-meals", "Air Minum": "drinking water",
      "Transportasi": "Transportation", "Lain-lain": "supplies",
    }
    const amountByGRow: Record<number, number> = {}
    const activeCategories = new Set<string>()

    for (const item of items) {
      let catName: string = item.categories?.name || item.category || ""
      catName = DB_TO_TEMPLATE[catName] || catName
      activeCategories.add(catName)
      const gRow = CATEGORY_TO_G_ROW[catName]
      if (gRow) amountByGRow[gRow] = (amountByGRow[gRow] || 0) + Number(item.amount || 0)
    }

    for (const [rowStr, amount] of Object.entries(amountByGRow)) {
      sheet.cell(`G${rowStr}`).value(amount).style("fontColor", "000000").style("fontSize", 7)
    }
    for (const catName of activeCategories) {
      const targetCell = CATEGORY_TO_CELL[catName]
      if (targetCell) sheet.cell(targetCell).style("fill", "CCECFF")
    }

    const totalFormatted = formatRupiah(total)
    const rtG21 = new XlsxPopulate.RichText()
    rtG21.add("RP：                        ", { fontColor: "7030A0", fontSize: 7, fontFamily: "Calibri" })
    rtG21.add(totalFormatted, { fontColor: "000000", fontSize: 7, fontFamily: "Calibri" })
    sheet.cell("G21").value(rtG21)

    const costReasons = formatCostReasons({ fullName: profile.full_name, items, totalAmount: total, department: profile.department })
    const prefixB18 = "Cost reasons and completion\n费用支出原因及完成情况                                                                                                              "
    const rtB18 = new XlsxPopulate.RichText()
    rtB18.add(prefixB18, { fontColor: "7030A0", bold: true, fontSize: 7, fontFamily: "Calibri" })
    rtB18.add(costReasons, { fontColor: "000000", bold: true, fontSize: 7, fontFamily: "Calibri" })
    sheet.cell("B18").value(rtB18)

    const rtB21 = new XlsxPopulate.RichText()
    rtB21.add("合计（大写）total（words）：", { fontColor: "7030A0", bold: true, fontSize: 7, fontFamily: "Calibri" })
    rtB21.add(terbilangRupiah(total), { fontColor: "000000", bold: true, fontSize: 7, fontFamily: "Calibri" })
    sheet.cell("B21").value(rtB21)

    const financialFields = [
      ["B22", "Excluding VAT\nRP: "] , ["C22", "入账金额：amount AC\nRP : "] , ["E23", "实付金额ACTUAL PAYMENT\nRP:  "],
    ] as const
    for (const [cell, label] of financialFields) {
      const richText = new XlsxPopulate.RichText()
      richText.add(label, { fontColor: "7030A0", fontSize: 7, fontFamily: "Calibri" })
      richText.add(totalFormatted, { fontColor: "000000", fontSize: 7, fontFamily: "Calibri" })
      sheet.cell(cell).value(richText)
    }

    const buffer: Buffer = await workbook.outputAsync()
    const employeeSlug = (profile.full_name || "reimb").toUpperCase().replace(/\s+/g, "_")
    const filename = `REIMB_${employeeSlug}_${reimb.period ?? dateStr}.xlsx`

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err: any) {
    console.error("download-xlsx error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
