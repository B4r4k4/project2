import React from "react";
import { useGameState } from "@/hooks/useGameState";
import MainGameView from "@/pages/MainGameView";
import ShopView from "@/pages/ShopView";
import TasksView from "@/pages/TasksView";
import ReferralsView from "@/pages/ReferralsView";
import WalletView from "@/pages/WalletView";

const GameContent: React.FC = () => {
  const { currentTab } = useGameState();
  
  return (
    <main className="flex-1 overflow-y-auto pb-20" id="game-content">
      {currentTab === 'main-game-view' && <MainGameView />}
      {currentTab === 'shop-view' && <ShopView />}
      {currentTab === 'tasks-view' && <TasksView />}
      {currentTab === 'referrals-view' && <ReferralsView />}
      {currentTab === 'wallet-view' && <WalletView />}
    </main>
  );
};

export default GameContent;
