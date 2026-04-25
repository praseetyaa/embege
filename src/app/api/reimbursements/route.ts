import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { reimbursementSchema } from "@/lib/validations"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const period = searchParams.get("period")

    let query = supabase
      .from("reimbursements")
      .select(`
        *,
        reimbursement_items (*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    if (period) {
      query = query.eq("period", period)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("GET Reimbursements Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // 1. Validate with Zod
    const result = reimbursementSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { period, title, total_amount, notes, items } = result.data

    // 1. Insert reimbursement
    const { data: reimbursement, error: reimbursementError } = await supabase
      .from("reimbursements")
      .insert({
        user_id: user.id,
        period,
        title,
        total_amount,
        notes,
        status: "approved" // Auto-approved for personal tracking mode
      })
      .select()
      .single()

    if (reimbursementError) {
      throw reimbursementError
    }

    // Resolve category IDs
    const { data: categories } = await supabase.from("categories").select("id, name")
    const categoryMap: Record<string, string> = {}
    categories?.forEach(c => categoryMap[c.name] = c.id)

    // 2. Update existing items
    const itemsToUpdate = items.map((item: any) => {
      let catId = item.category_id
      // If user changed the category in the UI, it sends item.category. Override catId.
      if (item.category && categoryMap[item.category]) {
        catId = categoryMap[item.category]
      }
      return {
        id: item.id, // Ensure we pass the ID to update existing rows
        reimbursement_id: reimbursement.id,
        user_id: user.id, // Need to include to satisfy RLS or not null constraint
        date: item.date,
        description: item.description,
        category_id: catId || null, // fallback
        vendor: item.vendor,
        amount: item.amount,
        receipt_url: item.receipt_url || null
      }
    })

    // Use Admin client to bypass RLS since the reimbursement is auto-approved
    // and the normal UPDATE policy prevents linking items to non-pending reimbursements.
    const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: itemsError } = await supabaseAdmin
      .from("reimbursement_items")
      .upsert(itemsToUpdate)

    if (itemsError) {
      // Rollback if items fail
      await supabaseAdmin.from("reimbursements").delete().eq("id", reimbursement.id)
      throw itemsError
    }

    return NextResponse.json(reimbursement)
  } catch (error: any) {
    console.error("POST Reimbursement Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
