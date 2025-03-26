import React, { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { formatNumber } from "@/utils/formatters";
import { createRipple } from "@/utils/animations";

interface PlanetProps {
  onTap: () => void;
}

const Planet: React.FC<PlanetProps> = ({ onTap }) => {
  const { user, pointsPerTap, pointsPerSecond } = useGameState();
  const [tapped, setTapped] = useState(false);
  const [tapEffects, setTapEffects] = useState<{ id: number; x: number; y: number }[]>([]);
  const planetRef = useRef<HTMLDivElement>(null);
  const tapEffectIdRef = useRef(0);

  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!planetRef.current || user?.energy === 0) return;

    // Create tap visual effect
    const rect = planetRef.current.getBoundingClientRect();
    let x: number, y: number;
    
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    // Add new effect
    const newId = tapEffectIdRef.current++;
    setTapEffects(prev => [...prev, { id: newId, x, y }]);
    
    // Remove effect after animation completes
    setTimeout(() => {
      setTapEffects(prev => prev.filter(effect => effect.id !== newId));
    }, 600);
    
    // Trigger tap animation
    setTapped(true);
    setTimeout(() => setTapped(false), 150);
    
    // Call the tap handler
    onTap();
    
    // Haptic feedback if available
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
    }
  }, [onTap, user?.energy]);

  // Handle points per second animation
  const [ppsVisible, setPpsVisible] = useState(false);
  
  useEffect(() => {
    if (pointsPerSecond > 0) {
      const interval = setInterval(() => {
        setPpsVisible(true);
        setTimeout(() => setPpsVisible(false), 800);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [pointsPerSecond]);

  return (
    <div className="relative flex flex-col items-center justify-center pt-6 pb-4">
      <div className="mb-2">
        <AnimatePresence>
          {ppsVisible && pointsPerSecond > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-background-card rounded-full px-4 py-1 text-center shadow-lg"
            >
              <span className="font-bold text-lg text-secondary animate-pulse">
                +{formatNumber(pointsPerSecond)}
              </span>
              <span className="text-xs text-gray-400 ml-1">per second</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div 
        ref={planetRef}
        className="relative flex justify-center items-center w-56 h-56 cursor-pointer my-4" 
        onClick={handleTap}
        onTouchStart={handleTap}
      >
        <div className="absolute w-full h-full rounded-full bg-background-light opacity-20 animate-ping"></div>
        
        <motion.div
          animate={tapped ? { scale: 0.95 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="w-48 h-48 rounded-full planet-shadow overflow-hidden"
        >
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-900 animate-spin-slow rounded-full flex items-center justify-center">
            <div className="absolute w-full h-full bg-[url('https://cdn.pixabay.com/photo/2017/08/01/00/38/nebula-2562206_960_720.svg')] bg-cover opacity-50"></div>
          </div>
        </motion.div>
        
        {/* Tap effects */}
        {tapEffects.map(effect => (
          <div
            key={effect.id}
            className="absolute click-effect"
            style={{
              left: effect.x,
              top: effect.y,
              width: '80px',
              height: '80px',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
          <div className="text-3xl font-bold text-white drop-shadow-lg">
            {user ? formatNumber(user.points) : "0"}
          </div>
          <div className="text-sm text-gray-300 drop-shadow-lg">POINTS</div>
        </div>
      </div>
      
      {user && (
        <>
          <div className="mt-2 w-64 bg-background-card rounded-full h-4 overflow-hidden shadow-inner">
            <div 
              className="progress-bar bg-gradient-to-r from-primary to-secondary h-full" 
              style={{ 
                width: `${calculateLevelProgress(user.points, user.level)}%` 
              }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            <span>{formatNumber(pointsToNextLevel(user.points, user.level))}</span> points to level{" "}
            <span>{user.level + 1}</span>
          </div>
        </>
      )}
    </div>
  );
};

// Helper functions for level calculations
function calculateLevelProgress(points: number, level: number): number {
  const currentLevelThreshold = 1000 * Math.pow(level, 2);
  const nextLevelThreshold = 1000 * Math.pow(level + 1, 2);
  const progressPoints = points - currentLevelThreshold;
  const levelRange = nextLevelThreshold - currentLevelThreshold;
  
  return Math.min(100, Math.max(0, (progressPoints / levelRange) * 100));
}

function pointsToNextLevel(points: number, level: number): number {
  const nextLevelThreshold = 1000 * Math.pow(level + 1, 2);
  return Math.max(0, nextLevelThreshold - points);
}

export default Planet;
