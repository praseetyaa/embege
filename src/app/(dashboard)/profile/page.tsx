import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "./profile-form"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Profil Pengguna</h1>
        <p className="text-slate-500">Kelola informasi data diri dan rekening bank Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
            <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-md mx-auto mb-4 overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-blue-600 font-bold">{profile?.full_name?.charAt(0) || "U"}</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{profile?.full_name}</h2>
            <p className="text-slate-500 mb-4">{profile?.role === "super_admin" ? "Super Admin" : "Karyawan"}</p>
            
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Akun Aktif
            </span>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="md:col-span-2">
          <ProfileForm profile={profile} />
        </div>
      </div>
    </div>
  )
}
