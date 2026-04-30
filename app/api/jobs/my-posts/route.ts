import { NextRequest, NextResponse } from 'next/server';
import { getUserCommunityJobs } from '@/lib/supabase/community-jobs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      );
    }

    const jobs = await getUserCommunityJobs(userId);

    return NextResponse.json({
      success: true,
      jobs
    });
  } catch (error: any) {
    console.error('Error fetching user community jobs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
