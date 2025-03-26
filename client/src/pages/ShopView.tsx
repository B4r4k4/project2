import React from "react";
import { motion } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { formatNumber } from "@/utils/formatters";
import { BoostType, UpgradeType } from "@shared/schema";
import { 
  DoubleTapIcon, 
  AutoBoostIcon, 
  EnergyRefillIcon,
  EnergyCapacityIcon,
  MultiTapIcon
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

const ShopView: React.FC = () => {
  const { user, purchaseBoost, purchaseUpgrade } = useGameState();
  const { toast } = useToast();
  
  const handleBuyBoost = (type: BoostType, cost: number, duration: number, multiplier: number) => {
    if (!user) return;
    
    if (user.points < cost) {
      toast({
        title: "Not enough points",
        description: `You need ${formatNumber(cost)} points to buy this boost.`,
        variant: "destructive",
      });
      return;
    }
    
    purchaseBoost(type, cost, duration, multiplier);
    
    toast({
      title: "Boost Purchased",
      description: "Your boost has been activated!",
      variant: "default",
    });
  };
  
  const handleBuyUpgrade = (type: UpgradeType, cost: number, value: number) => {
    if (!user) return;
    
    if (user.points < cost) {
      toast({
        title: "Not enough points",
        description: `You need ${formatNumber(cost)} points to buy this upgrade.`,
        variant: "destructive",
      });
      return;
    }
    
    purchaseUpgrade(type, cost, value);
    
    toast({
      title: "Upgrade Purchased",
      description: "Your upgrade has been applied!",
      variant: "default",
    });
  };
  
  if (!user) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-3"
    >
      <div className="mb-3">
        <h2 className="text-xl font-poppins font-bold">Shop</h2>
        <p className="text-sm text-gray-400">Upgrade your cosmic empire</p>
      </div>
      
      <div className="bg-background-card rounded-lg p-3 mb-4">
        <h3 className="text-lg font-bold mb-2">Boosts</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center p-2 bg-background-light rounded-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                <DoubleTapIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold">Double Tap</div>
                <div className="text-xs text-gray-400">2x points per tap for 30 minutes</div>
              </div>
            </div>
            <button 
              className="bg-accent text-gray-900 rounded-full px-3 py-1 text-sm font-bold"
              onClick={() => handleBuyBoost(BoostType.DOUBLE_TAP, 3500, 0.5, 2)}
            >
              3.5K
            </button>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-background-light rounded-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                <AutoBoostIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold">Auto Boost</div>
                <div className="text-xs text-gray-400">+50% passive income for 1 hour</div>
              </div>
            </div>
            <button 
              className="bg-accent text-gray-900 rounded-full px-3 py-1 text-sm font-bold"
              onClick={() => handleBuyBoost(BoostType.AUTO_BOOST, 5000, 1, 1.5)}
            >
              5K
            </button>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-background-light rounded-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
                <EnergyRefillIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold">Energy Refill</div>
                <div className="text-xs text-gray-400">Refill energy to maximum</div>
              </div>
            </div>
            <button 
              className="bg-accent text-gray-900 rounded-full px-3 py-1 text-sm font-bold"
              onClick={() => handleBuyBoost(BoostType.ENERGY_REFILL, 2000, 0, 0)}
            >
              2K
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-background-card rounded-lg p-3 mb-4">
        <h3 className="text-lg font-bold mb-2">Permanent Upgrades</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center p-2 bg-background-light rounded-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
                <EnergyCapacityIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold">Energy Capacity</div>
                <div className="text-xs text-gray-400">Increase max energy by 10</div>
              </div>
            </div>
            <button 
              className="bg-accent text-gray-900 rounded-full px-3 py-1 text-sm font-bold"
              onClick={() => handleBuyUpgrade(UpgradeType.ENERGY_CAPACITY, 10000, 10)}
            >
              10K
            </button>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-background-light rounded-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
                <MultiTapIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold">Multi-tap</div>
                <div className="text-xs text-gray-400">+1 point per tap permanently</div>
              </div>
            </div>
            <button 
              className="bg-accent text-gray-900 rounded-full px-3 py-1 text-sm font-bold"
              onClick={() => handleBuyUpgrade(UpgradeType.MULTI_TAP, 8000, 1)}
            >
              8K
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ShopView;
