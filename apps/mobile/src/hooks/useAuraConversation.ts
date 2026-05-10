import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useConversation } from "@elevenlabs/react-native";
import { fetchConversationToken, fetchRoute } from '../lib/api';

interface AuraIntent {
  action: string;
  amount: number;
  asset: string;
  to_asset?: string;
}

export function useAuraConversation(walletAddress: string | null, onRequiresSubscription?: () => void) {
  const [status, setStatus] = useState('Welcome to Aura');
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  const [currentIntent, setCurrentIntent] = useState<AuraIntent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const conversation = useConversation({
    onMessage: (msg: any) => {
      console.log("Aura:", msg.message);
      setStatus(msg.message);
    },
    onConnect: () => {
      console.log("Aura Connected");
      setStatus('Aura online. Speak your intent.');
    },
    onDisconnect: () => {
      console.log("Aura Disconnected");
      setStatus('Aura offline');
    },
    onError: (error: any) => {
      console.error("Aura Error:", error);
      const message = typeof error === 'string' ? error : error.message || "Unknown voice error";
      setStatus(`Error: ${message}`);
    },
    clientTools: {
      trigger_solana_action: async (params: any) => {
        console.log("Triggering Action:", params);
        setCurrentIntent(params);
        setStatus(`Found route for ${params.action} ${params.amount} ${params.asset}`);
        
        if (!walletAddress) {
          return "Please connect your wallet first.";
        }

        try {
          const route = await fetchRoute({ ...params, from_address: walletAddress });
          setCurrentRoute(route);
          setStatus('Route ready for execution');
          return "Route prepared successfully. User can see it on screen.";
        } catch (error: any) {
          console.error("Routing Error:", error);
          setStatus(`Failed to find route: ${error.message}`);
          return `Error: ${error.message}`;
        }
      }
    }
  });

  const startSession = useCallback(async () => {
    if (!walletAddress) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first.');
      return;
    }

    setIsProcessing(true);
    setStatus('Initializing Aura...');

    try {
      const response = await fetchConversationToken(walletAddress);
      
      if (response.status === 402) {
        setStatus('Subscription required');
        onRequiresSubscription?.();
        return;
      }
      
      const { signedUrl } = response;
      await conversation.startSession({ signedUrl });
    } catch (error: any) {
      console.error("Start Session Error:", error);
      Alert.alert('Initialization Error', error.message);
      setStatus('Failed to start Aura');
    } finally {
      setIsProcessing(false);
    }
  }, [walletAddress, conversation, onRequiresSubscription]);

  const stopSession = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const resetFlow = useCallback(() => {
    setCurrentRoute(null);
    setCurrentIntent(null);
    setStatus('Aura ready. Speak your intent.');
  }, []);

  const isListening = conversation.status === 'connected';

  return {
    status,
    setStatus,
    currentRoute,
    setCurrentRoute,
    currentIntent,
    setCurrentIntent,
    isListening,
    isProcessing,
    startSession,
    stopSession,
    resetFlow
  };
}
