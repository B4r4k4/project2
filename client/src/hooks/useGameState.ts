import { useContext } from 'react';
import { GameContext } from '@/context/GameContext';

export function useGameState() {
  const context = useContext(GameContext);
  
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  
  const { 
    isAuthenticated,
    user,
    currentTab,
    isLoading,
    pointsPerTap,
    pointsPerSecond,
    authenticateWithTelegram,
    switchTab,
    tapPlanet,
    purchaseGenerator,
    unlockGenerator,
    purchaseBoost,
    purchaseUpgrade,
    completeTask,
    connectWallet
  } = context;
  
  return {
    isAuthenticated,
    user,
    currentTab,
    isLoading,
    pointsPerTap,
    pointsPerSecond,
    authenticateWithTelegram,
    switchTab,
    tapPlanet,
    purchaseGenerator,
    unlockGenerator,
    purchaseBoost,
    purchaseUpgrade,
    completeTask,
    connectWallet
  };
}
