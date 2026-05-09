'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletConnection } from '@solana/react-hooks';
import { useConversation } from '@elevenlabs/react';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { Button } from '@/components/ui/button';
import { 
  History, 
  Settings, 
  Zap, 
  ArrowLeft, 
  MessageSquare, 
  Wallet,
  CheckCircle2,
  RefreshCw,
  MoreVertical,
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
  const [currentIntent, setCurrentIntent] = useState<any>(null);

  const conversation = useConversation({
    onConnect: () => console.log('Connected to ElevenLabs'),
    onDisconnect: () => console.log('Disconnected from ElevenLabs'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('ElevenLabs Error:', error),
    clientTools: {
      trigger_solana_action: async (params: any) => {
        console.log('Action Triggered:', params);
        setCurrentIntent(params);
        return `Orchestrated ${params.action} for ${params.amount} ${params.asset}. Ready for execution.`;
      }
    }
  });

  const isListening = conversation.status === 'connected';
  const isSpeaking = conversation.mode === 'speaking';

  const startSession = async () => {
    try {
      const response = await fetch('/api/agent/token');
      const { signedUrl } = await response.json();
      await conversation.startSession({ signedUrl });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

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
          <SidebarContent className="p-4">
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
                          <span className="text-muted-foreground uppercase font-black text-xs tracking-widest">Amount</span>
                          <span className="font-bold text-lg uppercase tracking-tight">{currentIntent.amount} {currentIntent.asset}</span>
                        </div>
                        <div className="pt-6 border-t">
                          <Button className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                            Confirm & Execute
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full mt-2 font-bold text-muted-foreground uppercase text-xs tracking-widest"
                            onClick={() => setCurrentIntent(null)}
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
                      <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase opacity-50 italic cursor-help" title="Try: 'Swap 1 SOL for USDC'">
                        "Swap 1 SOL for USDC"
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1 text-[10px] font-black uppercase opacity-50 italic cursor-help" title="Try: 'Send 0.1 SOL to Bob'">
                        "Send 0.1 SOL to Bob"
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
