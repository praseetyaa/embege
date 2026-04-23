/**
 * Converts a number to Indonesian words (Terbilang)
 * Example: 1.250.000 -> "Satu Juta Dua Ratus Lima Puluh Ribu Rupiah"
 */
export function terbilang(n: number): string {
  const units = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let res = "";

  if (n < 12) {
    res = units[n];
  } else if (n < 20) {
    res = terbilang(n - 10) + " Belas";
  } else if (n < 100) {
    res = terbilang(Math.floor(n / 10)) + " Puluh " + terbilang(n % 10);
  } else if (n < 200) {
    res = "Seratus " + terbilang(n - 100);
  } else if (n < 1000) {
    res = terbilang(Math.floor(n / 100)) + " Ratus " + terbilang(n % 100);
  } else if (n < 2000) {
    res = "Seribu " + terbilang(n - 1000);
  } else if (n < 1000000) {
    res = terbilang(Math.floor(n / 1000)) + " Ribu " + terbilang(n % 1000);
  } else if (n < 1000000000) {
    res = terbilang(Math.floor(n / 1000000)) + " Juta " + terbilang(n % 1000000);
  } else if (n < 1000000000000) {
    res = terbilang(Math.floor(n / 1000000000)) + " Miliar " + terbilang(n % 1000000000);
  } else if (n < 1000000000000000) {
    res = terbilang(Math.floor(n / 1000000000000)) + " Triliun " + terbilang(n % 1000000000000);
  }

  // Clean up extra spaces and normalize "Satu Ratus" -> "Seratus" etc.
  return res.replace(/\s+/g, " ").trim() || "Nol";
}

export function formatTerbilangRupiah(n: number): string {
  if (n === 0) return "Nol Rupiah";
  const words = terbilang(Math.floor(n));
  return words + " Rupiah";
}
