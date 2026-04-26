import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReimburseForm } from "./reimburse-form"

export default async function ReimbursePage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string }>
}) {
  const params = await searchParams
  const itemIds = params.items?.split(',') || []

  if (itemIds.length === 0) {
    redirect("/transactions")
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch the selected items — join categories so we get the name back
  const { data: rawItems } = await supabase
    .from("reimbursement_items")
    .select("*, categories(id, name)")
    .in("id", itemIds)
    .eq("user_id", user.id)
    .is("reimbursement_id", null) // Only allow unassigned items

  // Map category name back onto item so the form dropdown can display it
  const items = rawItems?.map((item: any) => ({
    ...item,
    category: item.categories?.name || item.category || "",
  }))

  if (!items || items.length === 0) {
    redirect("/transactions")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between items-start gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Buat Pengajuan Reimbursement</h1>
        <p className="text-slate-500">Isi detail pengajuan untuk {items.length} nota yang telah Anda pilih.</p>
      </div>

      <ReimburseForm initialItems={items} />
    </div>
  )
}
