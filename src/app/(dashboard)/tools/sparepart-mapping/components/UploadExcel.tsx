"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as xlsx from 'xlsx';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function UploadExcel({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ updated: number, errors: number } | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      toast.error('File harus berupa .xlsx');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Use FileReader binary string approach - more memory efficient than arrayBuffer()
      // Also skip styles, formulas, dates to massively reduce memory usage
      const rows = await new Promise<any[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const binaryStr = e.target?.result as string;
            const workbook = xlsx.read(binaryStr, {
              type: 'binary',
              sheetRows: 10000,      // hard limit rows
              cellStyles: false,     // skip styles (saves a lot of memory)
              cellFormulas: false,   // skip formulas
              cellDates: false,      // skip date parsing
              cellNF: false,         // skip number formatting
              cellText: false,       // skip cached text
            });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet, { blankrows: false });
            resolve(data);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsBinaryString(file);
      });

      if (rows.length === 0) {
        toast.error('File Excel tidak memiliki data');
        return;
      }


      // Send only clean JSON rows to the server (no heavy file buffer)
      const res = await fetch('/api/spareparts/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, filename: file.name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat upload');
      }

      setUploadResult({ updated: data.updated, errors: data.errors });
      toast.success(`Upload berhasil: ${data.updated} item diperbarui`);
      onUploadSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Upload Inventaris</h2>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600">Memproses data...</p>
            <p className="text-xs text-slate-400 mt-1">Sedang membaca file Excel...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-10 h-10 text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-700">
              {isDragActive ? 'Lepaskan file disini' : 'Drag & drop file Excel (.xlsx) kesini'}
            </p>
            <p className="text-xs text-slate-500 mt-1">atau klik untuk memilih file</p>
          </div>
        )}
      </div>

      {uploadResult && (
        <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
          <h3 className="text-sm font-medium text-slate-800 mb-2">Ringkasan Upload</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>{uploadResult.updated} diproses</span>
            </div>
            {uploadResult.errors > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{uploadResult.errors} error</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
