import { createClient } from "@/lib/supabase/server"
import { CategoryManager } from "./category-manager"

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true })

  return <CategoryManager categories={categories || []} />
}
