import { z } from "zod";

export const profileSchema = z.object({
  department: z.string().min(1, "Departemen harus diisi"),
  bank_name: z.string().min(1, "Nama bank harus diisi"),
  bank_account: z.string().min(5, "Nomor rekening minimal 5 digit"),
  signature_url: z.string().nullable().optional(),
});

export const reimbursementItemSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  description: z.string().min(1, "Keterangan harus diisi"),
  category: z.string().optional(),
  category_id: z.string().optional(),
  vendor: z.string().optional(),
  amount: z.coerce.number().positive("Nominal harus positif"),
});

export const reimbursementSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  period: z.string().min(1, "Periode harus dipilih"),
  notes: z.string().optional(),
  total_amount: z.coerce.number(),
  items: z.array(reimbursementItemSchema).min(1, "Minimal harus ada 1 item"),
});

export const adminActionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  admin_notes: z.string().optional(),
});
