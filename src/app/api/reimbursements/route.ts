import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const { period, title, total_amount, notes, items } = body

    if (!period || !title || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. Insert reimbursement
    const { data: reimbursement, error: reimbursementError } = await supabase
      .from("reimbursements")
      .insert({
        user_id: user.id,
        period,
        title,
        total_amount,
        notes,
        status: "pending" // Initial status when submitted
      })
      .select()
      .single()

    if (reimbursementError) {
      throw reimbursementError
    }

    // 2. Insert items
    const itemsToInsert = items.map((item: any) => ({
      reimbursement_id: reimbursement.id,
      date: item.date,
      description: item.description,
      category_id: item.category_id,
      vendor: item.vendor,
      amount: item.amount,
      receipt_url: item.receipt_url
    }))

    const { error: itemsError } = await supabase
      .from("reimbursement_items")
      .insert(itemsToInsert)

    if (itemsError) {
      // Rollback if items fail (Supabase REST doesn't have transactions yet, but we should handle it better ideally via RPC)
      await supabase.from("reimbursements").delete().eq("id", reimbursement.id)
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
