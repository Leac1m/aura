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
  Settings, 
  Zap, 
  ArrowLeft, 
  MessageSquare, 
  Wallet,
  CheckCircle2,
  RefreshCw,
  ExternalLink
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
      
      const program = new anchor.Program(AURA_ESCROW_IDL as any, { connection } as anchor.Provider);

      const [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), new anchor.web3.PublicKey(wallet.account.address).toBuffer()],
        program.programId
      );

      // Valid treasury for demo (Aura Fee Recipient)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signature = await wallet.sendTransaction(v2Transaction as any);

      console.log('Subscription Payment Signature:', signature);
      alert('Subscription active! You can now use Aura Premium.');
      setShowUpgrade(false);
      // Wait a bit for chain to update
      setTimeout(() => startSession(), 2000);
    } catch (error: any) {
      console.error('Subscription Error:', error);
      alert(`Payment failed: ${error.message}`);
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
      } catch (error: any) {      console.error('Session Error:', error);
      alert(error.message);
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
          // Common mints for Devnet/Mainnet
          const mints: Record<string, { address: string, decimals: number }> = {
            'USDC': { 
              address: 'EPjFWdd5AufqSSqeN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet
              decimals: 6 
            },
            'DEVUSDC': { 
              address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYJJ1qZ6qc4n', // Devnet
              decimals: 6 
            },
            'JITOSOL': {
              address: 'J1toso9baSuLDD18akMHLv9tdEYcyfVTSEHd9k686v1',
              decimals: 9
            }
          };

          const assetKey = intent.asset.toUpperCase();
          const mintInfo = mints[assetKey];
          
          const mintAddress = mintInfo?.address || intent.asset;
          const decimals = mintInfo?.decimals || 9; // Default to 9
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

        console.log('Fetching LI.FI Quote...');
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
        console.log('LI.FI Quote Received:', quote);

        if (!quote.transactionRequest?.data) {
          throw new Error('LI.FI did not return a transaction to sign');
        }

        // Execute via Wallet Session
        if (!wallet.sendTransaction) {
          throw new Error('Your connected wallet does not support sending transactions directly');
        }
        
        // LI.FI returns the transaction as a base64 string in the `data` property for Solana
        const wireBytes = getBase64Encoder().encode(quote.transactionRequest.data);
        const transaction = getTransactionDecoder().decode(wireBytes);
        
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
    onError: (error) => console.error('ElevenLabs Error:', error),
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

  // Redirect if no wallet (optional, user can still see demo)
  // useEffect(() => {
  //   if (!wallet) router.push('/');
  // }, [wallet, router]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <UpgradeModal 
          isOpen={showUpgrade} 
          onClose={() => setShowUpgrade(false)} 
          onSubscribe={handlePaySubscription}
          isSubscribing={isSubscribing}
        />
        {/* Left Sidebar: History */}
        <Sidebar className="border-r border-border/50 bg-muted/30">
          <SidebarHeader className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={20} className="text-muted-foreground" />
                <span className="font-bold text-sm uppercase tracking-widest">History</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings size={16} />
              </Button>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4 space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4 px-2">
                <History size={16} className="text-muted-foreground" />
                <span className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">History</span>
              </div>
              <SidebarMenu>
                {history.map((item) => (
                  <SidebarMenuItem key={item.id} className="mb-2">
                    <SidebarMenuButton className="h-auto p-4 flex flex-col items-start gap-1 rounded-xl bg-background border border-border/50 hover:border-primary/50 transition-all">
                      <span className="font-bold text-sm">{item.title}</span>
                      <div className="flex items-center justify-between w-full">
                        <Badge variant="outline" className="text-[10px] uppercase font-black px-1.5 py-0">
                          {item.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{item.time}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </section>

            <section className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-primary" />
                  <span className="font-bold text-[10px] uppercase tracking-widest text-primary">Manual Action Test</span>
                </div>
                <div className="flex bg-muted rounded-lg p-0.5">
                  <button 
                    onClick={() => setManualAction('send')}
                    className={`px-2 py-1 text-[9px] font-black uppercase rounded-md transition-all ${manualAction === 'send' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                  >
                    Send
                  </button>
                  <button 
                    onClick={() => setManualAction('swap')}
                    className={`px-2 py-1 text-[9px] font-black uppercase rounded-md transition-all ${manualAction === 'swap' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                  >
                    Swap
                  </button>
                </div>
              </div>
              <div className="space-y-4 px-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      {manualAction === 'swap' ? 'From Asset' : 'Asset'}
                    </span>
                    <Input 
                      value={manualAsset} 
                      onChange={(e) => setManualAsset(e.target.value)}
                      placeholder="SOL"
                      className="h-9 text-xs rounded-lg bg-background border-border/50"
                    />
                  </div>
                  {manualAction === 'swap' ? (
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">To Asset</span>
                      <Input 
                        value={manualToAsset} 
                        onChange={(e) => setManualToAsset(e.target.value)}
                        placeholder="USDC"
                        className="h-9 text-xs rounded-lg bg-background border-border/50"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Amount</span>
                      <Input 
                        type="number"
                        value={manualAmount} 
                        onChange={(e) => setManualAmount(e.target.value)}
                        placeholder="0.0"
                        className="h-9 text-xs rounded-lg bg-background border-border/50"
                      />
                    </div>
                  )}
                </div>

                {manualAction === 'swap' && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Amount</span>
                    <Input 
                      type="number"
                      value={manualAmount} 
                      onChange={(e) => setManualAmount(e.target.value)}
                      placeholder="0.0"
                      className="h-9 text-xs rounded-lg bg-background border-border/50"
                    />
                  </div>
                )}

                {manualAction === 'send' && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Destination</span>
                    <Input 
                      value={manualDestination} 
                      onChange={(e) => setManualDestination(e.target.value)}
                      placeholder="Solana Address"
                      className="h-9 text-xs rounded-lg bg-background border-border/50"
                    />
                  </div>
                )}

                <Button 
                  onClick={handleManualExecute} 
                  disabled={isExecuting || !manualAmount || (manualAction === 'send' && !manualDestination)}
                  className="w-full h-10 rounded-xl font-bold uppercase tracking-widest text-[10px] mt-2 shadow-lg shadow-primary/10"
                >
                  {isExecuting ? <RefreshCw className="animate-spin mr-2" size={14} /> : <Zap size={14} className="mr-2" />}
                  {manualAction === 'swap' ? 'Test Swap' : 'Test Send'}
                </Button>
              </div>
            </section>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-border/50">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => router.push('/')}>
              <ArrowLeft size={16} className="mr-2" />
              Back to Landing
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content: Visualizer */}
        <main className="flex-1 flex flex-col relative">
          {/* Top Bar */}
          <header className="h-20 flex items-center justify-between px-8 border-b border-border/50 backdrop-blur-md bg-background/50 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="text-primary-foreground" size={18} />
                </div>
                <span className="font-black uppercase tracking-tighter">Aura Agent</span>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase font-black text-[10px]">
                Main Live 100%
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border/50">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {isListening ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <Button 
                variant={wallet ? "outline" : "default"} 
                className="rounded-full font-bold text-xs uppercase tracking-widest border-2"
                onClick={() => wallet ? disconnect() : router.push('/')}
              >
                <Wallet size={14} className="mr-2" />
                {wallet ? `${wallet.account.address.slice(0, 4)}...${wallet.account.address.slice(-4)}` : 'Connect'}
              </Button>
            </div>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <AnimatePresence mode="wait">
              {currentIntent ? (
                <motion.div
                  key="intent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-lg"
                >
                  <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/10 rounded-3xl overflow-hidden">
                    <div className="bg-primary p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className="text-primary-foreground" size={24} />
                        <h2 className="text-xl font-black text-primary-foreground uppercase tracking-tight">Intent Orchestrated</h2>
                      </div>
                      <Badge variant="secondary" className="uppercase font-black">Ready</Badge>
                    </div>
                    <CardContent className="p-8">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground uppercase font-black text-xs tracking-widest">Action</span>
                          <span className="font-bold text-lg uppercase tracking-tight">{currentIntent.action}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground uppercase font-black text-xs tracking-widest">
                            {currentIntent.action === 'swap' ? 'From Amount' : 'Amount'}
                          </span>
                          <span className="font-bold text-lg uppercase tracking-tight">{currentIntent.amount} {currentIntent.asset}</span>
                        </div>
                        {currentIntent.action === 'swap' && currentIntent.to_asset && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground uppercase font-black text-xs tracking-widest">To Asset</span>
                            <span className="font-bold text-lg uppercase tracking-tight">{currentIntent.to_asset}</span>
                          </div>
                        )}
                        <div className="pt-6 border-t">
                          <Button 
                            className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                            onClick={() => executeIntent(currentIntent)}
                            disabled={isExecuting}
                          >
                            {isExecuting ? <RefreshCw className="animate-spin mr-2" size={20} /> : null}
                            Confirm & Execute
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full mt-2 font-bold text-muted-foreground uppercase text-xs tracking-widest"
                            onClick={() => setCurrentIntent(null)}
                            disabled={isExecuting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="visualizer"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <VoiceVisualizer 
                    isListening={isListening} 
                    isSpeaking={isSpeaking} 
                    onToggle={handleToggleSession}
                  />
                  <div className="mt-20 text-center">
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mb-4">
                      {isListening ? 'Speak your intent to Aura' : 'Tap the microphone to start'}
                    </p>
                    <div className="flex items-center gap-4 justify-center">
                      <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase opacity-50 italic cursor-help" title="Try: &apos;Swap 1 SOL for USDC&apos;">
                        &quot;Swap 1 SOL for USDC&quot;
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase opacity-50 italic cursor-help" title="Try: &apos;Send 0.1 SOL to Bob&apos;">
                        &quot;Send 0.1 SOL to Bob&quot;
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Bar Controls */}
          <div className="p-8 border-t border-border/50 bg-background/50 backdrop-blur-md flex items-center justify-center gap-4">
            <Button variant="outline" className="rounded-xl font-bold uppercase tracking-widest text-xs h-12 px-6">
              <Settings size={16} className="mr-2" />
              Settings
            </Button>
            <Button variant="outline" className="rounded-xl font-bold uppercase tracking-widest text-xs h-12 px-6">
              <MessageSquare size={16} className="mr-2" />
              Voice Settings
            </Button>
          </div>
        </main>

        {/* Right Sidebar: Chat / Info */}
        <aside className="hidden lg:flex w-80 border-l border-border/50 flex-col bg-muted/10">
          <div className="p-6 border-b border-border/50">
            <h3 className="font-black text-sm uppercase tracking-widest">Network Info</h3>
          </div>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cluster</span>
              <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                <span className="font-bold text-xs uppercase">Devnet</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">LIFI Routing</span>
              <div className="p-3 bg-background rounded-xl border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase">Slippage</span>
                  <span className="text-[10px] font-black text-primary">0.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase">Speed</span>
                  <span className="text-[10px] font-black text-primary">Turbo</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-4">Latest Transaction</span>
               <Card className="border border-border/50 bg-background/50">
                 <CardContent className="p-4 flex flex-col gap-3">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                       <CheckCircle2 size={16} />
                     </div>
                     <span className="font-bold text-xs uppercase tracking-tight truncate">Swap SOL → USDC</span>
                   </div>
                   <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest h-8">
                     View on Explorer
                     <ExternalLink size={10} className="ml-1" />
                   </Button>
                 </CardContent>
               </Card>
            </div>
          </div>
          <div className="p-6 border-t border-border/50">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="w-full h-12 bg-muted/50 rounded-xl px-4 text-sm font-medium border border-transparent focus:border-primary/50 outline-none transition-all pr-12"
              />
              <Button size="icon" variant="ghost" className="absolute right-1 top-1 h-10 w-10 text-primary">
                <Zap size={18} fill="currentColor" />
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </SidebarProvider>
  );
}
