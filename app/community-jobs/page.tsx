'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building, MapPin, DollarSign, Clock, Users, ArrowUpRight, Search, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function CommunityJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs/community');
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch community jobs');
        }
        
        setJobs(data.jobs || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);
  
  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to remove this job posting? It will be hidden from everyone.')) return;
    setIsDeleting(jobId);
    try {
      const res = await fetch('/api/jobs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, userId: user?.id })
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting the job.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              <Users className="text-indigo-600" size={32} />
              Community Job Board
            </h1>
            <p className="mt-2 text-gray-600">
              Local internships and jobs posted directly by shop owners and startups in your community.
            </p>
          </div>
          <Link 
            href="/post-job" 
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
          >
            Post a Job (Free)
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium mb-8">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse flex flex-col sm:flex-row gap-4">
                <div className="h-16 w-16 bg-gray-200 rounded-xl"></div>
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-6 bg-gray-100 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-100 rounded-full w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No community jobs yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Be the first to post an opportunity for students in your area. It's completely free and takes 2 minutes!
            </p>
            <Link 
              href="/post-job" 
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
            >
              Post a Job Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6 relative group">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-3">
                        {job.job_type}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h2>
                      <p className="text-gray-500 font-medium flex items-center gap-1.5 mb-4">
                        <Building size={16} /> {job.company}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                      Community
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-5">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <MapPin size={16} className="text-gray-400" />
                      {job.location}
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-100 font-medium">
                        <DollarSign size={16} />
                        {job.salary}
                      </div>
                    )}
                    {job.duration && (
                      <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-100 font-medium">
                        <Clock size={16} />
                        {job.duration}
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {job.description}
                  </p>

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill: string, i: number) => (
                        <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sm:border-l border-gray-100 sm:pl-6 flex flex-col justify-center gap-3 sm:w-48">
                  <a
                    href={job.apply_link || `mailto:${job.contact_email}?subject=Application for ${job.title} via InternOS`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    Apply Now
                    <ArrowUpRight size={16} className="ml-1.5 opacity-70" />
                  </a>
                  <p className="text-xs text-gray-400 text-center">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>
                  
                  {user?.id && job.user_id === user.id && (
                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={isDeleting === job.id}
                      className="w-full mt-2 inline-flex justify-center items-center px-4 py-2 border border-red-200 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {isDeleting === job.id ? (
                        <Loader2 size={14} className="animate-spin mr-2" />
                      ) : (
                        <Trash2 size={14} className="mr-2" />
                      )}
                      Remove My Posting
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
