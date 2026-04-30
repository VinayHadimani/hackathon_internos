import { NextRequest, NextResponse } from 'next/server';
import { insertCommunityJob } from '@/lib/supabase/community-jobs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Basic validation
    const requiredFields = ['title', 'company', 'location', 'job_type', 'description', 'contact_email'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Basic email validation
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(body.contact_email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contact email' },
        { status: 400 }
      );
    }

    // Parse skills if it's a string
    let skillsArray: string[] = [];
    if (typeof body.skills === 'string') {
      skillsArray = body.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    } else if (Array.isArray(body.skills)) {
      skillsArray = body.skills;
    }

    const jobData = {
      title: body.title.trim(),
      company: body.company.trim(),
      location: body.location.trim(),
      job_type: body.job_type,
      description: body.description.trim(),
      salary: body.salary?.trim() || null,
      skills: skillsArray,
      contact_email: body.contact_email.trim(),
      apply_link: body.apply_link?.trim() || null,
      duration: body.duration?.trim() || null,
    };

    const newJob = await insertCommunityJob(jobData);

    return NextResponse.json({
      success: true,
      message: 'Job posted successfully',
      job: newJob
    });
  } catch (error: any) {
    console.error('Error posting community job:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post job' },
      { status: 500 }
    );
  }
}
