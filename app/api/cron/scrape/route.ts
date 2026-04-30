import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const secret = request.headers.get('x-cron-secret');
  const expected = process.env.CRON_SECRET;

  if (!expected) return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  if (secret !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const results = { 
    scraped: 0, 
    added: 0, 
    updated: 0, 
    skipped: 0, 
    errors: [] as string[], 
    sources: {} as Record<string, number>, 
    duration: 0 
  };
  
  const allInternships: Array<{
    title:string;
    company:string;
    location:string;
    stipend:string;
    duration:string;
    description:string;
    skills:string[];
    apply_url:string;
    deadline:string;
    source:string
  }> = [];

  // Run Internshala scraper
  try {
    const { scrapeInternshala } = await import('@/lib/scrapers/internshala');
    const data = await scrapeInternshala(undefined, 3);
    for (const item of data) {
      allInternships.push({ 
        title: item.title, 
        company: item.company, 
        location: item.location, 
        stipend: item.stipend, 
        duration: item.duration, 
        description: item.description, 
        skills: item.skills, 
        apply_url: item.applyUrl, 
        deadline: item.deadline, 
        source: 'internshala' 
      });
    }
    results.sources.internshala = data.length;
  } catch (error) { 
    results.errors.push(`Internshala: ${error instanceof Error ? error.message : 'Failed'}`); 
  }

  // Run LinkedIn scraper
  try {
    const { scrapeLinkedIn } = await import('@/lib/scrapers/linkedin');
    const data = await scrapeLinkedIn('internship');
    for (const item of data) {
      allInternships.push({ 
        title: item.title, 
        company: item.company, 
        location: item.location, 
        stipend: item.stipend, 
        duration: item.duration, 
        description: item.description, 
        skills: item.skills, 
        apply_url: item.applyUrl, 
        deadline: item.deadline, 
        source: 'linkedin' 
      });
    }
    results.sources.linkedin = data.length;
  } catch (error) { 
    results.errors.push(`LinkedIn: ${error instanceof Error ? error.message : 'Failed'}`); 
  }

  results.scraped = allInternships.length;

  // Save to database (upsert logic)
  if (allInternships.length > 0) {
    const supabase = await createClient();
    for (const internship of allInternships) {
      try {
        const { data: existing } = await (supabase as any)
          .from('internships')
          .select('id, deadline')
          .eq('title', internship.title)
          .eq('company', internship.company)
          .eq('apply_url', internship.apply_url);

        if (existing && existing.length > 0) {
          if (existing[0].deadline !== internship.deadline) {
            await (supabase as any).from('internships').update({ 
              deadline: internship.deadline, 
              location: internship.location, 
              stipend: internship.stipend, 
              description: internship.description, 
              skills: internship.skills, 
              is_active: true, 
              updated_at: new Date().toISOString() 
            }).eq('id', existing[0].id);
            results.updated++;
          } else { 
            results.skipped++; 
          }
        } else {
          await (supabase as any).from('internships').insert({ 
            ...internship, 
            is_active: true, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          });
          results.added++;
        }
      } catch { 
        results.errors.push(`Save failed: ${internship.title}`); 
      }
    }

    // Deactivate old (30+ days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await (supabase as any).from('internships').update({ is_active: false }).lt('created_at', thirtyDaysAgo).eq('is_active', true);
  }

  results.duration = Date.now() - startTime;
  return NextResponse.json({ 
    success: true, 
    message: 'Scrape completed', 
    ...results, 
    timestamp: new Date().toISOString() 
  });
}
