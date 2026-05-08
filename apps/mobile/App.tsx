import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Mic, MicOff, Wallet as WalletIcon, Shield } from 'lucide-react-native';
import { WalletProvider, useWallet } from './src/hooks/useWallet';

function AuraHome() {
  const { walletAddress, loading, connectWallet } = useWallet();
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Welcome to Aura');

  const toggleListening = () => {
    if (!walletAddress) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first.');
      return;
    }
    setIsListening(!isListening);
    setStatus(isListening ? 'Awaiting Intent...' : 'Listening...');
    
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setStatus('Parsed: Swap 1 SOL for USDC');
      }, 3000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aura</Text>
        <TouchableOpacity 
          style={[styles.walletButton, walletAddress ? styles.walletConnected : null]} 
          onPress={connectWallet}
          disabled={loading}
        >
          {loading ? (
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
          {isListening ? (
            <View style={styles.pulseContainer}>
              <View style={[styles.pulse, { transform: [{ scale: 1.2 }] }]} />
              <View style={[styles.pulse, { transform: [{ scale: 1.5 }], opacity: 0.3 }]} />
            </View>
          ) : (
            <Shield color="#6366f1" size={80} opacity={0.2} />
          )}
        </View>

        <TouchableOpacity 
          style={[styles.micButton, isListening ? styles.micActive : null]} 
          onPress={toggleListening}
        >
          {isListening ? (
            <MicOff color="#fff" size={40} />
          ) : (
            <Mic color="#fff" size={40} />
          )}
        </TouchableOpacity>
        
        <Text style={styles.hint}>
          {isListening ? 'Tap to stop' : 'Tap to speak your intent'}
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
  hint: {
    marginTop: 20,
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
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
