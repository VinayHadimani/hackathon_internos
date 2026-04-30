"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, MapPin, DollarSign, Calendar, Target, ExternalLink, FileEdit, Zap, Loader2, Check, Download, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseResumePDF, parseResumeText, parseResumeImage } from '@/lib/resume-parser';
import { extractSkillsFromResume } from '@/lib/ai';

interface InternshipDetail {
  id: string;
  company: string;
  title: string;
  location: string;
  stipend: string;
  duration: string;
  description: string;
  requiredSkills: string[];
  applyUrl: string;
  deadline: string;
  matchScore?: number;
  matchLabel?: string;
}

export default function InternshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, isAuthenticated, signOut } = useAuth();
  const [id, setId] = useState<string>('');
  const [internship, setInternship] = useState<InternshipDetail & { needsTranslation?: boolean; originalDescription?: string; originalTitle?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailoredResume, setTailoredResume] = useState<string | null>(null);
  const [tailoringMatchScore, setTailoringMatchScore] = useState<number>(0);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const savedResume = localStorage.getItem('resumeText');
    const lastUserId = localStorage.getItem('lastUserId');
    
    // Security: only load resume if it belongs to current user
    if (isAuthenticated && user && lastUserId && lastUserId !== user.id) {
       setResumeText(null);
    } else if (savedResume) {
       setResumeText(savedResume);
    }
  }, [isAuthenticated, user]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    setError(null);

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        const buffer = await file.arrayBuffer();
        text = await parseResumePDF(buffer);
      } else if (file.type.startsWith('image/')) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            let encoded = reader.result?.toString() || '';
            if (encoded.includes(',')) encoded = encoded.split(',')[1];
            resolve(encoded);
          };
          reader.onerror = error => reject(error);
        });
        text = await parseResumeImage(base64, file.type);
      } else {
        const rawText = await file.text();
        text = await parseResumeText(rawText);
      }
      
      if (!text || text.length < 50) {
        throw new Error('Could not extract enough text from the resume.');
      }
      
      setResumeText(text);
      localStorage.setItem('resumeText', text);
      
      // Background skills extraction
      extractSkillsFromResume(text).then(extracted => {
        localStorage.setItem('userSkills', JSON.stringify(extracted.skills || []));
        localStorage.setItem('userHardSkills', JSON.stringify(extracted.hard_skills || []));
      }).catch(console.error);

    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to process resume.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleTailorResume() {
    if (!resumeText || !internship) return;
    
    setIsTailoring(true);
    setError(null);
    try {
      console.log('=== TAILOR DEBUG (Inline) ===');
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeText,
          jobDescription: `${internship.title}\n${internship.company}\n\n${internship.description}`
        })
      });
      const data = await res.json();
      
      console.log('Tailor response:', data.success ? 'Success' : 'Failed');
      
      if (data.success && data.tailoredResume) {
        console.log('SET tailoredResume (Inline)');
        setTailoredResume(data.tailoredResume);
        setTailoringMatchScore(data.atsScore || 0);
      } else {
        setError(data.error || 'Tailoring failed');
      }
    } catch (err) {
      console.error('Tailoring failed:', err);
      setError('Failed to tailor resume');
    } finally {
      setIsTailoring(false);
    }
  }

  const handleDownloadPdf = async () => {
    if (!tailoredResume || !internship) return;
    setPdfExporting(true);
    setError(null);
    try {
      let skills: string[] = [];
      try {
        skills = JSON.parse(localStorage.getItem('userSkills') || '[]');
      } catch {
        skills = [];
      }
      const res = await fetch('/api/resume/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tailoredResume: tailoredResume,
          jobTitle: internship.title,
          skills: Array.isArray(skills) ? skills : [],
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || j.hint || 'PDF generation failed');
      }
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition');
      const m = cd?.match(/filename="([^"]+)"/);
      const filename = m?.[1] || 'Candidate_Resume.pdf';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not download PDF');
    } finally {
      setPdfExporting(false);
    }
  };

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    try {
      setLoading(true);
      const savedJobStr = sessionStorage.getItem('selectedJob');
      if (savedJobStr) {
        const item = JSON.parse(savedJobStr);
        setInternship({
          id: id,
          company: item.company || '',
          title: item.title || '',
          location: item.location || '',
          stipend: item.stipend || 'Unpaid / Not reported',
          duration: item.duration || 'Not reported',
          description: item.description || '',
          requiredSkills: item.skills || item.requiredSkills || [],
          applyUrl: item.url || item.applyUrl || '',
          deadline: item.deadline || 'Apply ASAP',
          matchScore: item.matchScore || 0,
          matchLabel: item.matchLabel || '',
          needsTranslation: item.needsTranslation || false,
          originalDescription: item.description,
          originalTitle: item.title,
        });

        if (item.needsTranslation) {
          setTranslating(true);
          Promise.all([
            fetch('/api/translate-job', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: item.title })
            }).then(r => r.json()),
            fetch('/api/translate-job', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: item.description })
            }).then(r => r.json())
          ]).then(([titleData, descData]) => {
            setInternship(prev => prev ? {
              ...prev,
              title: titleData.translated || prev.title,
              description: descData.translated || prev.description,
              needsTranslation: false
            } : prev);
          }).finally(() => {
            setTranslating(false);
          });
        }
      } else {
        setError('Job details not found. Please go back to search.');
      }
    } catch (err) {
      setError('Failed to load internship details');
      console.error('Error fetching internship:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleExternalApply = () => {
    if (internship?.applyUrl) {
      window.open(internship.applyUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-2">{error || 'Internship not found'}</p>
          <Link href="/internships" className="text-[#3B82F6] text-sm hover:underline">
            Back to Internships
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-[#1F1F1F] bg-black/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/internships" className="flex items-center gap-2 text-[#777] hover:text-white transition-colors">
              <ArrowLeft size={16} />
              Back to Internships
            </Link>
            <Link href="/" className="flex items-center font-mono">
              <span className="text-white font-bold text-lg">InternOS</span>
              <span className="text-white font-bold text-lg animate-blink">|</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 bg-white/5 border border-[#1F1F1F] rounded-full px-3 py-1.5">
                  <Zap size={14} className="text-blue-400 fill-blue-400" />
                  <span className="text-xs text-[#999]">Free Plan</span>
                </div>
                <button onClick={signOut} className="text-sm text-[#777] hover:text-white transition-colors cursor-pointer">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/" className="bg-[#3B82F6] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#2563EB] transition-colors">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-[800px] mx-auto px-6 py-10">
        {/* Company header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <span className="text-[#3B82F6] font-bold text-2xl">
              {internship.company.charAt(0)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{internship.company}</h1>
              {translating && (
                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs px-2 py-0.5 rounded-lg animate-pulse flex items-center gap-1">
                  Translating...
                </span>
              )}
            </div>
            <h2 className="text-xl text-[#777]">{internship.title}</h2>
          </div>
        </div>

        {/* Key details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[#777] text-sm mb-2">
              <MapPin size={16} />
              <span>Location</span>
            </div>
            <p className="text-white font-medium">{internship.location}</p>
          </div>

          <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[#777] text-sm mb-2">
              <DollarSign size={16} />
              <span>Stipend</span>
            </div>
            <p className="text-white font-medium">{internship.stipend}</p>
          </div>

          <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-4">
            <div className="flex items-center gap-2 text-[#777] text-sm mb-2">
              <Calendar size={16} />
              <span>Duration</span>
            </div>
            <p className="text-white font-medium">{internship.duration}</p>
          </div>
        </div>

        {/* Match score — only show if we have a real score from search */}
        {(internship.matchScore || 0) > 0 && (
          <div className="bg-gradient-to-r from-[#3B82F6]/10 to-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target size={24} className="text-[#3B82F6]" />
                <div>
                  <p className="text-[#777] text-sm">Match Score</p>
                  <p className="text-white text-sm">Based on your profile and skills</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-[#3B82F6]">{internship.matchScore || 0}%</p>
                <p className="text-[#777] text-sm">{(internship.matchScore || 0) >= 75 ? 'Excellent match' : (internship.matchScore || 0) >= 60 ? 'Good match' : (internship.matchScore || 0) >= 40 ? 'Moderate match' : 'Low match'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Job description */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Job Description</h3>
          <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6">
            <div className="text-[#999] leading-relaxed whitespace-pre-line">
              {internship.description}
            </div>
          </div>
        </div>

        {/* Required skills */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {internship.requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="bg-[#0D0D0D] border border-[#1F1F1F] text-[#999] px-3 py-1.5 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAuthenticated ? (
              <Button
                onClick={() => {
                  if (resumeText) {
                    handleTailorResume();
                    const section = document.getElementById('tailoring-section');
                    section?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    const section = document.getElementById('upload-section');
                    section?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                disabled={isTailoring}
                className="bg-[#3B82F6] text-white font-medium py-6 rounded-xl hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2"
              >
                {isTailoring ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Building Resume...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Build My Tailored Resume
                  </>
                )}
              </Button>
            ) : (
              <Link
                href="/"
                className="bg-[#3B82F6] text-white font-medium py-4 px-6 rounded-xl hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2 text-center"
              >
                <FileEdit size={20} />
                Sign in to Tailor Resume
              </Link>
            )}

            <button
              onClick={handleExternalApply}
              className="bg-[#0D0D0D] border border-[#1F1F1F] text-white font-medium py-4 px-6 rounded-xl hover:border-[#3B82F6] transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink size={20} />
              Apply Externally
            </button>
          </div>

          {/* Inline Tailoring Section */}
          {isAuthenticated && (
            <div id="tailoring-section" className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl p-8 mt-4 scroll-mt-20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-blue-400" />
                  AI Resume Tailoring
                </h3>
              </div>

              {!resumeText && (
                <div id="upload-section" className="bg-[#111] border border-dashed border-blue-500/30 p-8 rounded-2xl mb-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    {isUploading ? <Loader2 className="w-8 h-8 text-blue-500 animate-spin" /> : <Upload className="w-8 h-8 text-blue-500" />}
                  </div>
                  <h4 className="text-white font-bold mb-2">Upload your resume first</h4>
                  <p className="text-gray-400 text-sm mb-6">We need your current resume to tailor it for this role.</p>
                  
                  <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-lg cursor-pointer transition text-sm font-medium text-white">
                    <Upload className="h-4 w-4" />
                    Select File
                    <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.txt,.docx" disabled={isUploading} />
                  </label>
                  
                  {uploadError && <p className="mt-4 text-red-400 text-sm">{uploadError}</p>}
                </div>
              )}

              {resumeText && !tailoredResume && (
                <div className="space-y-4">
                  <p className="text-[#777] text-sm">
                    Our AI will analyze this job description and your resume to highlight your most relevant matching skills.
                  </p>
                  <Button
                    onClick={handleTailorResume}
                    disabled={isTailoring}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isTailoring ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing and Tailoring...
                      </>
                    ) : (
                      "Optimize My Resume for This Role"
                    )}
                  </Button>
                </div>
              )}

              {tailoredResume && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="bg-green-600/10 border border-green-600/20 text-green-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                       <Check size={14} /> ATS Score: {tailoringMatchScore}%
                    </div>
                    <Button
                      onClick={handleDownloadPdf}
                      disabled={pdfExporting}
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {pdfExporting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download PDF
                    </Button>
                  </div>
                  
                  <div className="bg-black/50 border border-gray-800 rounded-xl p-5 overflow-hidden">
                    <p className="text-xs text-[#555] mb-2">Preview</p>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
                      {tailoredResume}
                    </pre>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleDownloadPdf}
                      disabled={pdfExporting}
                      className="flex-1 bg-white text-black hover:bg-gray-200"
                    >
                      {pdfExporting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download PDF
                    </Button>
                    <Link href={`/tailor?jobId=${internship.id}&title=${encodeURIComponent(internship.title)}&company=${encodeURIComponent(internship.company)}&description=${encodeURIComponent(internship.description)}`} className="flex-1">
                      <Button variant="outline" className="w-full border-gray-700 text-gray-300">
                        View Fullscreen
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign in CTA for non-authenticated users */}
        {!isAuthenticated && (
          <div className="mt-8 bg-gradient-to-r from-blue-600/10 to-blue-500/5 border border-[#3B82F6]/20 rounded-2xl p-6 text-center">
            <p className="text-[#999] mb-3">Want AI-powered resume tailoring for this role?</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#3B82F6] font-medium hover:text-blue-400 transition-colors"
            >
              Sign in to get started
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
