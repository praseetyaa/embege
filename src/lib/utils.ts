import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateLong(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function terbilang(angka: number): string {
  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  if (angka < 12) return bilangan[angka];
  if (angka < 20) return bilangan[angka - 10] + " Belas";
  if (angka < 100)
    return (
      bilangan[Math.floor(angka / 10)] +
      " Puluh " +
      bilangan[angka % 10]
    );
  if (angka < 200) return "Seratus " + terbilang(angka - 100);
  if (angka < 1000)
    return (
      bilangan[Math.floor(angka / 100)] +
      " Ratus " +
      terbilang(angka % 100)
    );
  if (angka < 2000) return "Seribu " + terbilang(angka - 1000);
  if (angka < 1000000)
    return (
      terbilang(Math.floor(angka / 1000)) +
      " Ribu " +
      terbilang(angka % 1000)
    );
  if (angka < 1000000000)
    return (
      terbilang(Math.floor(angka / 1000000)) +
      " Juta " +
      terbilang(angka % 1000000)
    );
  if (angka < 1000000000000)
    return (
      terbilang(Math.floor(angka / 1000000000)) +
      " Miliar " +
      terbilang(angka % 1000000000)
    );
  return (
    terbilang(Math.floor(angka / 1000000000000)) +
    " Triliun " +
    terbilang(angka % 1000000000000)
  );
}

export function getStatusColor(status: string) {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-300";
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-300";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Draf";
    case "pending":
      return "Menunggu";
    case "approved":
      return "Disetujui";
    case "rejected":
      return "Ditolak";
    default:
      return status;
  }
}
