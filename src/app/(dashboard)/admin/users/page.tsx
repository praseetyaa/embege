import { createClient } from "@/lib/supabase/server"
import { UserManager } from "./user-manager"

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  return <UserManager profiles={profiles || []} currentUserId={user?.id || ""} />
}
