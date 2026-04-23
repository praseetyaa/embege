export const APP_NAME = "REIMBURSE";
export const APP_DESCRIPTION = "Smart Receipt Scanner & Reimbursement Generator";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
};

export const DEFAULT_CATEGORIES = [
  { name: "Air Minum", slug: "air_minum", color: "#3B82F6" },
  { name: "ATK", slug: "atk", color: "#8B5CF6" },
  { name: "Transportasi", slug: "transportasi", color: "#F59E0B" },
  { name: "Makan & Minum", slug: "makan_minum", color: "#EF4444" },
  { name: "Akomodasi", slug: "akomodasi", color: "#10B981" },
  { name: "Telekomunikasi", slug: "telekomunikasi", color: "#06B6D4" },
  { name: "Parkir & Tol", slug: "parkir_tol", color: "#F97316" },
  { name: "Fotocopy & Print", slug: "fotocopy_print", color: "#EC4899" },
  { name: "Operasional Kantor", slug: "operasional_kantor", color: "#6366F1" },
  { name: "Lain-lain", slug: "lain_lain", color: "#6B7280" },
];

export const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "draft", label: "Draf" },
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

export const NAV_ITEMS_USER = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/new", label: "Buat Pengajuan", icon: "PlusCircle" },
  { href: "/history", label: "Riwayat", icon: "History" },
  { href: "/profile", label: "Profil", icon: "User" },
];

export const NAV_ITEMS_ADMIN = [
  { href: "/admin", label: "Dashboard Admin", icon: "BarChart3" },
  { href: "/admin/submissions", label: "Semua Pengajuan", icon: "FileText" },
  { href: "/admin/users", label: "Kelola User", icon: "Users" },
  { href: "/admin/categories", label: "Kategori", icon: "Tag" },
];
