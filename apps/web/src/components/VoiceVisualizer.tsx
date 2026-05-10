'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, PhoneOff } from 'lucide-react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
}

export function VoiceVisualizer({ isListening, isSpeaking, onToggle }: VoiceVisualizerProps) {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Animated Rings */}
      <AnimatePresence>
        {isListening && (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-64 h-64 bg-primary rounded-full"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.8, opacity: 0.05 }}
              exit={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              className="absolute w-64 h-64 bg-primary rounded-full"
            />
          </>
        )}
      </AnimatePresence>

      {/* Main Avatar / Visualizer */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.05, 1] : 1,
          rotate: isListening ? 360 : 0
        }}
        transition={{
          scale: { duration: 0.5, repeat: Infinity },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" }
        }}
        className="relative w-64 h-64 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-2xl flex items-center justify-center overflow-hidden"
      >
        {/* Swirling Waves Effect */}
        <div className="absolute inset-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
        
        {/* Pulse Button Overlay */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggle}
          className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl text-primary"
        >
          {isListening ? <PhoneOff size={32} /> : <Mic size={32} />}
        </motion.button>
      </motion.div>

      {/* Status Badge */}
      <motion.div
        initial={false}
        animate={{ y: isListening ? 40 : 20, opacity: 1 }}
        className="mt-8 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm tracking-widest uppercase"
      >
        {isSpeaking ? 'Aura Speaking' : isListening ? 'Aura Listening' : 'Aura Offline'}
      </motion.div>
    </div>
  );
}
