import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const twoMinutesAgo = new Date();
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);

    const { data, error } = await supabase
      .from('resumes')
      .delete()
      .lt('updated_at', twoMinutesAgo.toISOString())
      .select();

    if (error) return NextResponse.json({ error: 'Failed to cleanup resumes' }, { status: 500 });
    return NextResponse.json({ success: true, deletedCount: data?.length || 0 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
