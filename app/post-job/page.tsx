'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Building, MapPin, Mail, DollarSign, Clock, Link as LinkIcon, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PostJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

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
        body: JSON.stringify(formData),
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Posted Successfully!</h2>
          <p className="text-gray-600 mb-8">
            Your job has been published to the community board and will be visible to students for the next 30 days.
          </p>
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            Redirecting to job board...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>

        <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-8 border-b border-gray-100 bg-white">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Post a Community Job</h1>
            <p className="mt-2 text-gray-600">
              Free to post. No account required. Reach talented students in your community instantly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-indigo-600" />
                  Basic Details
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Job Title *</label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      placeholder="e.g. Shop Assistant Intern"
                      className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4 border"
                      value={formData.title}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company Name *</label>
                    <div className="mt-1 relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="company"
                        id="company"
                        required
                        placeholder="Rajesh General Store"
                        className="block w-full pl-10 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 border"
                        value={formData.company}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location *</label>
                    <div className="mt-1 relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="location"
                        id="location"
                        required
                        placeholder="Mumbai, Dadar"
                        className="block w-full pl-10 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 border"
                        value={formData.location}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="job_type" className="block text-sm font-medium text-gray-700">Job Type *</label>
                    <select
                      name="job_type"
                      id="job_type"
                      required
                      className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4 border bg-white"
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
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (optional)</label>
                    <div className="mt-1 relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="duration"
                        id="duration"
                        placeholder="e.g. 3 months, flexible"
                        className="block w-full pl-10 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 border"
                        value={formData.duration}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      name="description"
                      id="description"
                      required
                      rows={5}
                      placeholder="What will the student be doing? What are the requirements?"
                      className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-4 border"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Required Skills (comma separated)</label>
                    <input
                      type="text"
                      name="skills"
                      id="skills"
                      placeholder="e.g. cash handling, basic math, excel"
                      className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4 border"
                      value={formData.skills}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compensation & Contact</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="salary" className="block text-sm font-medium text-gray-700">Salary / Stipend</label>
                    <div className="mt-1 relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="salary"
                        id="salary"
                        placeholder="e.g. ₹5,000/month or Unpaid"
                        className="block w-full pl-10 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 border"
                        value={formData.salary}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">Contact Email *</label>
                    <div className="mt-1 relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="contact_email"
                        id="contact_email"
                        required
                        placeholder="you@example.com"
                        className="block w-full pl-10 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 border"
                        value={formData.contact_email}
                        onChange={handleChange}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Students will contact you here unless an Apply Link is provided.</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="apply_link" className="block text-sm font-medium text-gray-700">Apply Link (optional)</label>
                    <div className="mt-1 relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        name="apply_link"
                        id="apply_link"
                        placeholder="e.g. https://forms.gle/... or https://yourwebsite.com/careers"
                        className="block w-full pl-10 rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 border"
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
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
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
    </div>
  );
}
