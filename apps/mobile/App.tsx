import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Mic, MicOff, Wallet as WalletIcon, Shield, Send, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { WalletProvider, useWallet } from './src/hooks/useWallet';
import { useAuraConversation } from './src/hooks/useAuraConversation';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { ConversationProvider } from "@elevenlabs/react-native";

function AuraHome() {
  const { walletAddress, loading: walletLoading, connectWallet, disconnectWallet } = useWallet();
  const {
    status,
    setStatus,
    currentRoute,
    currentIntent,
    isListening,
    isProcessing: conversationLoading,
    startSession,
    stopSession,
    resetFlow
  } = useAuraConversation(walletAddress);
  
  const [isExecuting, setIsExecuting] = useState(false);

  const executeTransaction = async () => {
    if (!currentRoute || !walletAddress) return;

    setIsExecuting(true);
    setStatus('Preparing transaction...');

    try {
      await transact(async (wallet) => {
        setStatus('Waiting for signature...');
        
        // LI.FI returns the compiled transaction as a base64 string in transactionRequest.transaction
        const transactionBase64 = currentRoute.transactionRequest?.transaction;
        if (!transactionBase64) {
          throw new Error("Route does not contain transaction data");
        }

        // MWA 2.x expects base64 payloads and returns an object with signatures
        const { signatures } = await wallet.signAndSendTransactions({
          payloads: [transactionBase64]
        });
        
        const [signature] = signatures;
        console.log("Transaction Signature:", signature);
        setStatus('Transaction confirmed!');
        Alert.alert('Success', 'Transaction orchestrated and executed successfully.');
        resetFlow();
      });
    } catch (error: any) {
      console.error("Execution Error:", error);
      const message = error.message || "Unknown execution error";
      if (!message.includes('User rejected')) {
        Alert.alert('Execution Error', message);
      }
      setStatus('Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleMicPress = () => {
    if (isListening) {
      stopSession();
    } else {
      startSession();
    }
  };

  const isProcessing = conversationLoading || isExecuting;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aura</Text>
        <TouchableOpacity 
          style={[styles.walletButton, walletAddress ? styles.walletConnected : null]} 
          onPress={walletAddress ? disconnectWallet : connectWallet}
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
          <Text style={styles.statusLabel}>Aura Intelligence</Text>
          <Text style={styles.statusText}>{status}</Text>
          {currentIntent && (
            <View style={styles.intentBadge}>
              <Text style={styles.intentText}>
                {currentIntent.action} {currentIntent.amount} {currentIntent.asset}
                {currentIntent.to_asset ? ` → ${currentIntent.to_asset}` : ''}
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
          ) : currentRoute ? (
            <CheckCircle2 color="#22c55e" size={80} />
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
                disabled={isProcessing}
              >
                <RefreshCw color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.micButton, isListening ? styles.micActive : null]} 
              onPress={handleMicPress}
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
      <ConversationProvider>
        <AuraHome />
      </ConversationProvider>
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
    padding: 24,
    borderRadius: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 120,
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
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  intentBadge: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  intentText: {
    color: '#818cf8',
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
    width: 96,
    height: 96,
    borderRadius: 48,
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
    height: 72,
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
    width: 72,
    height: 72,
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
    marginTop: 24,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
