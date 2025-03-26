import { useState, useEffect } from 'react';
import { tonConnectUI, handleTonConnectError } from '@/lib/tonConnect';

export function useTonConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Subscribe to connection status changes
  useEffect(() => {
    // Setup connection status listener
    const unsubscribe = tonConnectUI.onStatusChange(
      (wallet) => {
        if (wallet) {
          setAddress(wallet.account.address);
          setIsConnected(true);
        } else {
          setAddress(null);
          setIsConnected(false);
        }
        setIsConnecting(false);
      },
      (err) => {
        console.error('TON Connect error:', err);
        setError(handleTonConnectError(err));
        setIsConnecting(false);
      }
    );
    
    // Check initial connection state asynchronously
    const checkConnection = async () => {
      try {
        // Wait for connection to restore if needed
        await tonConnectUI.connectionRestored;
        
        // If we have a wallet, update state
        if (tonConnectUI.wallet) {
          setAddress(tonConnectUI.wallet.account.address);
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Failed to restore TON connection:', err);
      }
    };
    
    checkConnection();
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await tonConnectUI.connectWallet();
    } catch (err) {
      console.error('Connect wallet error:', err);
      setError(handleTonConnectError(err));
    } finally {
      setIsConnecting(false);
    }
  };
  
  const disconnect = () => {
    try {
      tonConnectUI.disconnect();
    } catch (err) {
      console.error('Disconnect wallet error:', err);
      setError(handleTonConnectError(err));
    }
  };
  
  return {
    address,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect
  };
}