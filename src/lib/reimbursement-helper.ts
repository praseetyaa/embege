import { formatRupiah } from "./terbilang"

/**
 * Mendapatkan prefix aksi kata biaya berdasarkan nama kategori.
 * Contoh:
 * - "service maintenance" / "repairing" / "Service fee" -> "BIAYA SERVICE"
 * - "express" / "delivery" -> "BIAYA PENGIRIMAN"
 * - "office supplies" / "tools & spare part" -> "BIAYA PEMBELIAN"
 * - "car rental" / "vehicle rent" -> "BIAYA SEWA"
 */
export function getCategoryActionPrefix(catName?: string | null): string {
  if (!catName) return "BIAYA PEMBELIAN"

  const cat = catName.trim().toLowerCase()

  // 1. Service / Perbaikan
  if (
    cat.includes("service") ||
    cat.includes("repair") ||
    cat.includes("perbaikan")
  ) {
    return "BIAYA SERVICE"
  }

  // 2. Express / Delivery / Pengiriman
  if (
    cat.includes("express") ||
    cat.includes("delivery") ||
    cat.includes("pengiriman") ||
    cat.includes("ekspedisi")
  ) {
    return "BIAYA PENGIRIMAN"
  }

  // 3. Sewa / Rental
  if (cat.includes("rent") || cat.includes("sewa")) {
    return "BIAYA SEWA"
  }

  // 4. Transportasi / Bensin / Tol / Parkir
  if (
    cat.includes("gasoline") ||
    cat.includes("parking") ||
    cat.includes("toll") ||
    cat.includes("transport") ||
    cat.includes("taxi")
  ) {
    return "BIAYA TRANSPORTASI"
  }

  // 5. Konsumsi / Meals / Air Minum
  if (
    cat.includes("meal") ||
    cat.includes("drinking water") ||
    cat.includes("konsumsi") ||
    cat.includes("welfare")
  ) {
    return "BIAYA KONSUMSI"
  }

  // 6. Asuransi / Insurance
  if (cat.includes("insurance") || cat.includes("asuransi")) {
    return "BIAYA ASURANSI"
  }

  // 7. Pembelian / Supplies / Furniture / ATK / Tools
  if (
    cat.includes("supply") ||
    cat.includes("supplies") ||
    cat.includes("appliance") ||
    cat.includes("furniture") ||
    cat.includes("computer") ||
    cat.includes("printer") ||
    cat.includes("projector") ||
    cat.includes("tool") ||
    cat.includes("spare part") ||
    cat.includes("material") ||
    cat.includes("atk") ||
    cat.includes("pembelian")
  ) {
    return "BIAYA PEMBELIAN"
  }

  // Fallback default jika kategori berupa teks umum
  return `BIAYA ${catName.toUpperCase()}`
}

/**
 * Format string kalimat Cost reasons and completion (费用支出原因及完成情况).
 * Contoh hasil:
 * "ISNA PRASETYO REIMB PAID DUAN LONGCHANG BIAYA SERVICE TV SC (PERGANTIAN LED BACKLIGHT & REGULATOR) UNTUK SERVICE CENTER VIVO PURWOKERTO Rp750.000,-"
 */
export function formatCostReasons(params: {
  fullName?: string | null
  items?: Array<{ description?: string | null; category?: string | null; categories?: { name?: string | null } | null }>
  totalAmount?: number | null
  department?: string | null
}): string {
  const name = (params.fullName || "").trim().toUpperCase()
  const items = params.items || []
  const total = params.totalAmount || 0
  const dept = (params.department || "SERVICE CENTER VIVO PURWOKERTO").trim().toUpperCase()

  // Ambil kategori utama dari item pertama
  const primaryCat = items[0]?.categories?.name || items[0]?.category || ""
  const actionPrefix = getCategoryActionPrefix(primaryCat)

  // Kumpulkan deskripsi seluruh item
  let descriptions = items
    .map((item) => (item.description || "").trim())
    .filter(Boolean)
    .join(", ")
    .toUpperCase()

  // Rapikan jika kata awal deskripsi berulang dengan kata akhir prefix
  if (actionPrefix.endsWith("SERVICE") && descriptions.startsWith("SERVICE ")) {
    descriptions = descriptions.substring(8).trim()
  } else if (actionPrefix.endsWith("PENGIRIMAN") && descriptions.startsWith("PENGIRIMAN ")) {
    descriptions = descriptions.substring(11).trim()
  } else if (actionPrefix.endsWith("PEMBELIAN") && descriptions.startsWith("PEMBELIAN ")) {
    descriptions = descriptions.substring(10).trim()
  } else if (actionPrefix.endsWith("SEWA") && descriptions.startsWith("SEWA ")) {
    descriptions = descriptions.substring(5).trim()
  }

  const formattedTotal = formatRupiah(total)
  const targetDept = dept.startsWith("UNTUK ") ? dept : `UNTUK ${dept}`

  return `${name} REIMB PAID DUAN LONGCHANG ${actionPrefix} ${descriptions} ${targetDept} Rp${formattedTotal},-`
}
