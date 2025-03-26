import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Planet from "@/components/ui/planet";
import { useGameState } from "@/hooks/useGameState";
import { formatNumber } from "@/utils/formatters";
import { 
  SatelliteIcon, 
  StationIcon, 
  MoonBaseIcon, 
  ColonyIcon, 
  LockIcon,
  DoubleTapIcon,
  AutoBoostIcon,
  PlusIcon
} from "@/components/icons";
import { GeneratorType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Map generator types to their icons
const generatorIcons = {
  [GeneratorType.SATELLITE]: SatelliteIcon,
  [GeneratorType.STATION]: StationIcon,
  [GeneratorType.MOON_BASE]: MoonBaseIcon,
  [GeneratorType.COLONY]: ColonyIcon,
};

const MainGameView: React.FC = () => {
  const { 
    user, 
    tapPlanet, 
    pointsPerSecond,
    purchaseGenerator,
    unlockGenerator
  } = useGameState();
  const { toast } = useToast();
  
  const handleUpgradeGenerator = (generatorId: number) => {
    if (!user) return;
    
    const generator = user.generators.find(g => g.id === generatorId);
    if (!generator) return;
    
    if (user.points < generator.upgradeCost) {
      toast({
        title: "Not enough points",
        description: `You need ${formatNumber(generator.upgradeCost)} points to upgrade.`,
        variant: "destructive",
      });
      return;
    }
    
    purchaseGenerator(generator);
  };
  
  const handleUnlockGenerator = (type: GeneratorType, cost: number) => {
    if (!user) return;
    
    if (user.points < cost) {
      toast({
        title: "Not enough points",
        description: `You need ${formatNumber(cost)} points to unlock.`,
        variant: "destructive",
      });
      return;
    }
    
    unlockGenerator(type, cost);
  };
  
  if (!user) return null;
  
  // Find active boosts
  const activeBoosts = user.activeBoosts.filter(boost => {
    const now = new Date();
    return new Date(boost.expiresAt) > now;
  });
  
  return (
    <div className="block">
      {/* Planet Display */}
      <Planet onTap={tapPlanet} />
      
      {/* Boosts Row */}
      <div className="px-4 py-2">
        <h3 className="text-lg font-poppins font-bold mb-2">Active Boosts</h3>
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          {activeBoosts.length > 0 ? (
            activeBoosts.map(boost => {
              const expiresAt = new Date(boost.expiresAt);
              const now = new Date();
              const timeLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
              const minutes = Math.floor(timeLeft / 60);
              const seconds = timeLeft % 60;
              
              const BoostIcon = boost.type === "double_tap" ? DoubleTapIcon : AutoBoostIcon;
              
              return (
                <motion.div
                  key={boost.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="flex-shrink-0 w-20 bg-background-card rounded-lg p-2 text-center animate-bounce-small shadow-lg"
                >
                  <div className="w-12 h-12 mx-auto mb-1 rounded-full bg-background-light flex items-center justify-center">
                    <BoostIcon className="w-8 h-8 text-accent" />
                  </div>
                  <div className="text-xs font-bold text-accent">
                    {boost.type === "double_tap" ? "2x Tap" : "+50% Auto"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="flex-shrink-0 w-full text-center text-gray-500 text-sm py-2">
              No active boosts. Visit the shop to purchase boosts!
            </div>
          )}
          
          <button 
            className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-500"
            onClick={() => useGameState().switchTab('shop-view')}
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      {/* Generators Grid */}
      <div className="px-4 py-2 pb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-poppins font-bold">Generators</h3>
          <span className="text-sm text-gray-400">
            Points per second: <span className="text-accent font-bold">{formatNumber(pointsPerSecond)}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Unlocked generators */}
          {user.generators
            .filter(gen => gen.isUnlocked)
            .map(generator => {
              const GeneratorIcon = generatorIcons[generator.type as GeneratorType] || SatelliteIcon;
              
              return (
                <div key={generator.id} className="bg-background-card rounded-lg p-3 shadow-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center mr-2 text-blue-400">
                        <GeneratorIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="font-bold">
                          {generator.type === GeneratorType.SATELLITE && "Satellite"}
                          {generator.type === GeneratorType.STATION && "Station"}
                          {generator.type === GeneratorType.MOON_BASE && "Moon Base"}
                          {generator.type === GeneratorType.COLONY && "Colony"}
                        </div>
                        <div className="text-xs text-gray-400">Level {generator.level}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-accent">+{formatNumber(generator.currentOutput)}/s</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <button 
                      className="bg-primary text-white rounded px-3 py-1 text-sm font-bold"
                      onClick={() => handleUpgradeGenerator(generator.id)}
                    >
                      Upgrade
                    </button>
                    <div className="text-sm text-accent font-bold">{formatNumber(generator.upgradeCost)}</div>
                  </div>
                </div>
              );
            })}
          
          {/* Locked generator placeholder for Colony */}
          {!user.generators.some(g => g.type === GeneratorType.COLONY) && (
            <div className="bg-background-card rounded-lg p-3 shadow-lg border-2 border-dashed border-gray-700 opacity-80">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-background-light rounded-full flex items-center justify-center mr-2">
                    <LockIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-bold">Colony</div>
                    <div className="text-xs text-gray-400">Locked</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-500">+100/s</div>
              </div>
              <div className="flex justify-between items-center">
                <button 
                  className="bg-gray-700 text-gray-300 rounded px-3 py-1 text-sm font-bold"
                  onClick={() => handleUnlockGenerator(GeneratorType.COLONY, 25000)}
                >
                  Unlock
                </button>
                <div className="text-sm text-gray-400 font-bold">25K</div>
              </div>
            </div>
          )}
          
          {/* Locked generator placeholder for Moon Base */}
          {!user.generators.some(g => g.type === GeneratorType.MOON_BASE) && (
            <div className="bg-background-card rounded-lg p-3 shadow-lg border-2 border-dashed border-gray-700 opacity-80">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-background-light rounded-full flex items-center justify-center mr-2">
                    <LockIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-bold">Moon Base</div>
                    <div className="text-xs text-gray-400">Locked</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-500">+40/s</div>
              </div>
              <div className="flex justify-between items-center">
                <button 
                  className="bg-gray-700 text-gray-300 rounded px-3 py-1 text-sm font-bold"
                  onClick={() => handleUnlockGenerator(GeneratorType.MOON_BASE, 7800)}
                >
                  Unlock
                </button>
                <div className="text-sm text-gray-400 font-bold">7.8K</div>
              </div>
            </div>
          )}
          
          {/* Locked generator placeholder for Station */}
          {!user.generators.some(g => g.type === GeneratorType.STATION) && (
            <div className="bg-background-card rounded-lg p-3 shadow-lg border-2 border-dashed border-gray-700 opacity-80">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-background-light rounded-full flex items-center justify-center mr-2">
                    <LockIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-bold">Station</div>
                    <div className="text-xs text-gray-400">Locked</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-500">+25/s</div>
              </div>
              <div className="flex justify-between items-center">
                <button 
                  className="bg-gray-700 text-gray-300 rounded px-3 py-1 text-sm font-bold"
                  onClick={() => handleUnlockGenerator(GeneratorType.STATION, 3500)}
                >
                  Unlock
                </button>
                <div className="text-sm text-gray-400 font-bold">3.5K</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainGameView;
