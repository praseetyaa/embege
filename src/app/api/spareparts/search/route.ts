import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabase
      .from('spare_parts')
      .select('kode_material, nama_material, lokasi_kargo, zona_kargo, total_inventaris, kategori_bahan, stok_sistem, stok_terpakai, stok_transit')
      .eq('user_id', user.id)
      .or(`nama_material.ilike.%${q}%,kode_material.ilike.%${q}%`)
      .limit(20);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error searching spareparts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
