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
    const status = searchParams.get("status") // 'unassigned' or 'assigned' or 'all'

    let query = supabase
      .from("reimbursement_items")
      .select(`
        *,
        categories(name)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (status === 'unassigned') {
      query = query.is("reimbursement_id", null)
    } else if (status === 'assigned') {
      query = query.not("reimbursement_id", "is", null)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("GET Transactions Error:", error)
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
    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid items data" }, { status: 400 })
    }

    // Since categories are fetched as names in UI, we might need category_id
    // But currently new/page.tsx maps category names.
    // Let's find category IDs based on names if category_id is not provided.
    const { data: categories } = await supabase.from("categories").select("id, name")
    const categoryMap: Record<string, string> = {}
    categories?.forEach(c => categoryMap[c.name] = c.id)

    const itemsToInsert = items.map((item: any) => {
      // Find category ID by name if category_id is missing but category (name) is present
      let catId = item.category_id
      if (!catId && item.category && categoryMap[item.category]) {
        catId = categoryMap[item.category]
      }

      return {
        user_id: user.id,
        date: item.date,
        description: item.description,
        category_id: catId || null,
        vendor: item.vendor,
        amount: Number(item.amount),
        receipt_url: item.receipt_url || null
      }
    })

    const { data, error } = await supabase
      .from("reimbursement_items")
      .insert(itemsToInsert)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("POST Transactions Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
