import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ zona: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zona } = await params;
    const searchParams = request.nextUrl.searchParams;
    const kategori = searchParams.get('kategori');
    const stok = searchParams.get('stok'); // 'tersedia', 'kosong', 'transit'

    let query = supabase
      .from('spare_parts')
      .select('*')
      .eq('user_id', user.id)
      .eq('zona_kargo', decodeURIComponent(zona));

    if (kategori) {
      query = query.eq('kategori_bahan', kategori);
    }

    if (stok === 'tersedia') {
      query = query.gt('total_inventaris', 0);
    } else if (stok === 'kosong') {
      query = query.lte('total_inventaris', 0);
    } else if (stok === 'transit') {
      query = query.gt('stok_transit', 0);
    }

    // Sort by name
    query = query.order('nama_material', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching zone details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
