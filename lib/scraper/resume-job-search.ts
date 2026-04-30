import { callAI } from '@/lib/rotating-ai'
import { aggregateJobs } from '../aggregator'
import { calculateMatchScore } from '../matching/skills'
import { createAdminClient } from '../supabase/admin'

// Step 1: Extract search terms from resume
export async function extractSearchTerms(
  resumeText: string
): Promise<{
  skills: string[]
  roleTypes: string[]
  experience: string
  searchQueries: string[]
}> {
  try {
    const response = await callAI(
    `Analyze this resume and extract job search terms.
        Return ONLY valid JSON, no markdown, no explanation.
        Format:
        {
          "skills": ["skill1", "skill2"],
          "roleTypes": ["Frontend Developer", "Full Stack"],
          "experience": "fresher|junior|mid|senior",
          "searchQueries": [
            "React developer intern",
            "Frontend intern",
            "Full stack intern"
          ]
        }
        searchQueries should be 3-5 specific search terms
        based on their strongest skills and experience. Ensure the searchQueries are highly relevant to the candidate's core competencies to ensure accurate job results. Include variations (e.g. "Software Engineer intern", "Software Developer intern").`,
    resumeText,
    {
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    }
  )

  if (!response.success || !response.content) {
    throw new Error(response.error || "No content returned from AI")
  }
  
    const text = response.content
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {
      skills: [],
      roleTypes: [],
      experience: 'fresher',
      searchQueries: ['software developer intern']
    }
  }
}

// Step 2: Search jobs based on resume
export async function searchJobsForResume(
  resumeText: string
): Promise<{
  jobs: any[]
  searchTerms: any
}> {

  // Extract what to search for
  const searchTerms = await extractSearchTerms(resumeText)

  // Run aggregator for each search query
  const allJobs: any[] = []

  for (const query of searchTerms.searchQueries) {
    try {
      const jobs = await aggregateJobs(query)
      allJobs.push(...jobs)

      // Small delay between searches
      await new Promise(r => setTimeout(r, 1000))
    } catch (error) {
      console.error(`Search failed for: ${query}`)
    }
  }

  // Deduplicate by title + company
  const seen = new Set()
  const uniqueJobs = allJobs.filter(job => {
    const key = `${job.title}-${job.company}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    jobs: uniqueJobs,
    searchTerms
  }
}

// Step 3: Rank jobs against resume
export async function rankJobsForResume(
  resumeText: string,
  jobs: any[],
  userSkills: string[],
  experienceLevel: string,
  userId?: string
): Promise<any[]> {

  // Use your existing matching algorithm
  const rankedJobs = jobs.map(job => {

    // Extract required skills from job
    const jobSkills = job.skills ||
                      job.tags ||
                      extractSkillsFromText(job.description || '')

    // Calculate match score using the matching algorithm
    const matchScore = calculateMatchScore(userSkills, jobSkills)

    return {
      ...job,
      matchScore,
      matchLabel: getMatchLabel(matchScore)
    }
  })

  const sortedJobs = rankedJobs.sort((a, b) => b.matchScore - a.matchScore)

  // Persist ranked results if userId is provided
  if (userId) {
    const supabase = createAdminClient();

    const insertions = sortedJobs.map(job => ({
      user_id: userId,
      internship_id: job.id,
      match_score: job.matchScore,
    }));

    // Batch insert into user_internships
    const { error } = await (supabase as any)
      .from('user_internships')
      .insert(insertions);

    if (error) {
      console.error('[Rank Jobs] Error persisting results:', error);
    }
  }

  return sortedJobs;
}

// Helper: extract skills from job text
function extractSkillsFromText(text: string): string[] {
  const commonSkills = [
    // Languages
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin', 'R', 'Dart', 'SQL',
    // Frontend
    'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Sass', 'Less',
    // Backend & DB
    'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'ASP.NET', 'Laravel', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API',
    // Cloud & DevOps
    'AWS', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'GitLab', 'CI/CD', 'Linux', 'Terraform', 'Azure', 'GCP',
    // Domains
    'Machine Learning', 'Data Science', 'Data Analytics', 'Computer Vision', 'NLP', 'Blockchain', 'Web3', 'Cybersecurity', 'UI/UX', 'Figma', 'Marketing', 'Excel', 'PowerPoint', 'Product Management', 'Project Management', 'Business Analyst'
  ]

  return commonSkills.filter(skill => {
    // Use word boundaries to avoid partial matches (e.g., 'Go' matching 'Good')
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i');
    return regex.test(text);
  })
}

// Helper: get match label from score
function getMatchLabel(score: number): string {
  if (score >= 80) return 'Excellent Match'
  if (score >= 60) return 'Good Match'
  if (score >= 40) return 'Moderate Match'
  return 'Low Match'
}
