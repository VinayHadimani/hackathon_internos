'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, ArrowLeft, Sparkles, Target, FileText, Check, Upload } from 'lucide-react';
import Link from 'next/link';
import { parseResumePDF, parseResumeText, parseResumeImage } from '@/lib/resume-parser';
import { extractSkillsFromResume } from '@/lib/ai';

/**
 * Component to highlight keywords in the resume text
 */
function HighlightedResume({ text, keywords }: { text: string; keywords: string[] }) {
  if (!keywords || keywords.length === 0) return <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300 leading-relaxed">{text}</pre>;

  // Create a regex to match any of the keywords
  // Escape keywords for regex
  const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  
  const parts = text.split(regex);

  return (
    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-300 leading-relaxed">
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-blue-500/20 text-blue-300 px-0.5 rounded font-bold border-b border-blue-500/30">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </pre>
  );
}

function TailorContent() {
  const searchParams = useSearchParams();

  const [job, setJob] = useState<any>(null);
  const [resumeText, setResumeText] = useState('');
  const [tailoredResume, setTailoredResume] = useState('');
  const [keywordsMatched, setKeywordsMatched] = useState<string[]>([]);
  const [atsScore, setAtsScore] = useState(0);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [isIrrelevant, setIsIrrelevant] = useState(false);
  const [relevanceReason, setRelevanceReason] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const jobId = searchParams.get('jobId');
    const title = searchParams.get('title');
    const company = searchParams.get('company');
    const description = searchParams.get('description');

    if (jobId && title) {
      setJob({
        id: jobId,
        title: title,
        company: company || 'Unknown Company',
        description: description || ''
      });
    } else {
      const jobData = sessionStorage.getItem('selectedJob');
      if (jobData) {
        try {
          setJob(JSON.parse(jobData));
        } catch (e) {
          console.error('Failed to parse selectedJob:', e);
        }
      }
    }
    
    const resume = localStorage.getItem('resumeText');
    if (resume) {
      setResumeText(resume);
    }
  }, [searchParams]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    setError('');

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
      localStorage.setItem('resumeTimestamp', String(Date.now()));
      
      // Background skills extraction (don't block the UI)
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
    if (!resumeText) {
      setError('No resume found. Please upload your resume first.');
      return;
    }
    
    if (!job) {
      setError('No job selected. Please select a job first.');
      return;
    }
    
    setIsTailoring(true);
    setError('');
    
    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeText,
          jobDescription: `Title: ${job.title}
Company: ${job.company || ''}
Location: ${job.location || ''}
${job.skills?.length ? 'Required Skills: ' + job.skills.join(', ') : ''}
${job.url ? 'Apply URL: ' + job.url : ''}

JOB DESCRIPTION:
${job.description || ''}`
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.tailoredResume) {
        setTailoredResume(data.tailoredResume);
        setKeywordsMatched(data.keywordsMatched || []);
        setAtsScore(data.atsScore || 85);
        setIsIrrelevant(false);
        setRelevanceReason('');
      } else if (data.isIrrelevant) {
        setIsIrrelevant(true);
        setRelevanceReason(data.reason || 'This job does not match your professional profile.');
      } else {
        setError(data.error || 'Failed to tailor resume');
      }
    } catch (err: any) {
      console.error('Tailor error:', err);
      setError(err.message || 'Failed to tailor resume');
    } finally {
      setIsTailoring(false);
    }
  }

  const handleDownloadPDF = async () => {
    if (!tailoredResume) return;

    setIsExporting(true);
    setError('');
    try {
      let skills: string[] = [];
      try {
        skills = JSON.parse(localStorage.getItem('userSkills') || '[]');
      } catch {
        skills = [];
      }

      const res = await fetch('/api/download-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tailoredResume,
          jobTitle: job?.title,
          skills: Array.isArray(skills) ? skills : [],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.hint || `PDF failed (${res.status})`);
      }

      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition');
      const m = cd?.match(/filename="([^"]+)"/);
      const filename = m?.[1] || `Candidate_Resume.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error('PDF Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  if (!job) {
    return (
      <div className="container py-8 max-w-4xl mx-auto min-h-screen text-white">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 mb-6 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          <FileText className="text-blue-400" />
          Paste Job Description
        </h1>
        
        {!resumeText && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">1. Upload Your Resume</h2>
            <Card className="border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
              <CardContent className="py-10 text-center">
                <label className="cursor-pointer flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                    {isUploading ? <Loader2 className="w-8 h-8 text-blue-400 animate-spin" /> : <Upload className="w-8 h-8 text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{isUploading ? 'Processing Resume...' : 'Click to Upload Resume'}</p>
                    <p className="text-gray-400 text-sm mt-1">Upload your base resume to start tailoring</p>
                  </div>
                  <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.txt,.docx" disabled={isUploading} />
                </label>
                {uploadError && <p className="mt-4 text-red-400 text-sm">{uploadError}</p>}
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-gray-800 bg-[#0D0D0D]">
          <CardContent className="pt-6 flex flex-col gap-4">
            <p className="text-gray-400 text-sm mb-2">Paste the details of the internship or job you want to apply for, and our AI will tailor your resume to match it.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Job Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  placeholder="e.g. Frontend Engineering Intern"
                  className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Company <span className="text-gray-600">(Optional)</span></label>
                <input 
                  type="text" 
                  value={manualCompany}
                  onChange={e => setManualCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Job Description <span className="text-red-500">*</span></label>
              <textarea 
                value={manualDescription}
                onChange={e => setManualDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors resize-y min-h-[200px]"
              />
            </div>

            <Button 
              disabled={!manualTitle || !manualDescription || !resumeText}
              onClick={() => {
                setJob({
                  id: 'manual',
                  title: manualTitle,
                  company: manualCompany || 'Unknown Company',
                  description: manualDescription
                });
              }}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl text-lg transition-all active:scale-[0.98]"
            >
              Set Target Job & Tailor Resume
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto min-h-screen text-white">
      <Link href="/internships" className="flex items-center gap-2 text-gray-400 mb-6 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to jobs
      </Link>

      <Card className="mb-6 border-gray-800 bg-[#0D0D0D]">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Selected Target
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{job.title}</h2>
              <p className="text-[#777] font-medium">{job.company}</p>
            </div>
            <Badge variant="outline" className="border-gray-800 text-gray-400">Target Role</Badge>
          </div>
          {job.description && (
            <div className="mt-4 p-4 bg-black/40 rounded-xl border border-gray-800/50 text-sm text-gray-400 leading-relaxed italic">
              "{job.description.substring(0, 300)}..."
            </div>
          )}
        </CardContent>
      </Card>

      {!resumeText && (
        <div className="mb-8">
          <Card className="border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
            <CardContent className="py-12 text-center">
              <label className="cursor-pointer flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  {isUploading ? <Loader2 className="w-8 h-8 text-blue-400 animate-spin" /> : <Upload className="w-8 h-8 text-blue-400" />}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{isUploading ? 'Processing Resume...' : 'Upload Resume to Start Tailoring'}</p>
                  <p className="text-gray-400 text-sm mt-1">We need your resume to know what to tailor.</p>
                </div>
                <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.txt,.docx" disabled={isUploading} />
              </label>
              {uploadError && <p className="mt-4 text-red-400 text-sm">{uploadError}</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {!tailoredResume && (
        <div className="flex flex-col gap-4 items-center">
          <Button 
            onClick={handleTailorResume} 
            disabled={isTailoring || !resumeText}
            size="lg"
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 text-lg transition-all active:scale-[0.98]"
          >
            {isTailoring ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Engineering Your Future...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-3" />
                Tailor My Resume with AI
              </>
            )}
          </Button>
          {isTailoring && (
            <p className="text-sm text-blue-400 animate-pulse flex items-center gap-2">
              Our AI is aligning your experience with {job.company}'s requirements...
            </p>
          )}
        </div>
      )}

      {isIrrelevant && (
        <Alert className="mt-4 border-orange-600/30 bg-orange-900/10 text-orange-500 rounded-xl">
          <AlertDescription>
            <div className="font-bold mb-1">Relevance Warning:</div>
            {relevanceReason}
            <div className="mt-2 text-xs opacity-70">Our AI thinks this job is not a good match for your current background. You may still try to apply, but a strong match is unlikely.</div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4 rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {tailoredResume && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-blue-900/20 bg-[#0D0D0D] overflow-hidden">
            <CardHeader className="border-b border-gray-800/50 bg-black/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Check className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">Optimized Success</CardTitle>
                    <p className="text-xs text-blue-400/70 font-mono uppercase tracking-widest">Job Readiness: {atsScore}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleDownloadPDF} 
                    disabled={isExporting}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold px-8 py-6 rounded-xl transition-all"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Tailored Resume (PDF)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-8 bg-black/40">
                {keywordsMatched.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    <span className="text-xs text-[#777] uppercase tracking-tighter self-center mr-2">Optimized For:</span>
                    {keywordsMatched.map(k => (
                      <Badge key={k} className="bg-blue-500/10 text-blue-400 border-blue-500/20 capitalize font-medium">
                        {k}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="bg-[#050505] border border-gray-800/50 rounded-2xl p-8 shadow-2xl relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <FileText className="w-20 h-20 text-white" />
                  </div>
                  <p className="text-xs text-[#555] uppercase tracking-wider mb-3">Preview</p>
                  <HighlightedResume text={tailoredResume} keywords={keywordsMatched} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-2xl">
            <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Final Step
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed font-medium capitalize">
              Download the professionally laid-out PDF (ReportLab, two-column A4). Use that file for applications—not a plain-text export.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TailorPage() {
  return (
    <div className="bg-[#050505] min-h-screen">
      <Suspense fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      }>
        <TailorContent />
      </Suspense>
    </div>
  );
}
