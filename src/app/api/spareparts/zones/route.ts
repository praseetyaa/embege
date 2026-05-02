import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('spare_parts')
      .select('zona_kargo, kategori_bahan, total_inventaris')
      .eq('user_id', user.id);

    if (error) throw error;

    const zonesMap: Record<string, any> = {};

    data.forEach((item) => {
      const z = item.zona_kargo || 'Unknown';
      if (!zonesMap[z]) {
        zonesMap[z] = {
          zona: z,
          total_items: 0,
          stok_total: 0,
          categories: new Set<string>()
        };
      }
      zonesMap[z].total_items += 1;
      zonesMap[z].stok_total += item.total_inventaris || 0;
      if (item.kategori_bahan) {
        zonesMap[z].categories.add(item.kategori_bahan);
      }
    });

    const result = Object.values(zonesMap).map((z: any) => ({
      ...z,
      categories: Array.from(z.categories)
    })).sort((a, b) => a.zona.localeCompare(b.zona));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching zones:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
