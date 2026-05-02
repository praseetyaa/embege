import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse Excel
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Assuming the first row is headers
    const rawData = xlsx.utils.sheet_to_json(worksheet) as any[];
    
    let updatedItems = 0;
    let errorCount = 0;
    
    const recordsToUpsert = [];

    for (const row of rawData) {
      try {
        const kode_material = row['Kode Material'] || row['Material Code'] || row['kode_material'];
        if (!kode_material) continue;
        
        recordsToUpsert.push({
          user_id: user.id,
          kode_material: String(kode_material).trim(),
          nama_material: String(row['Nama Material'] || row['Material Name'] || row['nama_material'] || ''),
          kategori_bahan: String(row['Kategori Bahan'] || row['Material Category'] || row['kategori_bahan'] || ''),
          jenis_inventaris: String(row['Jenis Inventaris'] || row['Inventory Type'] || row['jenis_inventaris'] || ''),
          model_berlaku: String(row['Model Berlaku'] || row['Applicable Model'] || row['model_berlaku'] || ''),
          lokasi_kargo: String(row['Informasi Kargo'] || row['Cargo Info'] || row['lokasi_kargo'] || ''),
          stok_sistem: Number(row['Stok Sistem'] || row['System Stock'] || row['stok_sistem']) || 0,
          stok_terpakai: Number(row['Stok Terpakai'] || row['Used Stock'] || row['stok_terpakai']) || 0,
          stok_transit: Number(row['Stok Transit'] || row['Transit Stock'] || row['stok_transit']) || 0,
          total_inventaris: Number(row['Total Inventaris'] || row['Total Inventory'] || row['total_inventaris']) || 0,
          harga_ritel: Number(row['Harga Ritel'] || row['Retail Price'] || row['harga_ritel']) || 0,
          last_updated: new Date().toISOString()
        });
      } catch (e) {
        errorCount++;
      }
    }

    if (recordsToUpsert.length === 0) {
      return NextResponse.json({ error: 'No valid data found in file' }, { status: 400 });
    }

    // Insert in batches
    const batchSize = 500;
    for (let i = 0; i < recordsToUpsert.length; i += batchSize) {
      const batch = recordsToUpsert.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('spare_parts')
        .upsert(batch, { onConflict: 'user_id,kode_material' });

      if (error) {
        console.error('Error upserting batch:', error);
        errorCount += batch.length;
      } else {
        updatedItems += batch.length;
      }
    }

    // Log upload
    const { data: logData, error: logError } = await supabase
      .from('upload_logs')
      .insert({
        user_id: user.id,
        filename: file.name,
        total_rows: rawData.length,
        new_items: 0,
        updated_items: updatedItems,
        error_count: errorCount,
        status: errorCount === 0 ? 'success' : 'partial'
      })
      .select('id')
      .single();

    return NextResponse.json({
      new: 0,
      updated: updatedItems,
      errors: errorCount,
      log_id: logData?.id
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
