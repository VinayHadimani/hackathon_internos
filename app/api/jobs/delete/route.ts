import { NextRequest, NextResponse } from 'next/server';
import { deleteCommunityJob } from '@/lib/supabase/community-jobs';

export async function POST(req: NextRequest) {
  try {
    const { jobId, userId } = await req.json();

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Missing jobId' },
        { status: 400 }
      );
    }

    // We pass userId to ensure users can only delete their own posts
    await deleteCommunityJob(jobId, userId);

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting community job:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete job' },
      { status: 500 }
    );
  }
}
