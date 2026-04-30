"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LoginModalProps { isOpen: boolean; onClose: () => void; }

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease: "easeOut" }} className="relative w-full max-w-md bg-[#050505] border border-white/10 rounded-2xl shadow-2xl p-8 pointer-events-auto">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-lg" aria-label="Close modal">
              <X size={20} />
            </button>
            
            <div className="text-center mb-8 mt-2">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <LogIn size={24} className="text-[#3B82F6]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to InternOS</h2>
              <p className="text-gray-400">Auth is disabled for this session. Explore freely.</p>
            </div>

            <button 
              onClick={signIn} 
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-[0.98]"
            >
              Enter Dashboard
            </button>
            
            <p className="mt-8 text-center text-xs text-gray-500 max-w-[280px] mx-auto">Accessing as guest. No account data will be permanently saved.</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
