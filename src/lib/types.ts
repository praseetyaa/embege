export type UserRole = "user" | "super_admin";

export type ReimbursementStatus = "draft" | "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  department: string | null;
  bank_name: string | null;
  bank_account: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reimbursement {
  id: string;
  user_id: string;
  title: string;
  period: string;
  status: ReimbursementStatus;
  total_amount: number;
  notes: string | null;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: Profile;
  reimbursement_items?: ReimbursementItem[];
}

export interface ReimbursementItem {
  id: string;
  reimbursement_id: string;
  date: string;
  description: string;
  category: string;
  store: string;
  amount: number;
  receipt_url: string | null;
  is_ai_extracted: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface OCRExtractedItem {
  date: string;
  description: string;
  category: string;
  store: string;
  amount: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  reimbursement_id: string | null;
  created_at: string;
}
