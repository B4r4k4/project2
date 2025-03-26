import React from "react";
import { 
  PlanetIcon, 
  ShopIcon, 
  TasksIcon, 
  ReferralsIcon, 
  WalletIcon 
} from "@/components/icons";
import { useGameState } from "@/hooks/useGameState";

const BottomNav: React.FC = () => {
  const { currentTab, switchTab } = useGameState();
  
  const getTabStyles = (tabId: string) => {
    return currentTab === tabId 
      ? "flex flex-col items-center py-1 px-3 text-accent" 
      : "flex flex-col items-center py-1 px-3 text-gray-500";
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-card px-2 py-1 flex justify-around items-center shadow-lg z-10">
      <button 
        className={getTabStyles('main-game-view')}
        onClick={() => switchTab('main-game-view')}
        aria-label="Planet"
      >
        <PlanetIcon className="h-6 w-6" />
        <span className="text-xs">Planet</span>
      </button>
      
      <button 
        className={getTabStyles('shop-view')}
        onClick={() => switchTab('shop-view')}
        aria-label="Shop"
      >
        <ShopIcon className="h-6 w-6" />
        <span className="text-xs">Shop</span>
      </button>
      
      <button 
        className={getTabStyles('tasks-view')}
        onClick={() => switchTab('tasks-view')}
        aria-label="Tasks"
      >
        <TasksIcon className="h-6 w-6" />
        <span className="text-xs">Tasks</span>
      </button>
      
      <button 
        className={getTabStyles('referrals-view')}
        onClick={() => switchTab('referrals-view')}
        aria-label="Referrals"
      >
        <ReferralsIcon className="h-6 w-6" />
        <span className="text-xs">Referrals</span>
      </button>
      
      <button 
        className={getTabStyles('wallet-view')}
        onClick={() => switchTab('wallet-view')}
        aria-label="Wallet"
      >
        <WalletIcon className="h-6 w-6" />
        <span className="text-xs">Wallet</span>
      </button>
    </nav>
  );
};

export default BottomNav;
