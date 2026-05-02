"use client";

import { useState, useEffect } from 'react';
import { UploadExcel } from './components/UploadExcel';
import { CargoMap } from './components/CargoMap';
import { Search, Loader2, Package, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function SparepartMappingPage() {
  const [zones, setZones] = useState([]);
  const [lastUpload, setLastUpload] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resZones = await fetch('/api/spareparts/zones');
      if (resZones.ok) {
        setZones(await resZones.json());
      }
      
      const resLogs = await fetch('/api/spareparts/upload-logs');
      if (resLogs.ok) {
        const logs = await resLogs.json();
        if (logs.length > 0) setLastUpload(logs[0]);
      }
    } catch (e) {
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/spareparts/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          setSearchResults(await res.json());
        }
      } catch (e) {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sparepart Mapping & Monitor</h1>
          <p className="text-slate-500 mt-1">Pantau lokasi dan stok sparepart per kargo.</p>
        </div>
        {lastUpload && (
          <div className="text-sm text-slate-500">
            Terakhir diupdate: <span className="font-medium text-slate-700">{new Date(lastUpload.uploaded_at).toLocaleString('id-ID')}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Upload & Search */}
        <div className="lg:col-span-1 space-y-6">
          <UploadExcel onUploadSuccess={fetchData} />

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Cari Sparepart</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Nama atau Kode Material..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
              />
              {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
            </div>

            {searchQuery.length >= 2 && (
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {searchResults.length === 0 && !isSearching && (
                  <p className="text-sm text-slate-500 text-center py-4">Tidak ada hasil ditemukan.</p>
                )}
                {searchResults.map((item: any) => (
                  <div key={item.kode_material} className="p-3 border border-slate-200 rounded-lg hover:border-emerald-300 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-slate-800 line-clamp-2" title={item.nama_material}>{item.nama_material}</p>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{item.kode_material}</p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className={item.lokasi_kargo ? "font-medium" : "text-amber-600 italic"}>
                          {item.lokasi_kargo || "Belum dipetakan"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Package className="w-3.5 h-3.5" />
                        <span className="font-medium text-emerald-600">{item.total_inventaris} unit</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Cargo Map */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Peta Kargo</h2>
              <CargoMap zones={zones} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
