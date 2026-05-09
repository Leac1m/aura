import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_IDENTITY = {
  name: 'Aura',
  uri: 'https://aura.bot',
  icon: 'favicon.png',
};

const AUTH_TOKEN_KEY = 'auth_token';
const WALLET_ADDRESS_KEY = 'wallet_address';

interface WalletContextType {
  walletAddress: string | null;
  loading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load persisted wallet data on mount
  useEffect(() => {
    async function loadWallet() {
      try {
        const storedAddress = await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        
        if (storedAddress && storedToken) {
          setWalletAddress(storedAddress);
        }
      } catch (error) {
        console.error('Failed to load wallet data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadWallet();
  }, []);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      await transact(async (wallet) => {
        let authorizationResult;
        
        if (storedToken) {
          try {
            authorizationResult = await wallet.reauthorize({
              identity: APP_IDENTITY,
              auth_token: storedToken,
            });
          } catch (e) {
            console.log('Reauthorization failed, falling back to authorize');
            authorizationResult = await wallet.authorize({
              identity: APP_IDENTITY,
              chain: 'solana:devnet',
            });
          }
        } else {
          authorizationResult = await wallet.authorize({
            identity: APP_IDENTITY,
            chain: 'solana:devnet',
          });
        }
        
        const address = authorizationResult.accounts[0].address;
        const authToken = authorizationResult.auth_token;
        
        setWalletAddress(address);
        await AsyncStorage.setItem(WALLET_ADDRESS_KEY, address);
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
      });
    } catch (error: any) {
      console.error('Wallet Error:', error);
      if (error.message?.includes('User rejected')) {
        // Silently handle user rejection
      } else {
        Alert.alert('Wallet Error', error.message || 'Failed to connect wallet');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    setWalletAddress(null);
    await AsyncStorage.removeItem(WALLET_ADDRESS_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
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
