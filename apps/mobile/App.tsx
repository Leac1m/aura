import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Mic, MicOff, Wallet as WalletIcon, Shield, Send, RefreshCw, CheckCircle2, Zap, Crown, X, ArrowLeftRight, User } from 'lucide-react-native';
import { WalletProvider, useWallet } from './src/hooks/useWallet';
import { useAuraConversation } from './src/hooks/useAuraConversation';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { ConversationProvider } from "@elevenlabs/react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { AURA_ESCROW_IDL } from '@aura/types';
import { fetchRoute } from './src/lib/api';

// Configuration
const RPC_URL = "https://api.devnet.solana.com";
const TREASURY_ADDRESS = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

function UpgradeModal({ isOpen, onClose, onSubscribe, isSubscribing }: any) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color="#94a3b8" size={24} />
          </TouchableOpacity>
          
          <View style={styles.modalIconContainer}>
            <Crown color="#6366f1" size={48} fill="rgba(99, 102, 241, 0.2)" />
          </View>
          
          <Text style={styles.modalTitle}>Aura Premium</Text>
          <Text style={styles.modalDescription}>
            Unlock 30 days of unlimited agentic voice orchestration and premium DeFi skills.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Mic color="#6366f1" size={18} />
              </View>
              <View>
                <Text style={styles.featureTitle}>Unlimited Voice</Text>
                <Text style={styles.featureSub}>Natural language Solana execution.</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Shield color="#6366f1" size={18} />
              </View>
              <View>
                <Text style={styles.featureTitle}>On-Chain Proof</Text>
                <Text style={styles.featureSub}>30-day verified state.</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>0.1 SOL</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.subscribeButton} 
            onPress={onSubscribe}
            disabled={isSubscribing}
          >
            {isSubscribing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.subscribeText}>Subscribe Now</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.modalFooter}>
            Creates a time-bound proof on Solana.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function AuraHome() {
  const { walletAddress, loading: walletLoading, connectWallet, disconnectWallet, signAndSendTransactions } = useWallet();
  
  // Mode State
  const [mode, setMode] = useState<'voice' | 'manual'>('voice');
  
  // Subscription State
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Manual Form State
  const [manualAction, setManualAction] = useState<'send' | 'swap'>('send');
  const [manualAsset, setManualAsset] = useState('SOL');
  const [manualToAsset, setManualToAsset] = useState('USDC');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDestination, setManualDestination] = useState('');

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
  } = useAuraConversation(walletAddress, () => setShowUpgrade(true));
  
  const [isExecuting, setIsExecuting] = useState(false);

  const handlePaySubscription = async () => {
    if (!walletAddress) return;

    setIsSubscribing(true);
    setStatus('Preparing subscription...');
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const userPubkey = new PublicKey(walletAddress);
      const treasuryPubkey = new PublicKey(TREASURY_ADDRESS);
      const programId = new PublicKey(AURA_ESCROW_IDL.address);

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), userPubkey.toBuffer()],
        programId
      );

      // Anchor discriminator for pay_subscription: [214, 139, 186, 253, 169, 248, 196, 11]
      const data = Buffer.from([214, 139, 186, 253, 169, 248, 196, 11]);

      const instruction = {
        programId,
        keys: [
          { pubkey: escrowPda, isSigner: false, isWritable: true },
          { pubkey: userPubkey, isSigner: true, isWritable: true },
          { pubkey: treasuryPubkey, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      };

      const { blockhash } = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: userPubkey,
        recentBlockhash: blockhash,
      }).add(instruction);

      const serializedTx = transaction.serialize({ verifySignatures: false }).toString('base64');

      const signatures = await signAndSendTransactions([serializedTx]);

      console.log("Subscription Signature:", signatures[0]);
      Alert.alert('Success', 'Subscription active! You can now use Aura Premium.');
      setShowUpgrade(false);
      setTimeout(() => startSession(), 2000);
    } catch (error: any) {
      console.error("Subscription Error:", error);
      Alert.alert('Error', error.message || 'Payment failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  const executeTransaction = async () => {
    const txData = currentRoute?.transactionRequest?.transaction;
    if (!txData || !walletAddress) return;

    setIsExecuting(true);
    setStatus('Executing...');

    try {
      const signatures = await signAndSendTransactions([txData]);
      
      console.log("Transaction Signature:", signatures[0]);
      setStatus('Success!');
      Alert.alert('Success', 'Transaction executed.');
      resetFlow();
    } catch (error: any) {
      console.error("Execution Error:", error);
      Alert.alert('Error', error.message || 'Execution failed');
      setStatus('Failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleManualExecute = async () => {
    if (!walletAddress) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first.');
      return;
    }

    setIsExecuting(true);
    setStatus('Preparing manual action...');

    try {
      if (manualAction === 'send') {
        if (!manualDestination || !manualAmount) {
          throw new Error("Missing destination or amount");
        }

        const connection = new Connection(RPC_URL, 'confirmed');
        const userPubkey = new PublicKey(walletAddress);
        const destPubkey = new PublicKey(manualDestination);
        const lamports = Math.floor(parseFloat(manualAmount) * 1e9);

        const { blockhash } = await connection.getLatestBlockhash();
        const transaction = new Transaction({
          feePayer: userPubkey,
          recentBlockhash: blockhash,
        }).add(
          SystemProgram.transfer({
            fromPubkey: userPubkey,
            toPubkey: destPubkey,
            lamports,
          })
        );

        const serializedTx = transaction.serialize({ verifySignatures: false }).toString('base64');
        await signAndSendTransactions([serializedTx]);
        
        Alert.alert('Success', `Sent ${manualAmount} SOL to ${manualDestination.slice(0, 8)}...`);
        setManualAmount('');
        setManualDestination('');
      } else {
        // Manual Swap
        const route = await fetchRoute({
          action: 'swap',
          amount: parseFloat(manualAmount),
          asset: manualAsset,
          to_asset: manualToAsset,
          from_address: walletAddress
        });

        const txPayload = route.transactionRequest.data || route.transactionRequest.transaction;
        if (!txPayload) throw new Error('No transaction data returned from swap route');
        
        await signAndSendTransactions([txPayload]);
        Alert.alert('Success', `Swapped ${manualAmount} ${manualAsset} for ${manualToAsset}`);
      }
    } catch (error: any) {
      console.error("Manual Error:", error);
      Alert.alert('Error', error.message || 'Action failed');
    } finally {
      setIsExecuting(false);
      setStatus('Aura ready');
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
      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        onSubscribe={handlePaySubscription}
        isSubscribing={isSubscribing}
      />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Aura</Text>
          <Text style={styles.subtitle}>{mode === 'voice' ? 'Agent Intelligence' : 'Manual Console'}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.walletButton, walletAddress ? styles.walletConnected : null]} 
          onPress={walletAddress ? disconnectWallet : connectWallet}
          disabled={walletLoading}
        >
          {walletLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <WalletIcon color="#fff" size={18} />
              <Text style={styles.walletText}>
                {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.modeToggle}>
        <TouchableOpacity 
          onPress={() => setMode('voice')} 
          style={[styles.modeButton, mode === 'voice' ? styles.modeActive : null]}
        >
          <Mic color={mode === 'voice' ? "#fff" : "#94a3b8"} size={16} />
          <Text style={[styles.modeText, mode === 'voice' ? styles.modeTextActive : null]}>Voice</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setMode('manual')} 
          style={[styles.modeButton, mode === 'manual' ? styles.modeActive : null]}
        >
          <Zap color={mode === 'manual' ? "#fff" : "#94a3b8"} size={16} />
          <Text style={[styles.modeText, mode === 'manual' ? styles.modeTextActive : null]}>Manual</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {mode === 'voice' ? (
            <View style={styles.voiceView}>
              <View style={styles.statusCard}>
                <Text style={styles.statusLabel}>Aura Status</Text>
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
          ) : (
            <View style={styles.manualView}>
              <View style={styles.manualToggle}>
                <TouchableOpacity 
                  onPress={() => setManualAction('send')}
                  style={[styles.manualActionBtn, manualAction === 'send' ? styles.manualActionActive : null]}
                >
                  <Send color={manualAction === 'send' ? "#fff" : "#94a3b8"} size={16} />
                  <Text style={[styles.manualActionText, manualAction === 'send' ? styles.manualActionTextActive : null]}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setManualAction('swap')}
                  style={[styles.manualActionBtn, manualAction === 'swap' ? styles.manualActionActive : null]}
                >
                  <ArrowLeftRight color={manualAction === 'swap' ? "#fff" : "#94a3b8"} size={16} />
                  <Text style={[styles.manualActionText, manualAction === 'swap' ? styles.manualActionTextActive : null]}>Swap</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{manualAction === 'swap' ? 'From Asset' : 'Asset'}</Text>
                  <TextInput 
                    style={styles.input}
                    value={manualAsset}
                    onChangeText={setManualAsset}
                    placeholder="SOL"
                    placeholderTextColor="#475569"
                  />
                </View>

                {manualAction === 'swap' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>To Asset</Text>
                    <TextInput 
                      style={styles.input}
                      value={manualToAsset}
                      onChangeText={setManualToAsset}
                      placeholder="USDC"
                      placeholderTextColor="#475569"
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount</Text>
                  <TextInput 
                    style={styles.input}
                    value={manualAmount}
                    onChangeText={setManualAmount}
                    keyboardType="numeric"
                    placeholder="0.1"
                    placeholderTextColor="#475569"
                  />
                </View>

                {manualAction === 'send' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Destination Address</Text>
                    <TextInput 
                      style={styles.input}
                      value={manualDestination}
                      onChangeText={setManualDestination}
                      placeholder="Address"
                      placeholderTextColor="#475569"
                    />
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.manualExecuteBtn}
                  onPress={handleManualExecute}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Zap color="#fff" size={20} fill="currentColor" />
                      <Text style={styles.manualExecuteText}>
                        {manualAction === 'send' ? 'Execute Send' : 'Fetch Quote & Swap'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Aura • Solana Devnet</Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <WalletProvider>
        <ConversationProvider>
          <AuraHome />
        </ConversationProvider>
      </WalletProvider>
    </SafeAreaProvider>
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
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -1,
  },
  subtitle: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: -4,
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  walletConnected: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  walletText: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: 25,
    padding: 4,
    borderRadius: 15,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  modeActive: {
    backgroundColor: '#334155',
  },
  modeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modeTextActive: {
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  voiceView: {
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  manualView: {
    paddingHorizontal: 25,
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 30,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 130,
  },
  statusLabel: {
    color: '#6366f1',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 2,
  },
  statusText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  intentBadge: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  intentText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  visualizer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
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
    width: 100,
    height: 100,
    borderRadius: 50,
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
    borderRadius: 24,
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
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  executeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hint: {
    marginTop: 30,
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  manualToggle: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 4,
    borderRadius: 15,
    marginBottom: 25,
  },
  manualActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  manualActionActive: {
    backgroundColor: '#6366f1',
  },
  manualActionText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  manualActionTextActive: {
    color: '#fff',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    height: 56,
    paddingHorizontal: 20,
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#334155',
  },
  manualExecuteBtn: {
    height: 64,
    backgroundColor: '#6366f1',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  manualExecuteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 25,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 40,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeButton: {
    position: 'absolute',
    top: 25,
    right: 25,
  },
  modalIconContainer: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  modalDescription: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  featureList: {
    width: '100%',
    gap: 15,
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 15,
    borderRadius: 20,
    gap: 15,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  featureSub: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  priceContainer: {
    width: '100%',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  priceLabel: {
    color: 'rgba(99, 102, 241, 0.8)',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  priceValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  subscribeButton: {
    width: '100%',
    height: 70,
    backgroundColor: '#6366f1',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  subscribeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalFooter: {
    marginTop: 15,
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
