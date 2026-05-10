'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Zap, Shield, Crown, RefreshCw, X } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  isSubscribing: boolean;
}

export function UpgradeModal({ isOpen, onClose, onSubscribe, isSubscribing }: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-[2rem] overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 pt-12 text-center">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
                <Crown className="text-primary w-10 h-10" fill="currentColor" />
              </div>

              <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Aura Premium</h2>
              <p className="text-muted-foreground font-medium mb-8">
                Unlock 30 days of unlimited agentic voice orchestration and premium DeFi skills.
              </p>

              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 text-left">
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border">
                    <Zap size={18} className="text-primary" fill="currentColor" />
                  </div>
                  <div>
                    <p className="font-bold uppercase text-xs tracking-wider">Unlimited Voice</p>
                    <p className="text-xs text-muted-foreground">Natural language Solana execution.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 text-left">
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border">
                    <Shield size={18} className="text-primary" fill="currentColor" />
                  </div>
                  <div>
                    <p className="font-bold uppercase text-xs tracking-wider">On-Chain Proof</p>
                    <p className="text-xs text-muted-foreground">30-day verified subscription state.</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 mb-8 border border-primary/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-widest text-primary/70">Price</span>
                  <span className="text-2xl font-black tracking-tighter">0.1 SOL</span>
                </div>
                <p className="text-[10px] text-primary/50 uppercase font-black tracking-[0.2em] text-right">Per 30 Days</p>
              </div>

              <Button 
                onClick={onSubscribe}
                disabled={isSubscribing}
                className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                {isSubscribing ? (
                  <>
                    <RefreshCw className="animate-spin mr-2" size={24} />
                    Processing...
                  </>
                ) : (
                  'Subscribe Now'
                )}
              </Button>
              
              <p className="mt-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                Transaction will create a time-bound proof on Solana.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
