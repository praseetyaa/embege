"use client";

import { useState, useEffect, use } from 'react';
import { ChevronLeft, Loader2, Package, MapPin, AlertCircle, TrendingUp, TrendingDown, Box } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ZoneDetailPage({ params }: { params: Promise<{ zona: string }> }) {
  const { zona } = use(params);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStok, setFilterStok] = useState('all');
  const [filterKategori, setFilterKategori] = useState('all');
  
  const decodedZona = decodeURIComponent(zona);

  useEffect(() => {
    fetchItems();
  }, [filterStok, filterKategori]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      let url = `/api/spareparts/zone/${encodeURIComponent(decodedZona)}?`;
      if (filterStok !== 'all') url += `stok=${filterStok}&`;
      if (filterKategori !== 'all') url += `kategori=${encodeURIComponent(filterKategori)}&`;
      
      const res = await fetch(url);
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      toast.error('Gagal mengambil detail kargo');
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(items.map(i => i.kategori_bahan).filter(Boolean)));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/tools/sparepart-mapping" className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {decodedZona === 'Unknown' ? 'Belum Dipetakan' : `Detail Zona: ${decodedZona}`}
          </h1>
          <p className="text-slate-500 mt-1">Daftar sparepart pada lokasi kargo ini</p>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="space-y-1 w-full md:w-auto">
            <label className="text-xs font-medium text-slate-500">Filter Stok</label>
            <select 
              value={filterStok}
              onChange={(e) => setFilterStok(e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              <option value="all">Semua Stok</option>
              <option value="tersedia">Stok Tersedia (&gt; 0)</option>
              <option value="kosong">Stok Kosong (0)</option>
              <option value="transit">Stok Transit</option>
            </select>
          </div>
          
          <div className="space-y-1 w-full md:w-auto">
            <label className="text-xs font-medium text-slate-500">Filter Kategori</label>
            <select 
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full md:w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat as string} value={cat as string}>{cat as string}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 whitespace-nowrap">
          Total: {items.length} item
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p>Tidak ada sparepart yang sesuai dengan filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.kode_material} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800 line-clamp-1" title={item.nama_material}>{item.nama_material}</h3>
                    {item.total_inventaris <= 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded flex items-center gap-1 shrink-0">
                        <AlertCircle className="w-3 h-3" />
                        Habis
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{item.kode_material}</span>
                    {item.kategori_bahan && (
                      <span className="text-slate-500">{item.kategori_bahan}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1"><Package className="w-3 h-3" />Sistem</span>
                  <span className="text-sm font-semibold text-slate-700">{item.stok_sistem}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1"><TrendingDown className="w-3 h-3" />Terpakai</span>
                  <span className="text-sm font-semibold text-slate-700">{item.stok_terpakai}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" />Transit</span>
                  <span className="text-sm font-semibold text-amber-600">{item.stok_transit}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1"><Box className="w-3 h-3" />Total Fisik</span>
                  <span className={`text-sm font-bold ${item.total_inventaris > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{item.total_inventaris}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">
                  Lokasi: <span className="text-slate-800">{item.lokasi_kargo || "Belum dipetakan"}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
