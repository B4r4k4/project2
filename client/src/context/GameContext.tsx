import React, { createContext, useReducer, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserWithRelated, Task, Generator, ActiveBoost, GeneratorType, BoostType, UpgradeType, TaskType } from "@shared/schema";

// Game state types
type GameTab = 'main-game-view' | 'shop-view' | 'tasks-view' | 'referrals-view' | 'wallet-view';

interface GameState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserWithRelated | null;
  currentTab: GameTab;
  pointsPerTap: number;
  error: string | null;
  webSocketConnected: boolean;
}

type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  start_param?: string;
};

// Action types
type GameAction =
  | { type: 'AUTHENTICATE_SUCCESS'; payload: UserWithRelated }
  | { type: 'AUTHENTICATE_FAILURE'; payload: string }
  | { type: 'UPDATE_USER'; payload: Partial<UserWithRelated> }
  | { type: 'UPDATE_POINTS'; payload: number }
  | { type: 'UPDATE_ENERGY'; payload: number }
  | { type: 'ADD_GENERATOR'; payload: Generator }
  | { type: 'UPDATE_GENERATOR'; payload: Generator }
  | { type: 'ADD_BOOST'; payload: ActiveBoost }
  | { type: 'REMOVE_BOOST'; payload: number }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'SWITCH_TAB'; payload: GameTab }
  | { type: 'SET_POINTS_PER_TAP'; payload: number }
  | { type: 'SET_WEBSOCKET_CONNECTED'; payload: boolean };

// Context interface
interface GameContextProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  authenticateWithTelegram: (user: TelegramUser) => Promise<void>;
  switchTab: (tab: GameTab) => void;
  tapPlanet: () => Promise<void>;
  purchaseGenerator: (generator: Generator) => Promise<void>;
  unlockGenerator: (type: GeneratorType, cost: number) => Promise<void>;
  purchaseBoost: (type: BoostType, cost: number, duration: number, multiplier: number) => Promise<void>;
  purchaseUpgrade: (type: UpgradeType, cost: number, value: number) => Promise<void>;
  completeTask: (taskId: number | null, taskType: TaskType | null, reward: number) => Promise<void>;
  connectWallet: (address: string) => Promise<void>;
  isAuthenticated: boolean;
  user: UserWithRelated | null;
  currentTab: GameTab;
  isLoading: boolean;
  pointsPerTap: number;
  pointsPerSecond: number;
}

// Initial state
const initialState: GameState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  currentTab: 'main-game-view',
  pointsPerTap: 10,
  error: null,
  webSocketConnected: false,
};

// Reducer function
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'AUTHENTICATE_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload,
        error: null,
      };
    case 'AUTHENTICATE_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'UPDATE_POINTS':
      return {
        ...state,
        user: state.user ? { ...state.user, points: action.payload } : null,
      };
    case 'UPDATE_ENERGY':
      return {
        ...state,
        user: state.user ? { ...state.user, energy: action.payload } : null,
      };
    case 'ADD_GENERATOR':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          generators: [...state.user.generators, action.payload],
        } : null,
      };
    case 'UPDATE_GENERATOR':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          generators: state.user.generators.map(gen => 
            gen.id === action.payload.id ? action.payload : gen
          ),
        } : null,
      };
    case 'ADD_BOOST':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          activeBoosts: [...state.user.activeBoosts, action.payload],
        } : null,
      };
    case 'REMOVE_BOOST':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          activeBoosts: state.user.activeBoosts.filter(boost => 
            boost.id !== action.payload
          ),
        } : null,
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          tasks: state.user.tasks.map(task => 
            task.id === action.payload.id ? action.payload : task
          ),
        } : null,
      };
    case 'SWITCH_TAB':
      return {
        ...state,
        currentTab: action.payload,
      };
    case 'SET_POINTS_PER_TAP':
      return {
        ...state,
        pointsPerTap: action.payload,
      };
    case 'SET_WEBSOCKET_CONNECTED':
      return {
        ...state,
        webSocketConnected: action.payload,
      };
    default:
      return state;
  }
};

// Create context
export const GameContext = createContext<GameContextProps>({
  state: initialState,
  dispatch: () => null,
  authenticateWithTelegram: async () => {},
  switchTab: () => {},
  tapPlanet: async () => {},
  purchaseGenerator: async () => {},
  unlockGenerator: async () => {},
  purchaseBoost: async () => {},
  purchaseUpgrade: async () => {},
  completeTask: async () => {},
  connectWallet: async () => {},
  isAuthenticated: false,
  user: null,
  currentTab: 'main-game-view',
  isLoading: true,
  pointsPerTap: 10,
  pointsPerSecond: 0,
});

// Context provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const pointsIntervalRef = useRef<number | null>(null);
  
  // Calculate points per second
  const pointsPerSecond = useCallback(() => {
    if (!state.user) return 0;
    
    // Base points from generators
    let total = state.user.generators
      .filter(g => g.isUnlocked)
      .reduce((sum, gen) => sum + gen.currentOutput, 0);
    
    // Apply active boosts
    const autoBoost = state.user.activeBoosts.find(b => b.type === BoostType.AUTO_BOOST);
    if (autoBoost) {
      total *= autoBoost.multiplier;
    }
    
    return total;
  }, [state.user]);
  
  // Calculate points per tap with active boosts
  const calculatePointsPerTap = useCallback(() => {
    if (!state.user) return 10; // Default value
    
    // Base tap value
    let tapValue = 10;
    
    // Apply tap boosts
    const tapBoost = state.user.activeBoosts.find(b => b.type === BoostType.DOUBLE_TAP);
    if (tapBoost) {
      tapValue *= tapBoost.multiplier;
    }
    
    return tapValue;
  }, [state.user]);
  
  // Set points per tap whenever user data changes
  useEffect(() => {
    dispatch({ type: 'SET_POINTS_PER_TAP', payload: calculatePointsPerTap() });
  }, [calculatePointsPerTap]);
  
  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    if (state.user && !wsRef.current) {
      try {
        // Use safer URL construction for WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // Important: Use the /ws path that was set up in the server
        const wsUrl = `${protocol}//${host}/ws?userId=${state.user.id}`;
        
        console.log('Connecting to WebSocket at:', wsUrl);
        
        // Create new WebSocket connection
        wsRef.current = new WebSocket(wsUrl);
        
        // Connection opened handler
        wsRef.current.onopen = () => {
          console.log('WebSocket connection established');
          dispatch({ type: 'SET_WEBSOCKET_CONNECTED', payload: true });
          
          // Request initial sync
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'sync' }));
          }
        };
        
        // Connection closed handler
        wsRef.current.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          dispatch({ type: 'SET_WEBSOCKET_CONNECTED', payload: false });
          // Reset the WebSocket ref so we can try to reconnect later
          wsRef.current = null;
        };
        
        // Error handler
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          dispatch({ type: 'SET_WEBSOCKET_CONNECTED', payload: false });
        };
        
        // Message handler
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data.type);
            
            if (data.type === 'sync' && data.data) {
              dispatch({ type: 'AUTHENTICATE_SUCCESS', payload: data.data });
            } else if (data.type === 'referralComplete') {
              // Handle referral notification
              if (state.user) {
                dispatch({
                  type: 'UPDATE_USER',
                  payload: {
                    points: state.user.points + data.data.referralBonus,
                    referralCount: state.user.referralCount + 1,
                  },
                });
              }
            }
          } catch (err) {
            console.error('WebSocket message parsing error:', err);
          }
        };
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
      }
    }
    
    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [state.user]);
  
  // Set up passive point generation interval
  useEffect(() => {
    if (state.user && pointsPerSecond() > 0) {
      // Clear existing interval if any
      if (pointsIntervalRef.current) {
        window.clearInterval(pointsIntervalRef.current);
      }
      
      // Update points every second
      pointsIntervalRef.current = window.setInterval(() => {
        if (state.user) {
          const pointsToAdd = pointsPerSecond() / 10; // smoother updates (10 times per second)
          dispatch({
            type: 'UPDATE_POINTS',
            payload: state.user.points + pointsToAdd,
          });
          
          // Sync with server every 10 seconds
          const now = new Date().getTime();
          if (now % 10000 < 100 && state.user) {
            apiRequest('POST', `/api/user/${state.user.id}/points`, {
              points: pointsToAdd * 10,
              source: 'passive',
            }).catch(console.error);
          }
        }
      }, 100); // 10 times per second for smooth UI updates
      
      return () => {
        if (pointsIntervalRef.current) {
          window.clearInterval(pointsIntervalRef.current);
        }
      };
    }
  }, [state.user, pointsPerSecond]);
  
  // Function to authenticate with Telegram
  const authenticateWithTelegram = async (telegramUser: TelegramUser) => {
    try {
      const response = await apiRequest('POST', '/api/auth/telegram', telegramUser);
      const data = await response.json();
      
      if (data.success && data.user) {
        dispatch({ type: 'AUTHENTICATE_SUCCESS', payload: data.user });
      } else {
        dispatch({ type: 'AUTHENTICATE_FAILURE', payload: data.message || 'Authentication failed' });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      dispatch({ type: 'AUTHENTICATE_FAILURE', payload: 'Failed to connect to server' });
    }
  };
  
  // Function to switch tabs
  const switchTab = (tab: GameTab) => {
    dispatch({ type: 'SWITCH_TAB', payload: tab });
  };
  
  // Game actions
  const tapPlanet = async () => {
    if (!state.user) return;
    
    // Optimistically update points in UI
    dispatch({ type: 'UPDATE_POINTS', payload: state.user.points + state.pointsPerTap });
    
    // Check energy
    const newEnergy = Math.max(0, state.user.energy - 1);
    dispatch({ type: 'UPDATE_ENERGY', payload: newEnergy });
    
    try {
      const response = await apiRequest('POST', `/api/user/${state.user.id}/points`, {
        points: state.pointsPerTap,
        source: 'tap',
        energy: newEnergy,
      });
      const data = await response.json();
      
      if (data.success) {
        // Update with server values
        dispatch({ type: 'UPDATE_POINTS', payload: data.points });
        dispatch({ type: 'UPDATE_ENERGY', payload: data.energy });
        
        // Update level if needed
        if (data.level && data.level !== state.user.level) {
          dispatch({ type: 'UPDATE_USER', payload: { level: data.level } });
        }
      }
    } catch (error) {
      console.error('Error updating points:', error);
      // Revert optimistic update on error
      if (state.user) {
        dispatch({ type: 'UPDATE_POINTS', payload: state.user.points });
        dispatch({ type: 'UPDATE_ENERGY', payload: state.user.energy });
      }
    }
  };
  
  // Purchase or upgrade generator
  const purchaseGenerator = async (generator: Generator) => {
    if (!state.user) return;
    
    try {
      const response = await apiRequest('POST', `/api/user/${state.user.id}/generators`, {
        generatorId: generator.id,
      });
      const data = await response.json();
      
      if (data.success) {
        // Update generator and user points
        dispatch({ type: 'UPDATE_GENERATOR', payload: data.generator });
        dispatch({ type: 'UPDATE_POINTS', payload: data.userPoints });
      }
    } catch (error) {
      console.error('Error upgrading generator:', error);
    }
  };
  
  // Unlock new generator
  const unlockGenerator = async (type: GeneratorType, cost: number) => {
    if (!state.user) return;
    
    try {
      const newGenerator = {
        userId: state.user.id,
        type,
        level: 1,
        baseOutput: getBaseOutputForType(type),
        currentOutput: getBaseOutputForType(type),
        upgradeCost: cost * 1.8, // Next upgrade cost
        isUnlocked: true,
      };
      
      const response = await apiRequest('POST', `/api/user/${state.user.id}/generators`, {
        newGenerator,
      });
      const data = await response.json();
      
      if (data.success) {
        // Add new generator and update user points
        dispatch({ type: 'ADD_GENERATOR', payload: data.generator });
        dispatch({ type: 'UPDATE_POINTS', payload: data.userPoints });
      }
    } catch (error) {
      console.error('Error unlocking generator:', error);
    }
  };
  
  // Helper function to get base output for generator type
  const getBaseOutputForType = (type: GeneratorType): number => {
    switch (type) {
      case GeneratorType.SATELLITE:
        return 10;
      case GeneratorType.STATION:
        return 25;
      case GeneratorType.MOON_BASE:
        return 40;
      case GeneratorType.COLONY:
        return 100;
      default:
        return 10;
    }
  };
  
  // Purchase a boost
  const purchaseBoost = async (type: BoostType, cost: number, duration: number, multiplier: number) => {
    if (!state.user) return;
    
    try {
      const response = await apiRequest('POST', `/api/user/${state.user.id}/boosts`, {
        type,
        cost,
        duration,
        multiplier,
      });
      const data = await response.json();
      
      if (data.success) {
        // Update user points
        dispatch({ type: 'UPDATE_POINTS', payload: data.userPoints });
        
        // Handle energy refill specially
        if (type === BoostType.ENERGY_REFILL && data.energy) {
          dispatch({ type: 'UPDATE_ENERGY', payload: data.energy });
        } else if (data.boost) {
          // Add boost
          dispatch({ type: 'ADD_BOOST', payload: data.boost });
        }
      }
    } catch (error) {
      console.error('Error purchasing boost:', error);
    }
  };
  
  // Purchase a permanent upgrade
  const purchaseUpgrade = async (type: UpgradeType, cost: number, value: number) => {
    if (!state.user) return;
    
    try {
      const response = await apiRequest('POST', `/api/user/${state.user.id}/upgrades`, {
        type,
        cost,
        value,
      });
      const data = await response.json();
      
      if (data.success) {
        // Update user data
        const updates: Partial<UserWithRelated> = {
          points: data.userPoints,
        };
        
        if (type === UpgradeType.ENERGY_CAPACITY) {
          updates.maxEnergy = data.maxEnergy;
          updates.energy = data.energy;
        }
        
        dispatch({ type: 'UPDATE_USER', payload: updates });
      }
    } catch (error) {
      console.error('Error purchasing upgrade:', error);
    }
  };
  
  // Complete a task
  const completeTask = async (taskId: number | null, taskType: TaskType | null, reward: number) => {
    if (!state.user) return;
    
    try {
      const response = await apiRequest('POST', `/api/user/${state.user.id}/tasks/complete`, {
        taskId,
        taskType,
        reward,
      });
      const data = await response.json();
      
      if (data.success) {
        if (taskId) {
          // Update existing task
          dispatch({ type: 'UPDATE_TASK', payload: data.task });
        } else {
          // Add completed task to list if it's a new task
          const newTask: Task = data.task;
          dispatch({
            type: 'UPDATE_USER',
            payload: {
              tasks: [...state.user.tasks, newTask],
            },
          });
        }
        
        // Update points
        dispatch({ type: 'UPDATE_POINTS', payload: data.userPoints });
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };
  
  // Connect TON wallet
  const connectWallet = async (walletAddress: string) => {
    if (!state.user) return;
    
    try {
      const response = await apiRequest('POST', `/api/user/${state.user.id}/wallet`, {
        walletAddress,
      });
      const data = await response.json();
      
      if (data.success) {
        dispatch({
          type: 'UPDATE_USER',
          payload: { walletAddress: data.walletAddress },
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };
  
  // Context value
  const contextValue: GameContextProps = {
    state,
    dispatch,
    authenticateWithTelegram,
    switchTab,
    tapPlanet,
    purchaseGenerator,
    unlockGenerator,
    purchaseBoost,
    purchaseUpgrade,
    completeTask,
    connectWallet,
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    currentTab: state.currentTab,
    isLoading: state.isLoading,
    pointsPerTap: state.pointsPerTap,
    pointsPerSecond: pointsPerSecond(),
  };
  
  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};
