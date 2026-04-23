"use client"

import { useState } from "react"
import { Shield, User as UserIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  full_name: string | null
  email: string
  department: string | null
  role: string
  created_at: string
}

export function UserManager({ profiles: initialProfiles, currentUserId }: { profiles: Profile[], currentUserId: string }) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (userId === currentUserId) {
      toast.error("Tidak bisa mengubah role diri sendiri")
      return
    }

    const newRole = currentRole === "super_admin" ? "user" : "super_admin"
    const confirmMsg = newRole === "super_admin"
      ? "Yakin ingin menjadikan pengguna ini sebagai Admin?"
      : "Yakin ingin mencabut hak Admin pengguna ini?"

    if (!confirm(confirmMsg)) return

    setLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p))
      toast.success(`Role berhasil diubah menjadi ${newRole === 'super_admin' ? 'Admin' : 'User'}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah role")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kelola Pengguna</h1>
          <p className="text-slate-500">Daftar semua karyawan yang terdaftar dalam sistem</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Nama Karyawan</th>
                <th>Email</th>
                <th>Departemen</th>
                <th>Peran (Role)</th>
                <th>Tanggal Bergabung</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
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
                  <td>
                    {profile.id === currentUserId ? (
                      <span className="text-xs text-slate-400 italic">Anda</span>
                    ) : (
                      <button
                        onClick={() => handleToggleRole(profile.id, profile.role)}
                        disabled={loading === profile.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                          profile.role === "super_admin"
                            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                        }`}
                      >
                        {loading === profile.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : profile.role === "super_admin" ? (
                          <>Cabut Admin</>
                        ) : (
                          <>Jadikan Admin</>
                        )}
                      </button>
                    )}
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
