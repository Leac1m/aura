'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Settings, 
  Zap, 
  ChevronLeft, 
  Mic,
  MicOff,
  Send,
  X,
  Activity,
  RefreshCw,
  Bell,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Intent {
  action: string;
  amount: number;
  asset: string;
  to_asset?: string;
  destination?: string;
}

interface ChatMessage {
  id: string;
  source: 'user' | 'ai' | 'system';
  message: string;
}

export default function DemoPage() {
  const router = useRouter();
  const { wallet, connect, connectors, disconnect } = useWalletConnection();
  
  // Layout State
  const [showTools, setShowTools] = useState(true);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', source: 'ai', message: 'Hello. I am Aura. Connect your wallet and tell me what you would like to do on Solana.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Execution State
  const [currentIntent, setCurrentIntent] = useState<Intent | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [extraRecipient, setExtraRecipient] = useState('');

  // Manual Action State
  const [manualAction, setManualAction] = useState<'send' | 'swap'>('send');
  const [manualAsset, setManualAsset] = useState('SOL');
  const [manualToAsset, setManualToAsset] = useState('USDC');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDestination, setManualDestination] = useState('');

  // Upgrade Modal State
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const addSystemMessage = (msg: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), source: 'system', message: msg }]);
  };

  const handleHeaderConnect = async () => {
    if (connectors.length > 0) {
      try {
        await connect(connectors[0].id);
      } catch (e) {
        console.error("Connection failed", e);
      }
    } else {
      alert('No Solana wallets found.');
    }
  };

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

      addSystemMessage(`Subscription active! Signature: ${signature.slice(0,8)}...`);
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
      } catch (error: unknown) {
      console.error('Session Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addSystemMessage(`Connection Error: ${errorMessage}`);
    }
  };

  const executeIntent = async (intent: Intent) => {
    if (!wallet) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsExecuting(true);
      addSystemMessage(`Executing ${intent.action}...`);
      
      let signature;
      if (intent.action === 'send') {
        const destination = intent.destination || extraRecipient || manualDestination;
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

        addSystemMessage(`Fetching LI.FI Route for ${intent.amount} ${intent.asset} to ${toAsset}...`);
        
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

      addSystemMessage(`Transaction Confirmed! Signature: ${signature}`);
      setCurrentIntent(null);
      setExtraRecipient('');
    } catch (error: unknown) {
      console.error('Execution Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addSystemMessage(`Execution Failed: ${errorMessage}`);
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

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    if (isListening) {
      // Send to ElevenLabs Agent
      conversation.sendUserMessage(chatInput);
      // We add it to the local UI immediately
      setMessages(prev => [...prev, { id: Date.now().toString(), source: 'user', message: chatInput.trim() }]);
      setChatInput('');
    } else {
      // Offline fallback
      setMessages(prev => [...prev, { id: Date.now().toString(), source: 'user', message: chatInput.trim() }]);
      setChatInput('');
      addSystemMessage('Aura is offline. Connect voice to chat with the agent.');
    }
  };

  const conversation = useConversation({
    onConnect: () => addSystemMessage('Connected to ElevenLabs voice server.'),
    onDisconnect: () => addSystemMessage('Disconnected from voice server.'),
    onMessage: (message: { message: string, source: string }) => {
      // Add agent message to chat history
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        source: message.source === 'user' ? 'user' : 'ai', 
        message: message.message 
      }]);
    },
    onError: (error: unknown) => {
      const errMsg = error instanceof Error ? error.message : 'Unknown ElevenLabs error';
      addSystemMessage(`Voice Error: ${errMsg}`);
    },
    clientTools: {
      trigger_solana_action: async (params: Intent) => {
        addSystemMessage(`Tool Called: trigger_solana_action`);
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
    <div className="flex h-screen w-full bg-[#050505] text-[#F8FAF8] overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-400">
      
      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        onSubscribe={handlePaySubscription}
        isSubscribing={isSubscribing}
      />

      {/* Top Header Bar */}
      <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 border-b border-cyan-500/10 bg-[#050505]/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-muted-foreground hover:text-cyan-400 px-2" onClick={() => router.push('/')}>
            <ChevronLeft size={18} className="mr-1" /> Back
          </Button>
          <div className="h-4 w-[1px] bg-cyan-500/20" />
          <Button 
            variant="ghost" 
            className={`px-3 ${showTools ? 'text-cyan-400 bg-cyan-500/10' : 'text-muted-foreground hover:text-white'}`}
            onClick={() => setShowTools(!showTools)}
          >
            <Layers size={16} className="mr-2" /> Manual Console
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-bold tracking-widest uppercase text-xs text-muted-foreground hidden md:inline">Aura Agent</span>
          <div className="h-4 w-[1px] bg-cyan-500/20 hidden md:block" />
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-black text-[10px] tracking-widest hidden md:flex">
            Main Live 100%
          </Badge>
        </div>

        <div className="flex items-center gap-4">
           {wallet ? (
             <Button variant="outline" className="border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500 hover:text-black font-bold text-xs uppercase tracking-widest rounded-full h-8 px-4" onClick={disconnect}>
               {wallet.account.address.slice(0, 4)}...{wallet.account.address.slice(-4)}
             </Button>
           ) : (
             <Button className="bg-cyan-500 text-black hover:bg-cyan-400 font-bold text-xs uppercase tracking-widest rounded-full h-8 px-4" onClick={handleHeaderConnect}>
               Connect Wallet
             </Button>
           )}
           <Button variant="ghost" className="text-muted-foreground hover:text-cyan-400 px-2">
             <Settings size={16} className="mr-2" /> <span className="hidden md:inline">Voice Settings</span>
           </Button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex w-full h-full pt-16 relative">
        
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Left Sidebar: Manual Tools (Replacing History) */}
        <AnimatePresence>
          {showTools && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full border-r border-cyan-500/10 bg-[#050505]/50 backdrop-blur-md flex flex-col z-10 overflow-y-auto no-scrollbar"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-xs uppercase tracking-[0.2em] text-cyan-500">Manual Tools</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setShowTools(false)}>
                    <X size={14} />
                  </Button>
                </div>
                
                {/* Manual Console Section */}
                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 shadow-xl">
                   <div className="flex bg-void rounded-full p-1 border border-cyan-500/10 mb-6">
                      <button 
                        onClick={() => setManualAction('send')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-full transition-all ${manualAction === 'send' ? 'bg-cyan-500 text-black' : 'text-dim hover:text-white'}`}
                      >
                        Send
                      </button>
                      <button 
                        onClick={() => setManualAction('swap')}
                        className={`flex-1 py-2 text-[10px] font-black uppercase rounded-full transition-all ${manualAction === 'swap' ? 'bg-cyan-500 text-black' : 'text-dim hover:text-white'}`}
                      >
                        Swap
                      </button>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-dim ml-1">Asset</span>
                        <Input 
                          value={manualAsset} 
                          onChange={(e) => setManualAsset(e.target.value)}
                          placeholder="SOL"
                          className="h-12 text-xs rounded-2xl bg-void border-white/10 focus:border-cyan-500/30 transition-all font-bold"
                        />
                      </div>

                      {manualAction === 'swap' && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-dim ml-1">To Asset</span>
                          <Input 
                            value={manualToAsset} 
                            onChange={(e) => setManualToAsset(e.target.value)}
                            placeholder="USDC"
                            className="h-12 text-xs rounded-2xl bg-void border-white/10 focus:border-cyan-500/30 transition-all font-bold"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-dim ml-1">Amount</span>
                        <Input 
                          type="number"
                          value={manualAmount} 
                          onChange={(e) => setManualAmount(e.target.value)}
                          placeholder="0.0"
                          className="h-12 text-xs rounded-2xl bg-void border-white/10 focus:border-cyan-500/30 transition-all font-bold"
                        />
                      </div>

                      {manualAction === 'send' && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-dim ml-1">Recipient</span>
                          <Input 
                            value={manualDestination} 
                            onChange={(e) => setManualDestination(e.target.value)}
                            placeholder="Address..."
                            className="h-12 text-xs rounded-2xl bg-void border-white/10 focus:border-cyan-500/30 transition-all font-bold"
                          />
                        </div>
                      )}

                      <Button 
                        onClick={handleManualExecute} 
                        disabled={isExecuting || !manualAmount || (manualAction === 'send' && !manualDestination)}
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs mt-6 bg-cyan-500 text-black shadow-[0_15px_30px_-5px_rgba(0,229,255,0.3)] hover:scale-[1.02] transition-all"
                      >
                        {isExecuting ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Zap size={16} className="mr-2" fill="currentColor" />}
                        {manualAction === 'swap' ? 'Execute Swap' : 'Execute Send'}
                      </Button>
                   </div>
                </div>

                <div className="mt-10 pt-10 border-t border-white/5 opacity-50 italic text-[10px] text-center text-dim uppercase tracking-widest leading-relaxed">
                   Manual controls bypass the voice agent for rapid testing of routing and security.
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center Panel: Main Interaction */}
        <main className="flex-1 flex flex-col relative items-center justify-center">
          
          <div className="flex-1 w-full flex items-center justify-center">
            {/* The Voice Orb */}
            <motion.div 
              className="relative cursor-pointer group"
              onClick={handleToggleSession}
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <VoiceVisualizer 
                isListening={isListening} 
                isSpeaking={isSpeaking} 
                onToggle={handleToggleSession}
              />
            </motion.div>
          </div>

          {/* Bottom Center Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/5 border border-white/10 backdrop-blur-xl p-2 rounded-full shadow-2xl">
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-white h-10 w-10">
              <Settings size={18} />
            </Button>
            <Button 
              className={`rounded-full px-8 flex items-center gap-2 font-black uppercase tracking-widest text-[10px] h-10 ${isListening ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-cyan-500 text-black hover:bg-cyan-400'}`}
              onClick={handleToggleSession}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              {isListening ? 'Stop Agent' : 'Start Agent'}
            </Button>
          </div>

          {/* Intent Modal Overlay (Appears over center when intent is ready) */}
          <AnimatePresence>
            {currentIntent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="absolute z-40 bg-[#0A0A0A] border border-cyan-500/20 shadow-[0_0_80px_rgba(0,229,255,0.2)] rounded-[2.5rem] p-10 w-[450px]"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center shadow-[inset_0_0_10px_rgba(0,229,255,0.2)]">
                      <Zap className="text-cyan-400" size={24} />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Action Ready</h2>
                  </div>
                  <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 bg-cyan-400/5 px-3 py-1 text-[10px]">VERIFIED</Badge>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-dim">Operation</span>
                    <span className="text-lg font-black uppercase text-cyan-400 tracking-tight">{currentIntent.action}</span>
                  </div>
                  <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-dim">Details</span>
                    <span className="text-lg font-black uppercase text-white tracking-tight">{currentIntent.amount} {currentIntent.asset} {currentIntent.to_asset ? `→ ${currentIntent.to_asset}` : ''}</span>
                  </div>

                  {/* Manual Recipient Input if missing */}
                  {currentIntent.action === 'send' && !currentIntent.destination && (
                    <div className="p-5 bg-cyan-500/5 rounded-2xl border border-cyan-500/20 space-y-3">
                       <span className="text-[10px] uppercase font-black tracking-[0.2em] text-cyan-400 ml-1">Missing Recipient Address</span>
                       <Input 
                         value={extraRecipient} 
                         onChange={e => setExtraRecipient(e.target.value)}
                         placeholder="Enter Solana Address..."
                         className="h-12 bg-void border-cyan-500/20 focus:border-cyan-400 transition-all font-bold text-xs rounded-xl"
                       />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <Button 
                    className="w-full h-16 rounded-2xl text-md font-black uppercase tracking-widest bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_15px_40px_-5px_rgba(0,229,255,0.3)] transition-all active:scale-95"
                    onClick={() => executeIntent(currentIntent)}
                    disabled={isExecuting || (currentIntent.action === 'send' && !currentIntent.destination && !extraRecipient)}
                  >
                    {isExecuting ? <RefreshCw className="animate-spin mr-2" size={20} /> : <Send size={20} className="mr-2" />}
                    Confirm & Execute
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 text-[10px] font-black uppercase tracking-[0.3em] text-dim hover:text-white"
                    onClick={() => {
                      setCurrentIntent(null);
                      setExtraRecipient('');
                    }}
                    disabled={isExecuting}
                  >
                    Cancel Action
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>

        {/* Right Sidebar: Chat / Transcription */}
        <aside className="w-96 h-full border-l border-cyan-500/10 bg-[#050505]/50 backdrop-blur-md flex flex-col z-10">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar text-white/90">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.source === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.source === 'system' ? (
                  <div className="w-full flex items-center justify-center my-4">
                    <span className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-cyan-400 text-center mx-auto block w-fit">
                      {msg.message}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      {msg.source === 'ai' && <Activity size={10} className="text-cyan-400" />}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${msg.source === 'user' ? 'text-muted-foreground' : 'text-cyan-400'}`}>
                        {msg.source === 'user' ? 'You' : 'Aura'}
                      </span>
                    </div>
                    <div className={`max-w-[90%] p-5 rounded-2xl text-sm leading-relaxed shadow-lg ${
                      msg.source === 'user' 
                        ? 'bg-white/10 text-white rounded-tr-sm' 
                        : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-50 rounded-tl-sm'
                    }`}>
                      {msg.message}
                    </div>
                  </>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-8 border-t border-cyan-500/10 bg-black/20">
            <div className="relative">
              <div className="flex items-center gap-2 bg-white/5 rounded-full border border-white/10 px-6 focus-within:border-cyan-500/50 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type an address or command..." 
                  className="flex-1 h-14 bg-transparent text-sm font-medium outline-none text-white placeholder:text-dim"
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-10 w-10 text-cyan-400 hover:bg-cyan-500/20 rounded-full shrink-0"
                  onClick={handleSendMessage}
                >
                  <Send size={18} />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-4 px-3">
                 <div className="flex gap-6">
                    <button className="text-[10px] font-black uppercase text-dim hover:text-cyan-400 transition-colors flex items-center gap-2"><Mic size={14}/> Voice</button>
                    <button className="text-[10px] font-black uppercase text-dim hover:text-cyan-400 transition-colors flex items-center gap-2"><Settings size={14}/> Config</button>
                 </div>
                 <Bell size={14} className="text-dim hover:text-white transition-colors cursor-pointer" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
