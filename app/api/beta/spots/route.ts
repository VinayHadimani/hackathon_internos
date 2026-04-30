import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BETA_CONFIG } from '@/constants/beta';

export async function GET() {
  try {
    const supabase = await createClient();
    const { count } = await (supabase as any).from('profiles').select('*', { count: 'exact', head: true });
    const spotsLeft = Math.max(0, BETA_CONFIG.BETA_USER_LIMIT - (count || 0));
    return NextResponse.json({ spotsLeft, total: BETA_CONFIG.BETA_USER_LIMIT });
  } catch {
    return NextResponse.json({ spotsLeft: BETA_CONFIG.BETA_USER_LIMIT });
  }
}
