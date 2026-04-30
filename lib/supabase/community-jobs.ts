import { createAdminClient } from './admin'

export interface CommunityJob {
  id?: string
  title: string
  company: string
  location: string
  job_type: string
  description: string
  salary?: string
  skills?: string[]
  contact_email: string
  apply_link?: string
  duration?: string
  status?: string
  created_at?: string
  expires_at?: string
  user_id?: string
}

export async function insertCommunityJob(jobData: CommunityJob) {
  const supabase = createAdminClient()
  
  // Set expires_at to 30 days from now if not provided
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)
  
  const { data, error } = await supabase
    .from('community_jobs')
    .insert([
      {
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        job_type: jobData.job_type,
        description: jobData.description,
        salary: jobData.salary || null,
        skills: jobData.skills || [],
        contact_email: jobData.contact_email,
        apply_link: jobData.apply_link || null,
        duration: jobData.duration || null,
        expires_at: expiresAt.toISOString(),
        status: 'active',
        user_id: jobData.user_id || null
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error inserting community job:', error)
    throw new Error(error.message)
  }

  return data
}

export async function getActiveCommunityJobs(): Promise<CommunityJob[]> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('community_jobs')
    .select('*')
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching community jobs:', error)
    return []
  }

  return data || []
}

export async function searchCommunityJobs(query: string, location?: string): Promise<CommunityJob[]> {
  const supabase = createAdminClient()
  
  let dbQuery = supabase
    .from('community_jobs')
    .select('*')
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())

  if (query && query !== 'internship') {
    // Use ilike for simple keyword matching across title, company, and description
    dbQuery = dbQuery.or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`)
  }

  // We skip strict location filtering in the database query to ensure 
  // community jobs aren't hidden by broad location terms (like "India").
  // The search pipeline's scoring logic will handle proximity ranking.

  const { data, error } = await dbQuery
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error searching community jobs:', error)
    return []
  }

  return data || []
}
export async function getUserCommunityJobs(userId: string): Promise<CommunityJob[]> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('community_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user community jobs:', error)
    return []
  }

  return data || []
}

export async function deleteCommunityJob(jobId: string, userId?: string) {
  const supabase = createAdminClient()
  
  let query = supabase
    .from('community_jobs')
    .update({ status: 'deleted' })
    .eq('id', jobId)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query.select()

  if (error) {
    console.error('Error deleting community job:', error)
    throw new Error(error.message)
  }

  return data
}
