"use client";

import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";

interface ZoneData {
  zona: string;
  total_items: number;
  stok_total: number;
  categories: string[];
}

export function CargoMap({ zones }: { zones: ZoneData[] }) {
  const maxItems = Math.max(...zones.map(z => z.total_items), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {zones.map((zone) => (
        <Link key={zone.zona} href={`/tools/sparepart-mapping/${encodeURIComponent(zone.zona)}`}>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    {zone.zona === 'Unknown' ? 'Belum Dipetakan' : `Zona ${zone.zona}`}
                  </h3>
                  <p className="text-sm text-slate-500">{zone.total_items} jenis item</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>

            <div className="space-y-4 mt-auto">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Kapasitas (Relatif)</span>
                  <span>{Math.round((zone.total_items / maxItems) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                    style={{ width: `${(zone.total_items / maxItems) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Total Stok: <span className="font-semibold text-slate-700">{zone.stok_total.toLocaleString('id-ID')}</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {zone.categories.slice(0, 3).map(cat => (
                    <span key={cat} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium border border-slate-200">
                      {cat}
                    </span>
                  ))}
                  {zone.categories.length > 3 && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] rounded-md font-medium border border-slate-200">
                      +{zone.categories.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}

      {zones.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
          Belum ada data kargo. Silakan upload file Excel.
        </div>
      )}
    </div>
  );
}
