'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Building, MapPin, Mail, DollarSign, Clock, Link as LinkIcon, CheckCircle2, ArrowLeft, Loader2, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    job_type: 'Internship',
    description: '',
    salary: '',
    skills: '',
    contact_email: '',
    apply_link: '',
    duration: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchMyPosts();
    }
  }, [user]);

  const fetchMyPosts = async () => {
    if (!user?.id) return;
    setIsLoadingPosts(true);
    try {
      const res = await fetch(`/api/jobs/my-posts?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setMyPosts(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to remove this job posting?')) return;
    setIsDeleting(jobId);
    try {
      const res = await fetch('/api/jobs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, userId: user?.id })
      });
      const data = await res.json();
      if (data.success) {
        setMyPosts(prev => prev.filter(j => j.id !== jobId));
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/jobs/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, userId: user?.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post job');
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/community-jobs');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0D0D0D] rounded-2xl shadow-2xl border border-white/10 p-8 text-center">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Job Posted Successfully!</h2>
          <p className="text-gray-400 mb-8">
            Your job has been published to the community board and will be visible to students for the next 30 days.
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-400">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm font-medium">Redirecting to board...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(120% 100% at 50% -10%, #0A1128 0%, #030303 60%, #030303 100%)' }} />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/selection" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Back to Selection
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#0D0D0D] shadow-2xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-8 border-b border-white/5 bg-gradient-to-r from-blue-600/5 to-transparent">
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Post a Community Job</h1>
                <p className="mt-2 text-gray-400">
                  Reach talented students in your community instantly. Free during beta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Basic Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Briefcase size={20} className="text-blue-500" />
                      Basic Details
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label htmlFor="title" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Job Title *</label>
                        <input
                          type="text"
                          name="title"
                          id="title"
                          required
                          placeholder="e.g. Shop Assistant Intern"
                          className="mt-1 block w-full rounded-xl bg-black/50 border border-white/10 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3.5 px-4 outline-none transition-all"
                          value={formData.title}
                          onChange={handleChange}
                        />
                      </div>

                      <div>
                        <label htmlFor="company" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Company Name *</label>
                        <div className="mt-1 relative rounded-xl">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building className="h-4 w-4 text-gray-500" />
                          </div>
                          <input
                            type="text"
                            name="company"
                            id="company"
                            required
                            placeholder="Rajesh General Store"
                            className="block w-full pl-10 rounded-xl bg-black/50 border border-white/10 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3.5 outline-none transition-all"
                            value={formData.company}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="location" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Location *</label>
                        <div className="mt-1 relative rounded-xl">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-4 w-4 text-gray-500" />
                          </div>
                          <input
                            type="text"
                            name="location"
                            id="location"
                            required
                            placeholder="Mumbai, Dadar"
                            className="block w-full pl-10 rounded-xl bg-black/50 border border-white/10 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3.5 outline-none transition-all"
                            value={formData.location}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Job Description</h3>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="job_type" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Job Type *</label>
                        <select
                          name="job_type"
                          id="job_type"
                          required
                          className="mt-1 block w-full rounded-xl bg-black/50 border border-white/10 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3.5 px-4 outline-none transition-all"
                          value={formData.job_type}
                          onChange={handleChange}
                        >
                          <option value="Internship">Internship</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Freelance">Freelance</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="duration" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Duration (optional)</label>
                        <div className="mt-1 relative rounded-xl">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Clock className="h-4 w-4 text-gray-500" />
                          </div>
                          <input
                            type="text"
                            name="duration"
                            id="duration"
                            placeholder="e.g. 3 months, flexible"
                            className="block w-full pl-10 rounded-xl bg-black/50 border border-white/10 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3.5 outline-none transition-all"
                            value={formData.duration}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="description" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description *</label>
                        <textarea
                          name="description"
                          id="description"
                          required
                          rows={5}
                          placeholder="What will the student be doing? What are the requirements?"
                          className="mt-1 block w-full rounded-xl bg-black/50 border border-white/10 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-4 outline-none transition-all resize-none"
                          value={formData.description}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="skills" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Required Skills (comma separated)</label>
                        <input
                          type="text"
                          name="skills"
                          id="skills"
                          placeholder="e.g. cash handling, basic math, excel"
                          className="mt-1 block w-full rounded-xl bg-black/50 border border-white/10 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3.5 px-4 outline-none transition-all"
                          value={formData.skills}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Compensation & Contact</h3>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="salary" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Salary / Stipend</label>
                        <div className="mt-1 relative rounded-xl">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                          </div>
                          <input
                            type="text"
                            name="salary"
                            id="salary"
                            placeholder="e.g. ₹5,000/month or Unpaid"
                            className="block w-full pl-10 rounded-xl bg-black/50 border border-white/10 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3.5 outline-none transition-all"
                            value={formData.salary}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="contact_email" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contact Email *</label>
                        <div className="mt-1 relative rounded-xl">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-gray-500" />
                          </div>
                          <input
                            type="email"
                            name="contact_email"
                            id="contact_email"
                            required
                            placeholder="you@example.com"
                            className="block w-full pl-10 rounded-xl bg-black/50 border border-white/10 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3.5 outline-none transition-all"
                            value={formData.contact_email}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="apply_link" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Apply Link (optional)</label>
                        <div className="mt-1 relative rounded-xl">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LinkIcon className="h-4 w-4 text-gray-500" />
                          </div>
                          <input
                            type="url"
                            name="apply_link"
                            id="apply_link"
                            placeholder="e.g. https://forms.gle/..."
                            className="block w-full pl-10 rounded-xl bg-black/50 border border-white/10 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-3.5 outline-none transition-all"
                            value={formData.apply_link}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        Publishing Job...
                      </>
                    ) : (
                      'Post Community Job'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-green-500" />
                My Postings
              </h2>
              
              <div className="space-y-4">
                {isLoadingPosts ? (
                  <div className="flex flex-col items-center py-12 text-gray-500">
                    <Loader2 className="animate-spin mb-2" />
                    <p className="text-sm">Loading your posts...</p>
                  </div>
                ) : myPosts.length > 0 ? (
                  myPosts.map((job) => (
                    <motion.div 
                      key={job.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-xl border ${job.status === 'deleted' ? 'border-red-900/20 bg-red-900/5 opacity-50' : 'border-white/5 bg-white/[0.02]'} group relative`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-white font-bold text-sm truncate max-w-[150px]">{job.title}</h4>
                          <p className="text-gray-500 text-xs">{job.company}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${job.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {job.status}
                            </span>
                            <span className="text-[10px] text-gray-600">
                              {new Date(job.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {job.status === 'active' && (
                          <button
                            onClick={() => handleDelete(job.id)}
                            disabled={isDeleting === job.id}
                            className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Remove posting"
                          >
                            {isDeleting === job.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                    <Briefcase className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No jobs posted yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6">
              <h3 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                <AlertCircle size={16} />
                Beta Notice
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Posts are active for 30 days. You can remove them at any time. For support, contact support@internos.ai
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
