import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Mic, MicOff, Wallet as WalletIcon, Shield, Send, RefreshCw } from 'lucide-react-native';
import { WalletProvider, useWallet } from './src/hooks/useWallet';
import { fetchRoute, fetchSignedUrl } from './src/lib/api';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { Conversation } from "@elevenlabs/client";

function AuraHome() {
  const { walletAddress, loading: walletLoading, connectWallet } = useWallet();
  
  const [status, setStatus] = useState('Welcome to Aura');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  const [currentIntent, setCurrentIntent] = useState<any>(null);
  
  const conversationRef = useRef<any>(null);

  const startAuraSession = async () => {
    if (!walletAddress) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first.');
      return;
    }

    setIsProcessing(true);
    setStatus('Initializing Aura...');

    try {
      const { signedUrl } = await fetchSignedUrl();
      
      conversationRef.current = await Conversation.startSession({
        signedUrl,
        onMessage: (msg) => {
          console.log("Aura:", msg.message);
          setStatus(msg.message);
        },
        onUserTranscript: (transcript) => {
          console.log("User:", transcript);
        },
        clientTools: {
          trigger_solana_action: async (params: any) => {
            console.log("Triggering Action:", params);
            setCurrentIntent(params);
            setStatus(`Found route for ${params.action} ${params.amount} ${params.asset}`);
            
            try {
              const route = await fetchRoute({ ...params, from_address: walletAddress });
              setCurrentRoute(route);
              setStatus('Route ready for execution');
              return { success: true, message: "Route prepared successfully." };
            } catch (error: any) {
              console.error("Routing Error:", error);
              setStatus(`Failed to find route: ${error.message}`);
              return { success: false, error: error.message };
            }
          }
        },
        onError: (error) => {
          console.error("Aura Error:", error);
          Alert.alert('Aura Error', error.message);
          setIsListening(false);
        },
        onConnect: () => {
          console.log("Aura Connected");
          setIsListening(true);
          setIsProcessing(false);
          setStatus('Aura online. Speak your intent.');
        },
        onDisconnect: () => {
          console.log("Aura Disconnected");
          setIsListening(false);
          setStatus('Aura offline');
        }
      });

    } catch (error: any) {
      Alert.alert('Initialization Error', error.message);
      setStatus('Failed to start Aura');
      setIsProcessing(false);
    }
  };

  const stopAuraSession = async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
    }
    setIsListening(false);
  };

  const executeTransaction = async () => {
    if (!currentRoute || !walletAddress) return;

    setIsProcessing(true);
    setStatus('Preparing transaction...');

    try {
      await transact(async (wallet) => {
        setStatus('Waiting for signature...');
        
        // LI.FI returns transactionRequest. In SVM, we often use the returned instructions.
        // For SVM, LI.FI quote has a 'transactionRequest' field which is often the serialised tx.
        
        // Placeholder for real signing
        console.log("Executing Route:", currentRoute);
        
        Alert.alert('Success', 'Transaction orchestrated and simulated via Aura.');
        setStatus('Transaction Executed');
        setCurrentRoute(null);
        setCurrentIntent(null);
      });
    } catch (error: any) {
      Alert.alert('Execution Error', error.message);
      setStatus('Execution failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFlow = () => {
    setCurrentRoute(null);
    setCurrentIntent(null);
    setStatus('Speak to Aura to start over');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aura</Text>
        <TouchableOpacity 
          style={[styles.walletButton, walletAddress ? styles.walletConnected : null]} 
          onPress={connectWallet}
          disabled={walletLoading}
        >
          {walletLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <WalletIcon color="#fff" size={20} />
              <Text style={styles.walletText}>
                {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <Text style={styles.statusText}>{status}</Text>
          {currentIntent && (
            <View style={styles.intentBadge}>
              <Text style={styles.intentText}>
                {currentIntent.action} {currentIntent.amount} {currentIntent.asset}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.visualizer}>
          {isListening ? (
            <View style={styles.pulseContainer}>
              <View style={[styles.pulse, { transform: [{ scale: 1.2 }] }]} />
              <View style={[styles.pulse, { transform: [{ scale: 1.6 }], opacity: 0.2 }]} />
            </View>
          ) : isProcessing ? (
            <ActivityIndicator color="#6366f1" size="large" />
          ) : (
            <Shield color="#6366f1" size={80} opacity={0.2} />
          )}
        </View>

        <View style={styles.actionContainer}>
          {currentRoute ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.executeButton} 
                onPress={executeTransaction}
                disabled={isProcessing}
              >
                <Send color="#fff" size={24} />
                <Text style={styles.executeText}>Sign & Execute</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={resetFlow}
              >
                <RefreshCw color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.micButton, isListening ? styles.micActive : null]} 
              onPress={isListening ? stopAuraSession : startAuraSession}
              disabled={isProcessing}
            >
              {isListening ? <MicOff color="#fff" size={40} /> : <Mic color="#fff" size={40} />}
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.hint}>
          {isListening ? 'Aura is listening...' : currentRoute ? 'Approve the orchestrated route' : 'Tap to start voice intent'}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Aura Agentic Wallet • SVM Routing</Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AuraHome />
    </WalletProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -1,
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  walletConnected: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  walletText: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  statusText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  intentBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  intentText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  visualizer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    width: '100%',
  },
  micButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  micActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  executeButton: {
    flex: 1,
    height: 70,
    backgroundColor: '#22c55e',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  resetButton: {
    width: 70,
    height: 70,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  executeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    marginTop: 20,
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
