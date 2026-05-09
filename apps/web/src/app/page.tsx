'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletConnection } from '@solana/react-hooks';
import { Button } from '@/components/ui/button';
import { Shield, Zap, MessageSquare, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const { wallet, connect, connectors } = useWalletConnection();

  // useEffect(() => {
  //   if (wallet) {
  //     router.push('/demo');
  //   }
  // }, [wallet, router]);

  const handleConnect = () => {
    // If we have connectors, just pick the first one for simplicity or show a modal.
    // For this demo, we'll just use the first available connector.
    if (connectors.length > 0) {
      connect(connectors[0].id);
    } else {
      alert('No Solana wallets found. Please install a wallet extension like Phantom.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="text-primary-foreground" size={28} />
          </div>
          <span className="text-3xl font-black tracking-tighter uppercase">Aura</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9]"
        >
          YOUR INTENT. <br />
          <span className="text-primary">SOLANA'S EXECUTION.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed"
        >
          The first agentic wallet bridging natural voice to high-performance on-chain action. 
          Talk to Aura. Orchestrate Solana. Execute with one signature.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-20"
        >
          <Button size="lg" className="h-16 px-10 text-lg font-bold rounded-2xl shadow-2xl shadow-primary/20" onClick={handleConnect}>
            <Wallet className="mr-2" />
            Connect Wallet
          </Button>
          <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-bold rounded-2xl border-2" onClick={() => router.push('/demo')}>
            View Demo Dashboard
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full border-t pt-20"
        >
          <FeatureCard 
            icon={<MessageSquare className="text-primary" />} 
            title="Voice to Intent" 
            description="Our advanced LLM pipeline converts speech into verifiable transaction intents instantly." 
          />
          <FeatureCard 
            icon={<Zap className="text-primary" />} 
            title="LIFI Orchestration" 
            description="Find the best routes across Solana DEXs and bridges with real-time slippage protection." 
          />
          <FeatureCard 
            icon={<Shield className="text-primary" />} 
            title="Secure Escrow" 
            description="Agentic intelligence with human-in-the-loop guardrails. You authorize, Aura executes." 
          />
        </motion.div>
      </main>

      <footer className="absolute bottom-8 text-sm text-muted-foreground font-medium uppercase tracking-widest">
        Aura Agentic Wallet • Powered by Solana & ElevenLabs
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center md:items-start text-center md:text-left group">
      <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">{title}</h3>
      <p className="text-muted-foreground leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}
