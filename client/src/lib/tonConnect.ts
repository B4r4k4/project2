import { TonConnectUI } from '@tonconnect/ui';

// Initialize TON Connect
const manifestUrl = 'https://raw.githubusercontent.com/ton-community/tutorials/main/03-client/tonconnect-manifest.json';

// Create a function to initialize TonConnectUI lazily
let tonConnectUIInstance: TonConnectUI | null = null;

export const getTonConnectUI = (): TonConnectUI => {
  if (!tonConnectUIInstance) {
    tonConnectUIInstance = new TonConnectUI({
      manifestUrl,
      // We'll handle the UI manually instead of using a button
      uiPreferences: {
        theme: 'SYSTEM',
      },
    });
  }
  return tonConnectUIInstance;
};

export const tonConnectUI = getTonConnectUI();

// Wrapper function to check if wallet is installed
export const checkIfWalletInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check if any TON wallet is available - this is async but we'll handle that in the hook
    return true;
  } catch (error) {
    console.error('Error checking wallet status:', error);
    return false;
  }
};

// Helper function to handle wallet connection errors
export const handleTonConnectError = (error: unknown): string => {
  console.error('TonConnect error:', error);
  
  if (typeof error === 'object' && error !== null) {
    // Try to extract a message from the error object
    const errorObj = error as any;
    if (errorObj.message) {
      return errorObj.message;
    }
    if (errorObj.error_code === 'USER_REJECTED') {
      return 'Connection rejected by user';
    }
  }
  
  return 'Failed to connect wallet';
};
