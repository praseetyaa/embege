import { createClient } from "@/lib/supabase/server"
import { Users, Shield, User as UserIcon } from "lucide-react"

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola Pengguna</h1>
          <p className="text-slate-500">Daftar semua karyawan yang terdaftar dalam sistem</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Nama Karyawan</th>
                <th>Email</th>
                <th>Departemen</th>
                <th>Peran (Role)</th>
                <th>Tanggal Bergabung</th>
              </tr>
            </thead>
            <tbody>
              {profiles?.map((profile: any) => (
                <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                  <td className="font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {profile.full_name?.charAt(0) || "U"}
                    </div>
                    {profile.full_name || "Belum diisi"}
                  </td>
                  <td className="text-slate-600">{profile.email}</td>
                  <td className="text-slate-600">{profile.department || '-'}</td>
                  <td>
                    {profile.role === "super_admin" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200">
                        <UserIcon className="w-3 h-3" /> User
                      </span>
                    )}
                  </td>
                  <td className="text-slate-600">
                    {new Date(profile.created_at).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
