'use client';

import { motion } from 'framer-motion';
import { Search, PlusCircle, ArrowRight, Briefcase, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function SelectionPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(120% 100% at 50% -10%, #0A1128 0%, #030303 60%, #030303 100%)' }} />
      
      <div className="relative z-10 max-w-4xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 border border-blue-500/30 bg-blue-500/[0.08] rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={14} className="text-blue-400" />
            <span className="text-[13px] text-blue-300 font-medium">Welcome to InternOS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">How would you like to proceed?</h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto">Choose your path to get started with our AI-powered internship ecosystem.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Option 1: Job Seeker */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/dashboard" className="group block h-full">
              <div className="bg-gradient-to-b from-[#111] to-[#050505] border border-white/10 rounded-3xl p-8 h-full flex flex-col items-center text-center transition-all duration-300 hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(37,99,235,0.15)] hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="text-blue-500" />
                </div>
                
                <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Search size={40} className="text-blue-500" />
                </div>
                
                <h2 className="text-2xl font-bold mb-3">I'm a Job Seeker</h2>
                <p className="text-gray-400 mb-8 flex-grow">
                  Search for internships, use AI to tailor your resume, and track your applications in one place.
                </p>
                
                <div className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  Find Internships
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Option 2: Employer / Community Poster */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/post-job" className="group block h-full">
              <div className="bg-gradient-to-b from-[#111] to-[#050505] border border-white/10 rounded-3xl p-8 h-full flex flex-col items-center text-center transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="text-purple-500" />
                </div>

                <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <PlusCircle size={40} className="text-purple-500" />
                </div>
                
                <h2 className="text-2xl font-bold mb-3">I'm an Employer</h2>
                <p className="text-gray-400 mb-8 flex-grow">
                  Post an internship or job opening to our community board and reach thousands of talented students.
                </p>
                
                <div className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  Post a Job
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 flex items-center justify-center gap-8 text-gray-500 text-sm"
        >
          <div className="flex items-center gap-2">
            <Briefcase size={16} />
            <span>10,000+ Opportunities</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>5,000+ Active Students</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
