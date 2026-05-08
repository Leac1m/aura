import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';

const APP_IDENTITY = {
  name: 'Aura',
  uri: 'https://aura.bot',
  icon: 'favicon.png',
};

interface WalletContextType {
  walletAddress: string | null;
  loading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    try {
      await transact(async (wallet) => {
        const authorizationResult = await wallet.authorize({
          identity: APP_IDENTITY,
          chain: 'solana:devnet',
        });
        setWalletAddress(authorizationResult.accounts[0].address);
      });
    } catch (error: any) {
      console.error('Wallet Error:', error);
      Alert.alert('Wallet Error', error.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ walletAddress, loading, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
