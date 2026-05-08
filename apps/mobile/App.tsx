import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Mic, MicOff, Wallet as WalletIcon, Shield, Send } from 'lucide-react-native';
import { WalletProvider, useWallet } from './src/hooks/useWallet';
import { useAudioRecording } from './src/hooks/useAudioRecording';
import { fetchIntent, fetchRoute } from './src/lib/api';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { VersionedTransaction } from '@solana/web3.js';

function AuraHome() {
  const { walletAddress, loading: walletLoading, connectWallet } = useWallet();
  const { isRecording, startRecording, stopRecording } = useAudioRecording();
  
  const [status, setStatus] = useState('Welcome to Aura');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);

  const handleVoiceIntent = async () => {
    if (!walletAddress) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first.');
      return;
    }

    if (!isRecording) {
      await startRecording();
      setStatus('Listening to your intent...');
    } else {
      setIsProcessing(true);
      setStatus('Processing voice...');
      const uri = await stopRecording();
      
      try {
        // In a real app, we'd upload the audio file here.
        // For this hackathon/TDD version, we'll simulate the text from voice.
        const mockVoiceText = "swap 1 SOL for USDC"; 
        
        setStatus('Orchestrating intent...');
        const intent = await fetchIntent(mockVoiceText);
        
        setStatus(`Found route: ${intent.action} ${intent.amount} ${intent.asset}`);
        const route = await fetchRoute(intent);
        
        setCurrentRoute(route);
        setStatus('Route ready for execution');
      } catch (error: any) {
        Alert.alert('Error', error.message);
        setStatus('Failed to process intent');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const executeTransaction = async () => {
    if (!currentRoute || !walletAddress) return;

    setIsProcessing(true);
    setStatus('Preparing transaction...');

    try {
      await transact(async (wallet) => {
        // In a real scenario, the backend would return a base64 encoded transaction
        // For now, we simulate the signing flow.
        setStatus('Waiting for signature...');
        
        // This is a placeholder for actual MWA transaction signing
        // const signedTx = await wallet.signTransactions({ transactions: [...] });
        
        Alert.alert('Success', 'Transaction simulated and ready for delegation!');
        setStatus('Transaction Executed');
        setCurrentRoute(null);
      });
    } catch (error: any) {
      Alert.alert('Execution Error', error.message);
      setStatus('Execution failed');
    } finally {
      setIsProcessing(false);
    }
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
        </View>

        <View style={styles.visualizer}>
          {isRecording ? (
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

        {currentRoute ? (
          <TouchableOpacity 
            style={styles.executeButton} 
            onPress={executeTransaction}
            disabled={isProcessing}
          >
            <Send color="#fff" size={32} />
            <Text style={styles.executeText}>Execute Route</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.micButton, isRecording ? styles.micActive : null]} 
            onPress={handleVoiceIntent}
            disabled={isProcessing}
          >
            {isRecording ? <MicOff color="#fff" size={40} /> : <Mic color="#fff" size={40} />}
          </TouchableOpacity>
        )}
        
        <Text style={styles.hint}>
          {isRecording ? 'Tap to process' : currentRoute ? 'Sign to execute on Solana' : 'Tap to speak your intent'}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Aura Agentic Wallet • Devnet</Text>
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
    width: '100%',
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
  executeText: {
    color: '#fff',
    fontSize: 20,
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
