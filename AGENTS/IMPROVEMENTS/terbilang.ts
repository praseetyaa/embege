/**
 * Konversi angka ke terbilang Bahasa Indonesia
 * Contoh: 634291 → "ENAM RATUS TIGA PULUH EMPAT RIBU DUA RATUS SEMBILAN PULUH SATU RUPIAH"
 */
export function terbilang(angka: number): string {
  const huruf = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima",
    "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ]
  if (angka < 12) return huruf[angka]
  if (angka < 20) return terbilang(angka - 10) + " Belas"
  if (angka < 100) return (terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10)).trim()
  if (angka < 200) return ("Seratus " + terbilang(angka - 100)).trim()
  if (angka < 1000) return (terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100)).trim()
  if (angka < 2000) return ("Seribu " + terbilang(angka - 1000)).trim()
  if (angka < 1_000_000) return (terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000)).trim()
  if (angka < 1_000_000_000) return (terbilang(Math.floor(angka / 1_000_000)) + " Juta " + terbilang(angka % 1_000_000)).trim()
  return ""
}

/** Format angka ke string rupiah Indonesia: 634291 → "634.291" */
export function formatRupiah(angka: number): string {
  return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

/** Format terbilang lengkap dengan "RUPIAH" di akhir, uppercase */
export function terbilangRupiah(angka: number): string {
  return terbilang(angka).toUpperCase() + " RUPIAH"
}
