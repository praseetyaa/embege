import { createClient } from "@/lib/supabase/server"
import { Plus, Edit2, Check, X } from "lucide-react"

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  // Fetch all categories (not just active)
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategori Pengeluaran</h1>
          <p className="text-slate-500">Kelola master data kategori reimbursement</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Nama Kategori</th>
                <th>Deskripsi</th>
                <th>Status</th>
                <th>Tanggal Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories?.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="font-bold text-slate-900">{item.name}</td>
                  <td className="text-slate-600">{item.description}</td>
                  <td>
                    {item.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                        <Check className="w-3 h-3" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold border border-slate-200">
                        <X className="w-3 h-3" /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="text-slate-600">
                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td>
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center p-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
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
