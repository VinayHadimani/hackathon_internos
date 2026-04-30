import { NextResponse } from 'next/server';
import { getActiveCommunityJobs } from '@/lib/supabase/community-jobs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const jobs = await getActiveCommunityJobs();

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length
    });
  } catch (error: any) {
    console.error('Error fetching community jobs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
