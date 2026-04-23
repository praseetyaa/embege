"use client"

import { useState } from "react"
import { Plus, Edit2, Check, X, Trash2, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Category {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export function CategoryManager({ categories: initialCategories }: { categories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const resetForm = () => {
    setFormName("")
    setFormDesc("")
    setShowForm(false)
    setEditingId(null)
  }

  const handleAdd = async () => {
    if (!formName.trim()) {
      toast.error("Nama kategori wajib diisi")
      return
    }
    setLoading("add")
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, description: formDesc })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      const newCat = await res.json()
      setCategories([...categories, newCat])
      toast.success("Kategori berhasil ditambahkan!")
      resetForm()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah kategori")
    } finally {
      setLoading(null)
    }
  }

  const handleEdit = async (id: string) => {
    if (!formName.trim()) {
      toast.error("Nama kategori wajib diisi")
      return
    }
    setLoading(id)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: formName, description: formDesc })
      })
      if (!res.ok) throw new Error("Gagal memperbarui")
      setCategories(categories.map(c => c.id === id ? { ...c, name: formName, description: formDesc } : c))
      toast.success("Kategori berhasil diperbarui!")
      resetForm()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    setLoading(id)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !currentActive })
      })
      if (!res.ok) throw new Error("Gagal mengubah status")
      setCategories(categories.map(c => c.id === id ? { ...c, is_active: !currentActive } : c))
      toast.success(`Kategori ${!currentActive ? 'diaktifkan' : 'dinonaktifkan'}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kategori ini?")) return
    setLoading(id)
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      setCategories(categories.filter(c => c.id !== id))
      toast.success("Kategori berhasil dihapus")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setFormName(cat.name)
    setFormDesc(cat.description || "")
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kategori Pengeluaran</h1>
          <p className="text-slate-500">Kelola master data kategori reimbursement</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormName(""); setFormDesc("") }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah Kategori
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-6 space-y-4 animate-fade-in">
          <h3 className="font-bold text-slate-900">Tambah Kategori Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kategori *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Transportasi"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Opsional"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="btn-secondary text-sm py-2">Batal</button>
            <button
              onClick={handleAdd}
              disabled={loading === "add"}
              className="btn-primary text-sm py-2 flex items-center gap-2"
            >
              {loading === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
              {categories.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td>
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full p-1.5 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{item.name}</span>
                    )}
                  </td>
                  <td>
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        className="w-full p-1.5 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    ) : (
                      <span className="text-slate-600">{item.description || "-"}</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggle(item.id, item.is_active)}
                      disabled={loading === item.id}
                      className="cursor-pointer"
                    >
                      {item.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors">
                          <Check className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold border border-slate-200 hover:bg-slate-200 transition-colors">
                          <X className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="text-slate-600">
                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td>
                    {editingId === item.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(item.id)}
                          disabled={loading === item.id}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          {loading === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button onClick={resetForm} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={loading === item.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
