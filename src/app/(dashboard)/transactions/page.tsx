import { createClient } from "@/lib/supabase/server"
import { TransactionList } from "./transaction-list"

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch all transactions for this user
  const { data: transactions } = await supabase
    .from("reimbursement_items")
    .select(`
      *,
      reimbursements (
        id,
        status,
        title
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between items-start gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
        <p className="text-slate-500">Daftar semua nota yang telah Anda input. Pilih nota yang belum diajukan untuk di-reimburse.</p>
      </div>

      <TransactionList initialData={transactions || []} />
    </div>
  )
}
