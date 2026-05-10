'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletConnection } from '@solana/react-hooks';
import { useConversation } from '@elevenlabs/react';
import { toAddress, lamportsFromSol } from '@solana/client';
import { getBase64Encoder, getTransactionDecoder } from '@solana/kit';
import * as anchor from '@coral-xyz/anchor';
import { AURA_ESCROW_IDL } from '@aura/types';
import { solanaClient } from '../providers';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { UpgradeModal } from '@/components/UpgradeModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  History, 
  Zap, 
  ArrowLeft, 
  Wallet,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Layers,
  Bell,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Intent {
  action: string;
  amount: number;
  asset: string;
  to_asset?: string;
  destination?: string;
}

const MOCK_HISTORY = [
  { id: 1, title: 'Send 1 SOL to Bob', status: 'confirmed', time: '2m ago' },
  { id: 2, title: 'Swap 500 USDC for SOL', status: 'confirmed', time: '1h ago' },
  { id: 3, title: 'Check balance', status: 'completed', time: '3h ago' },
  { id: 4, title: 'Send 0.5 SOL to Alice', status: 'confirmed', time: 'Yesterday' },
];

const MOCK_PORTFOLIO = [
  { id: 'sol', name: 'Solana', ticker: 'SOL', amount: '45.2', value: '$6,200.00', change: '+2.4%', color: 'bg-indigo-500' },
  { id: 'usdc', name: 'USD Coin', ticker: 'USDC', amount: '45.2', value: '$45.20', change: '0.0%', color: 'bg-blue-500' },
];

export default function DemoPage() {
  const router = useRouter();
  const { wallet, disconnect } = useWalletConnection();
  const [history] = useState(MOCK_HISTORY);
  const [currentIntent, setCurrentIntent] = useState<Intent | null>(null);

  // Manual Action State
  const [manualAction, setManualAction] = useState<'send' | 'swap'>('send');
  const [manualAsset, setManualAsset] = useState('SOL');
  const [manualToAsset, setManualToAsset] = useState('USDC');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDestination, setManualDestination] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  // Upgrade Modal State
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handlePaySubscription = async () => {
    if (!wallet) return;

    try {
      setIsSubscribing(true);
      const connection = new anchor.web3.Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
      );
      
      const program = new anchor.Program(AURA_ESCROW_IDL as anchor.Idl, { connection } as anchor.Provider);

      const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), new anchor.web3.PublicKey(wallet.account.address).toBuffer()],
        program.programId
      );

      const treasury = new anchor.web3.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

      const instruction = await program.methods
        .paySubscription()
        .accounts({
          escrow: escrowPda,
          user: new anchor.web3.PublicKey(wallet.account.address),
          treasury: treasury,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .instruction();

      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new anchor.web3.Transaction().add(instruction);
      tx.recentBlockhash = blockhash;
      tx.feePayer = new anchor.web3.PublicKey(wallet.account.address);

      if (!wallet.sendTransaction) throw new Error('Wallet does not support sendTransaction');

      const txBytes = tx.serialize({ verifySignatures: false });
      const v2Transaction = getTransactionDecoder().decode(txBytes);
      const signature = await wallet.sendTransaction(v2Transaction as never);

      console.log('Subscription Payment Signature:', signature);
      alert('Subscription active! You can now use Aura Premium.');
      setShowUpgrade(false);
      setTimeout(() => startSession(), 2000);
    } catch (error: unknown) {
      console.error('Subscription Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Payment failed: ${errorMessage}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const startSession = async () => {
    if (!wallet) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const response = await fetch(`/api/agent/token?address=${wallet.account.address}`);
      if (response.status === 402) {
        setShowUpgrade(true);
        return;
      }
      
      if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.error || 'Failed to get session');
      }

      const { signedUrl } = await response.json();
      await conversation.startSession({ signedUrl });
      } catch (error: unknown) {      console.error('Session Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(errorMessage);
    }
  };

  const executeIntent = async (intent: Intent) => {
    if (!wallet) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsExecuting(true);
      console.log('Executing Intent:', intent);
      
      let signature;
      if (intent.action === 'send') {
        const destination = intent.destination || manualDestination;
        if (!destination) {
          alert('Please provide a destination address');
          setIsExecuting(false);
          return;
        }

        if (intent.asset.toUpperCase() === 'SOL') {
          signature = await solanaClient.solTransfer.sendTransfer({
            amount: lamportsFromSol(intent.amount),
            authority: wallet,
            destination: toAddress(destination),
          });
        } else {
          const mints: Record<string, { address: string, decimals: number }> = {
            'USDC': { address: 'EPjFWdd5AufqSSqeN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
            'DEVUSDC': { address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYJJ1qZ6qc4n', decimals: 6 },
            'JITOSOL': { address: 'J1toso9baSuLDD18akMHLv9tdEYcyfVTSEHd9k686v1', decimals: 9 }
          };

          const assetKey = intent.asset.toUpperCase();
          const mintInfo = mints[assetKey];
          const mintAddress = mintInfo?.address || intent.asset;
          const decimals = mintInfo?.decimals || 9;
          const amountBigInt = BigInt(Math.floor(intent.amount * Math.pow(10, decimals)));

          signature = await solanaClient.splToken({ mint: toAddress(mintAddress) }).sendTransfer({
            amount: amountBigInt,
            amountInBaseUnits: true,
            authority: wallet,
            destinationOwner: toAddress(destination),
          });
        }
      } else if (intent.action === 'swap') {
        const toAsset = intent.to_asset || manualToAsset;
        if (!toAsset) {
          alert('Please provide a destination asset for swap');
          setIsExecuting(false);
          return;
        }

        const quoteResponse = await fetch('/api/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'swap',
            amount: intent.amount,
            asset: intent.asset,
            to_asset: toAsset,
            from_address: wallet.account.address.toString()
          })
        });

        if (!quoteResponse.ok) {
          const errorData = await quoteResponse.json();
          throw new Error(errorData.error || 'Failed to fetch swap route');
        }

        const quote = await quoteResponse.json();
        if (!quote.transactionRequest?.data) throw new Error('LI.FI did not return a transaction to sign');

        const wireBytes = getBase64Encoder().encode(quote.transactionRequest.data);
        const transaction = getTransactionDecoder().decode(wireBytes);
        
        if (!wallet.sendTransaction) throw new Error('Wallet does not support sendTransaction');
        signature = await wallet.sendTransaction(transaction as never);
      }

      console.log('Transaction Signature:', signature);
      alert(`Success! Transaction confirmed: ${signature}`);
      setCurrentIntent(null);
    } catch (error: unknown) {
      console.error('Execution Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Execution Failed: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleManualExecute = () => {
    const intent: Intent = {
      action: manualAction,
      asset: manualAsset,
      to_asset: manualToAsset,
      amount: parseFloat(manualAmount),
      destination: manualDestination
    };
    executeIntent(intent);
  };

  const conversation = useConversation({
    onConnect: () => console.log('Connected to ElevenLabs'),
    onDisconnect: () => console.log('Disconnected from ElevenLabs'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error: unknown) => console.error('ElevenLabs Error:', error),
    clientTools: {
      trigger_solana_action: async (params: Intent) => {
        console.log('Action Triggered:', params);
        setCurrentIntent(params);
        return `Orchestrated ${params.action} for ${params.amount} ${params.asset}. Ready for execution.`;
      }
    }
  });

  const isListening = conversation.status === 'connected';
  const isSpeaking = conversation.mode === 'speaking';

  const handleToggleSession = () => {
    if (isListening) {
      conversation.endSession();
    } else {
      startSession();
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden relative selection:bg-cyan/30 selection:text-cyan">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none" />

        <UpgradeModal 
          isOpen={showUpgrade} 
          onClose={() => setShowUpgrade(false)} 
          onSubscribe={handlePaySubscription}
          isSubscribing={isSubscribing}
        />
        
        {/* Left Sidebar: History */}
        <Sidebar className="border-r border-cyan/5 bg-void/50 backdrop-blur-xl">
          <SidebarHeader className="p-8 border-b border-cyan/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                <Zap className="text-void" size={18} fill="currentColor" />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-xs">Aura Bot</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-6 space-y-10">
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <History size={14} className="text-muted-foreground" />
                  <span className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recent Actions</span>
                </div>
              </div>
              <SidebarMenu>
                {history.map((item) => (
                  <SidebarMenuItem key={item.id} className="mb-3">
                    <SidebarMenuButton className="h-auto p-4 flex flex-col items-start gap-2 rounded-2xl bg-white/[0.02] border border-cyan/5 hover:border-cyan/20 transition-all group">
                      <span className="font-bold text-xs group-hover:text-cyan transition-colors">{item.title}</span>
                      <div className="flex items-center justify-between w-full">
                        <Badge className="bg-cyan/10 text-cyan border-none text-[8px] uppercase font-black px-2 py-0.5">
                          {item.status}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">{item.time}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </section>

            <section className="pt-8 border-t border-cyan/5">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-cyan" />
                  <span className="font-black text-[10px] uppercase tracking-[0.2em] text-cyan">Manual Console</span>
                </div>
                <div className="flex bg-void rounded-full p-1 border border-cyan/10">
                  <button 
                    onClick={() => setManualAction('send')}
                    className={`px-3 py-1 text-[8px] font-black uppercase rounded-full transition-all ${manualAction === 'send' ? 'bg-cyan text-void' : 'text-muted-foreground hover:text-white'}`}
                  >
                    Send
                  </button>
                  <button 
                    onClick={() => setManualAction('swap')}
                    className={`px-3 py-1 text-[8px] font-black uppercase rounded-full transition-all ${manualAction === 'swap' ? 'bg-cyan text-void' : 'text-muted-foreground hover:text-white'}`}
                  >
                    Swap
                  </button>
                </div>
              </div>
              <div className="space-y-4 px-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Asset</span>
                    <Input 
                      value={manualAsset} 
                      onChange={(e) => setManualAsset(e.target.value)}
                      placeholder="SOL"
                      className="h-10 text-[10px] rounded-xl bg-void border-cyan/5 focus:border-cyan/30 transition-all font-bold"
                    />
                  </div>
                  {manualAction === 'swap' ? (
                    <div className="space-y-2">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">To</span>
                      <Input 
                        value={manualToAsset} 
                        onChange={(e) => setManualToAsset(e.target.value)}
                        placeholder="USDC"
                        className="h-10 text-[10px] rounded-xl bg-void border-cyan/5 focus:border-cyan/30 transition-all font-bold"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Amount</span>
                      <Input 
                        type="number"
                        value={manualAmount} 
                        onChange={(e) => setManualAmount(e.target.value)}
                        placeholder="0.0"
                        className="h-10 text-[10px] rounded-xl bg-void border-cyan/5 focus:border-cyan/30 transition-all font-bold"
                      />
                    </div>
                  )}
                </div>

                {manualAction === 'swap' && (
                  <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Amount</span>
                    <Input 
                      type="number"
                      value={manualAmount} 
                      onChange={(e) => setManualAmount(e.target.value)}
                      placeholder="0.0"
                      className="h-10 text-[10px] rounded-xl bg-void border-cyan/5 focus:border-cyan/30 transition-all font-bold"
                    />
                  </div>
                )}

                {manualAction === 'send' && (
                  <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Address</span>
                    <Input 
                      value={manualDestination} 
                      onChange={(e) => setManualDestination(e.target.value)}
                      placeholder="Recipient..."
                      className="h-10 text-[10px] rounded-xl bg-void border-cyan/5 focus:border-cyan/30 transition-all font-bold"
                    />
                  </div>
                )}

                <Button 
                  onClick={handleManualExecute} 
                  disabled={isExecuting || !manualAmount || (manualAction === 'send' && !manualDestination)}
                  className="w-full h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] mt-4 bg-cyan text-void shadow-[0_10px_20px_-5px_rgba(0,229,255,0.3)] hover:scale-[1.02] transition-all"
                >
                  {isExecuting ? <RefreshCw className="animate-spin mr-2" size={12} /> : <Zap size={12} className="mr-2" fill="currentColor" />}
                  {manualAction === 'swap' ? 'Execute Swap' : 'Execute Send'}
                </Button>
              </div>
            </section>
          </SidebarContent>
          <SidebarFooter className="p-8 border-t border-cyan/5">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-white group" onClick={() => router.push('/')}>
              <ArrowLeft size={16} className="mr-3 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative">
          <header className="h-24 flex items-center justify-between px-10 border-b border-cyan/5 backdrop-blur-xl bg-void/50 sticky top-0 z-20">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan mb-1">Status</span>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-cyan shadow-[0_0_10px_rgba(0,229,255,0.8)] animate-pulse' : 'bg-muted-foreground'}`} />
                   <span className="font-bold text-sm uppercase tracking-tight">{isListening ? 'Aura Online' : 'Aura Standby'}</span>
                </div>
              </div>
              <div className="hidden md:flex flex-col border-l border-cyan/10 pl-8">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Network</span>
                <span className="font-bold text-sm uppercase tracking-tight">Solana Devnet</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Button 
                variant="outline" 
                className="rounded-2xl border-cyan/20 bg-cyan/5 text-cyan hover:bg-cyan hover:text-void font-black text-[10px] uppercase tracking-[0.2em] h-12 px-8"
                onClick={() => wallet ? disconnect() : router.push('/')}
              >
                <Wallet size={14} className="mr-2" />
                {wallet ? `${wallet.account.address.slice(0, 4)}...${wallet.account.address.slice(-4)}` : 'Connect'}
              </Button>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                <Bell size={20} className="text-muted-foreground" />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-5xl mx-auto p-10 space-y-12">
              
              {/* Portfolio Hero */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                 <div className="glass-card p-10 flex flex-col justify-between">
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4 block">Total Portfolio Value</span>
                       <h2 className="text-6xl font-black tracking-tighter text-gradient">$6,245.20</h2>
                    </div>
                    <div className="flex items-center gap-3 mt-8">
                       <div className="px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 flex items-center gap-2">
                          <TrendingUp size={12} className="text-cyan" />
                          <span className="text-[10px] font-black text-cyan">+2.89%</span>
                       </div>
                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">vs Last 24h</span>
                    </div>
                 </div>

                 <div className="glass-card p-10 flex items-center justify-center relative overflow-hidden group cursor-pointer" onClick={handleToggleSession}>
                    <div className="absolute inset-0 bg-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <VoiceVisualizer 
                      isListening={isListening} 
                      isSpeaking={isSpeaking} 
                      onToggle={handleToggleSession}
                    />
                    <div className="absolute bottom-8 text-center">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan animate-pulse">
                         {isListening ? 'Aura is listening...' : 'Tap to start voice intent'}
                       </p>
                    </div>
                 </div>
              </section>

              {/* Portfolio List */}
              <section>
                 <div className="flex items-center justify-between mb-8 px-2">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-gradient">Your Assets</h3>
                    <Button variant="ghost" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-cyan transition-colors">View All Assets <ChevronRight size={14} className="ml-1" /></Button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {MOCK_PORTFOLIO.map(asset => (
                       <div key={asset.id} className="glass-card p-8 flex items-center justify-between group cursor-pointer">
                          <div className="flex items-center gap-5">
                             <div className={`w-14 h-14 rounded-2xl ${asset.color} flex items-center justify-center shadow-lg`}>
                                {asset.id === 'sol' ? <Zap size={24} fill="white" className="text-white" /> : <CreditCard size={24} className="text-white" />}
                             </div>
                             <div>
                                <h4 className="font-black uppercase tracking-tight text-lg">{asset.name}</h4>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{asset.ticker}</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-lg tracking-tight">{asset.amount} {asset.ticker}</p>
                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{asset.value}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </section>

              {/* Interaction Overlay (AnimatePresence for Intent) */}
              <AnimatePresence>
                {currentIntent && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-2xl bg-void/60"
                  >
                    <Card className="w-full max-w-lg border border-cyan/20 bg-void shadow-[0_0_100px_-10px_rgba(0,229,255,0.2)] rounded-[2.5rem] overflow-hidden">
                      <div className="bg-cyan p-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-void rounded-2xl flex items-center justify-center">
                            <Zap className="text-cyan" size={24} fill="currentColor" />
                          </div>
                          <h2 className="text-2xl font-black text-void uppercase tracking-tight">Intent Ready</h2>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-void/10 flex items-center justify-center">
                           <Activity size={20} className="text-void animate-pulse" />
                        </div>
                      </div>
                      <CardContent className="p-10 bg-void">
                        <div className="space-y-8">
                          <div className="flex items-center justify-between pb-6 border-b border-cyan/5">
                            <span className="text-muted-foreground uppercase font-black text-[10px] tracking-[0.2em]">Action Type</span>
                            <span className="font-black text-xl uppercase tracking-tight text-cyan">{currentIntent.action}</span>
                          </div>
                          <div className="flex items-center justify-between pb-6 border-b border-cyan/5">
                            <span className="text-muted-foreground uppercase font-black text-[10px] tracking-[0.2em]">
                              {currentIntent.action === 'swap' ? 'Pay Amount' : 'Amount'}
                            </span>
                            <span className="font-black text-xl uppercase tracking-tight">{currentIntent.amount} {currentIntent.asset}</span>
                          </div>
                          {currentIntent.action === 'swap' && currentIntent.to_asset && (
                            <div className="flex items-center justify-between pb-6 border-b border-cyan/5">
                              <span className="text-muted-foreground uppercase font-black text-[10px] tracking-[0.2em]">Receive Asset</span>
                              <span className="font-black text-xl uppercase tracking-tight text-cyan">{currentIntent.to_asset}</span>
                            </div>
                          )}
                          <div className="pt-6 space-y-4">
                            <Button 
                              className="w-full h-16 rounded-[1.5rem] text-md font-black uppercase tracking-[0.2em] bg-cyan text-void shadow-[0_15px_30px_-5px_rgba(0,229,255,0.3)] hover:scale-[1.02] transition-all"
                              onClick={() => executeIntent(currentIntent)}
                              disabled={isExecuting}
                            >
                              {isExecuting ? <RefreshCw className="animate-spin mr-2" size={20} /> : null}
                              Sign & Execute
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="w-full h-12 font-black text-muted-foreground hover:text-white uppercase text-[10px] tracking-[0.3em]"
                              onClick={() => setCurrentIntent(null)}
                              disabled={isExecuting}
                            >
                              Cancel Action
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
