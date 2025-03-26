import React from "react";
import { useGameState } from "@/hooks/useGameState";
import { EnergyIcon, CoinsIcon, SettingsIcon } from "@/components/icons";
import { formatNumber } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";

const MainHeader: React.FC = () => {
  const { user } = useGameState();
  const { toast } = useToast();
  
  const handleSettingsClick = () => {
    // Show settings options
    toast({
      title: "Settings",
      description: "Settings functionality will be implemented in future updates.",
    });
  };
  
  if (!user) return null;
  
  return (
    <header className="px-4 py-3 bg-background-light flex items-center justify-between sticky top-0 z-10 shadow-md">
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full mr-2 bg-gradient-to-br from-indigo-700 to-purple-600 flex items-center justify-center overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="User Avatar" className="w-8 h-8" />
          ) : (
            <span className="text-xs font-bold">{user.displayName.substring(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-300">{user.displayName}</p>
          <div className="flex items-center">
            <span className="text-xs text-gray-400">Level</span>
            <span className="ml-1 text-xs font-bold text-accent">{user.level}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-background-card rounded-full px-3 py-1">
          <EnergyIcon className="w-4 h-4 mr-1 text-blue-300" />
          <span className="text-sm font-bold text-blue-300">{user.energy}</span>
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm text-gray-400">{user.maxEnergy}</span>
        </div>
        
        <div className="flex items-center bg-background-card rounded-full px-3 py-1">
          <CoinsIcon className="w-4 h-4 mr-1 text-accent" />
          <span className="text-sm font-bold text-accent">{formatNumber(user.points)}</span>
        </div>
        
        <button 
          className="bg-background-card p-2 rounded-full shadow-lg"
          onClick={handleSettingsClick}
          aria-label="Settings"
        >
          <SettingsIcon className="h-5 w-5 text-gray-300" />
        </button>
      </div>
    </header>
  );
};

export default MainHeader;
