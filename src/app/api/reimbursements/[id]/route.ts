import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const p = await params
    const { data, error } = await supabase
      .from("reimbursements")
      .select(`
        *,
        reimbursement_items (*, categories (*)),
        profiles (full_name, department, bank_name, bank_account)
      `)
      .eq("id", p.id)
      .eq("user_id", user.id) // Ensure user can only read their own
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("GET Reimbursement Detail Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify it's pending and belongs to user
    const p = await params
    const { data: existing, error: verifyError } = await supabase
      .from("reimbursements")
      .select("status, user_id")
      .eq("id", p.id)
      .single()

    if (verifyError || !existing) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 })
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (existing.status !== "pending") {
      return NextResponse.json({ error: "Can only update pending reimbursements" }, { status: 400 })
    }

    const body = await request.json()
    // Update logic would go here. For simplicity in Phase 3, we might recreate items.
    
    return NextResponse.json({ message: "Not implemented yet" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const p = await params
    const { error } = await supabase
      .from("reimbursements")
      .delete()
      .eq("id", p.id)
      .eq("user_id", user.id)
      .eq("status", "pending") // Only allow deleting pending

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
