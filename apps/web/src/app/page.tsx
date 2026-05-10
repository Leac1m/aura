'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletConnection } from '@solana/react-hooks';
import { Button } from '@/components/ui/button';
import { Zap, MessageSquare, ArrowRight, Activity, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const { wallet, connect, connectors } = useWalletConnection();

  // Auto-route to demo if already connected
  useEffect(() => {
    if (wallet) {
      router.push('/demo');
    }
  }, [wallet, router]);

  const handleConnect = async () => {
    if (connectors.length > 0) {
      try {
        await connect(connectors[0].id);
      } catch (e) {
        console.error("Connection failed", e);
      }
    } else {
      alert('No Solana wallets found. Please install a wallet extension like Phantom.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505] selection:bg-cyan-500/30 selection:text-cyan-400">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" 
        />
      </div>

      <main className="relative z-10 flex flex-col items-center text-center px-6 py-20 max-w-6xl w-full text-[#F8FAF8]">
        {/* Navigation / Header */}
        <header className="fixed top-0 w-full flex items-center justify-between px-8 py-8 backdrop-blur-sm z-50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_-3px_rgba(0,229,255,0.5)]">
              <Zap className="text-black" size={24} fill="currentColor" />
            </div>
            <span className="text-2xl font-black tracking-[0.2em] uppercase text-white">Aura</span>
          </div>
          <div className="flex items-center gap-6">
             <button className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] hover:text-cyan-400 transition-colors">Vision</button>
             <button className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] hover:text-cyan-400 transition-colors">Features</button>
             <Button 
                variant="outline" 
                className="rounded-full border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500 hover:text-black font-bold text-[10px] uppercase tracking-widest h-10 px-6"
                onClick={() => router.push('/demo')}
             >
               Launch App
             </Button>
          </div>
        </header>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center mt-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Aura v2.0 Live on Devnet</span>
          </div>

          <h1 className="text-7xl md:text-[10rem] font-black tracking-[-0.04em] mb-8 leading-[0.85] text-white uppercase">
            Your Intent. <br />
            <span className="text-cyan-500 drop-shadow-[0_0_30px_rgba(0,229,255,0.3)]">Execution.</span>
          </h1>

          <p className="text-lg md:text-xl text-[#94A3B8] max-w-2xl mb-12 font-medium leading-relaxed">
            The first agentic wallet bridging natural voice to high-performance on-chain action. 
            Talk to Aura. Orchestrate Solana.
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            <Button 
              size="lg" 
              className="h-16 px-12 text-md font-black uppercase tracking-widest rounded-full bg-cyan-500 text-black shadow-[0_20px_50px_-12px_rgba(0,229,255,0.5)] hover:scale-105 transition-all duration-300"
              onClick={handleConnect}
            >
              Connect Wallet
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-16 px-12 text-md font-black uppercase tracking-widest rounded-full border-2 border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
              onClick={() => router.push('/demo')}
            >
              Demo Dash
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-40"
        >
          <FeatureCard 
            icon={<MessageSquare size={24} className="text-cyan-500" />} 
            title="Voice Intelligence" 
            description="Our advanced LLM pipeline converts speech into verifiable transaction intents instantly." 
          />
          <FeatureCard 
            icon={<Activity size={24} className="text-cyan-500" />} 
            title="LIFI Routing" 
            description="Find the best routes across Solana DEXs and bridges with real-time slippage protection." 
          />
          <FeatureCard 
            icon={<Cpu size={24} className="text-cyan-500" />} 
            title="Autonomous Ops" 
            description="Agentic intelligence with human-in-the-loop guardrails. You authorize, Aura executes." 
          />
        </motion.div>
      </main>

      <footer className="py-20 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500 text-[#F8FAF8]">
        <div className="flex items-center gap-8">
           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Solana</span>
           <span className="text-[10px] font-black uppercase tracking-[0.3em]">ElevenLabs</span>
           <span className="text-[10px] font-black uppercase tracking-[0.3em]">LI.FI</span>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#94A3B8]">
          Aura Agentic Interface • © 2026
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-cyan-500/10 rounded-3xl p-10 text-left group transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_20px_-12px_rgba(0,229,255,0.5)]">
      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-8 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500 shadow-[inset_0_0_10px_rgba(0,229,255,0.1)] group-hover:shadow-[0_0_30px_rgba(0,229,255,0.4)]">
        {icon}
      </div>
      <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter text-white group-hover:text-white transition-colors">{title}</h3>
      <p className="text-[#94A3B8] leading-relaxed font-medium group-hover:text-white/80 transition-colors">
        {description}
      </p>
    </div>
  );
}
