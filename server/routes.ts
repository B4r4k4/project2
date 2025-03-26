import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import express from "express";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertGeneratorSchema, 
  insertActiveBoostSchema, 
  insertTaskSchema,
  GeneratorType,
  BoostType,
  TaskType,
  UpgradeType
} from "@shared/schema";
import crypto from "crypto";

// WebSocket connections
const clients = new Map();

// Helper to validate request body
const validateRequest = <T>(schema: z.ZodType<T>) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error during validation" });
      }
    }
  };
};

// Helper to generate referral code
const generateReferralCode = (length = 8) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

// Generate random time offset (for task expiry etc.)
const addHours = (date: Date, hours: number) => {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server with proper configuration for Replit
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws' // Specify a path for WebSocket connections
  });
  
  console.log('WebSocket server initialized on path: /ws');
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');
    const userId = req.url?.split('?userId=')[1];
    
    if (userId) {
      clients.set(userId, ws);
      console.log(`User ${userId} connected via WebSocket`);
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log(`Received WebSocket message: ${JSON.stringify(data)}`);
          
          // Handle different message types
          if (data.type === 'sync') {
            const user = await storage.getUserWithRelated(parseInt(userId));
            if (user) {
              ws.send(JSON.stringify({
                type: 'sync',
                data: user
              }));
              console.log(`Sent sync data to user ${userId}`);
            }
          }
        } catch (err) {
          console.error('WebSocket message error:', err);
        }
      });
      
      ws.on('close', () => {
        console.log(`User ${userId} disconnected`);
        clients.delete(userId);
      });
      
      // Send a welcome message to confirm connection
      ws.send(JSON.stringify({ 
        type: 'connection',
        message: 'Connected to server' 
      }));
    } else {
      console.log('WebSocket connection without userId');
    }
  });
  
  // Telegram auth validation - simplistic version for the MVP
  function validateTelegramAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    // In a real implementation, we'd validate the Telegram auth data
    // For now, we'll just pass it through
    next();
  }
  
  // AUTH ROUTES
  app.post('/api/auth/telegram', validateTelegramAuth, async (req, res) => {
    try {
      const { id, first_name, last_name, username, photo_url } = req.body;
      const telegramId = id.toString();
      
      // Check if user exists
      let user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        // Create new user
        const displayName = first_name + (last_name ? ` ${last_name}` : '');
        const referralCode = generateReferralCode();
        const now = new Date();
        
        user = await storage.createUser({
          username: username || `user_${telegramId}`,
          telegramId,
          displayName,
          avatarUrl: photo_url,
          points: 0,
          energy: 50,
          maxEnergy: 50,
          level: 1,
          referralCode,
          referredBy: req.body.start_param || null, // Referral code from deep link if any
          walletAddress: null,
          lastSeen: now,
        });
        
        // Create initial generators
        await storage.createGenerator({
          userId: user.id,
          type: GeneratorType.SATELLITE,
          level: 1,
          baseOutput: 10,
          currentOutput: 10,
          upgradeCost: 1200,
          isUnlocked: true,
        });
        
        // Create initial stats
        await storage.createStats({
          userId: user.id,
          totalTaps: 0,
          totalPointsEarned: 0,
          totalPointsSpent: 0,
        });
        
        // If referred by someone, give bonus to referrer
        if (user.referredBy) {
          const referrer = await storage.getUserByReferralCode(user.referredBy);
          if (referrer) {
            await storage.updateUser(referrer.id, {
              points: referrer.points + 250, // Bonus points for referral
              referralCount: referrer.referralCount + 1,
            });
            
            // Notify referrer via WebSocket if connected
            const referrerWs = clients.get(referrer.id.toString());
            if (referrerWs) {
              referrerWs.send(JSON.stringify({
                type: 'referralComplete',
                data: {
                  referralBonus: 250,
                  newUser: {
                    displayName: user.displayName,
                    id: user.id,
                  }
                }
              }));
            }
          }
        }
      } else {
        // Update existing user's last seen
        user = await storage.updateUser(user.id, {
          lastSeen: new Date(),
          avatarUrl: photo_url || user.avatarUrl,
        });
      }
      
      res.json({
        success: true,
        user: await storage.getUserWithRelated(user.id),
      });
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ success: false, message: 'Authentication failed' });
    }
  });
  
  // GAME ROUTES
  
  // Get user data with all related entities
  app.get('/api/user/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUserWithRelated(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Clean up expired boosts
      await storage.removeExpiredBoosts(userId);
      
      // Get fresh data after cleanup
      const updatedUser = await storage.getUserWithRelated(userId);
      res.json({ success: true, user: updatedUser });
      
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ success: false, message: 'Failed to get user data' });
    }
  });
  
  // Update user points (from tapping or other sources)
  app.post('/api/user/:id/points', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { points, source, energy } = req.body;
      
      // Validate points value
      if (typeof points !== 'number' || points <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid points value' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Update user points
      const updatedUser = await storage.updateUser(userId, {
        points: user.points + points,
        energy: typeof energy === 'number' ? energy : user.energy,
      });
      
      // Update stats based on source
      const userStats = await storage.getStats(userId);
      if (userStats) {
        if (source === 'tap') {
          await storage.updateStats(userId, {
            totalTaps: userStats.totalTaps + 1,
            totalPointsEarned: userStats.totalPointsEarned + points,
          });
        } else {
          await storage.updateStats(userId, {
            totalPointsEarned: userStats.totalPointsEarned + points,
          });
        }
      }
      
      // Check if user leveled up
      const level = Math.floor(1 + Math.sqrt(updatedUser.points / 1000));
      if (level > user.level) {
        await storage.updateUser(userId, { level });
      }
      
      res.json({ 
        success: true, 
        points: updatedUser.points,
        energy: updatedUser.energy,
        level: Math.max(level, user.level),
      });
      
    } catch (error) {
      console.error('Update points error:', error);
      res.status(500).json({ success: false, message: 'Failed to update points' });
    }
  });
  
  // Buy/upgrade generator
  app.post('/api/user/:id/generators', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { generatorId, newGenerator } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      if (generatorId) {
        // Upgrade existing generator
        const generator = await storage.getGenerator(generatorId);
        if (!generator || generator.userId !== userId) {
          return res.status(404).json({ success: false, message: 'Generator not found' });
        }
        
        // Check if user has enough points
        if (user.points < generator.upgradeCost) {
          return res.status(400).json({ success: false, message: 'Not enough points' });
        }
        
        // Update user points
        await storage.updateUser(userId, { 
          points: user.points - generator.upgradeCost 
        });
        
        // Update stats
        const userStats = await storage.getStats(userId);
        if (userStats) {
          await storage.updateStats(userId, {
            totalPointsSpent: userStats.totalPointsSpent + generator.upgradeCost,
          });
        }
        
        // Update generator
        const newLevel = generator.level + 1;
        const newOutput = generator.baseOutput * Math.pow(1.5, newLevel - 1);
        const newCost = generator.upgradeCost * 1.8;
        
        const updatedGenerator = await storage.updateGenerator(generatorId, {
          level: newLevel,
          currentOutput: newOutput,
          upgradeCost: newCost,
        });
        
        res.json({ 
          success: true, 
          generator: updatedGenerator,
          userPoints: user.points - generator.upgradeCost,
        });
      } else if (newGenerator) {
        // Unlock new generator
        const generatorSchema = insertGeneratorSchema.parse(newGenerator);
        
        // Check if user has enough points
        if (user.points < generatorSchema.upgradeCost) {
          return res.status(400).json({ success: false, message: 'Not enough points' });
        }
        
        // Update user points
        await storage.updateUser(userId, { 
          points: user.points - generatorSchema.upgradeCost 
        });
        
        // Update stats
        const userStats = await storage.getStats(userId);
        if (userStats) {
          await storage.updateStats(userId, {
            totalPointsSpent: userStats.totalPointsSpent + generatorSchema.upgradeCost,
          });
        }
        
        // Create new generator
        const generator = await storage.createGenerator({
          ...generatorSchema,
          userId,
          isUnlocked: true,
        });
        
        res.json({ 
          success: true, 
          generator,
          userPoints: user.points - generatorSchema.upgradeCost,
        });
      } else {
        return res.status(400).json({ success: false, message: 'Missing generator data' });
      }
      
    } catch (error) {
      console.error('Generator update error:', error);
      res.status(500).json({ success: false, message: 'Failed to update generator' });
    }
  });
  
  // Buy boost
  app.post('/api/user/:id/boosts', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { type, cost, duration, multiplier } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Check if user has enough points
      if (user.points < cost) {
        return res.status(400).json({ success: false, message: 'Not enough points' });
      }
      
      // Update user points
      await storage.updateUser(userId, { 
        points: user.points - cost 
      });
      
      // Update stats
      const userStats = await storage.getStats(userId);
      if (userStats) {
        await storage.updateStats(userId, {
          totalPointsSpent: userStats.totalPointsSpent + cost,
        });
      }
      
      // Special case for energy refill
      if (type === BoostType.ENERGY_REFILL) {
        await storage.updateUser(userId, { 
          energy: user.maxEnergy 
        });
        
        res.json({ 
          success: true, 
          userPoints: user.points - cost,
          energy: user.maxEnergy,
        });
        return;
      }
      
      // Create active boost
      const now = new Date();
      const expiresAt = addHours(now, duration);
      
      const boost = await storage.createActiveBoost({
        userId,
        type,
        multiplier,
        expiresAt,
      });
      
      res.json({ 
        success: true, 
        boost,
        userPoints: user.points - cost,
      });
      
    } catch (error) {
      console.error('Boost purchase error:', error);
      res.status(500).json({ success: false, message: 'Failed to purchase boost' });
    }
  });
  
  // Buy permanent upgrade
  app.post('/api/user/:id/upgrades', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { type, cost, value } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Check if user has enough points
      if (user.points < cost) {
        return res.status(400).json({ success: false, message: 'Not enough points' });
      }
      
      // Update user points
      await storage.updateUser(userId, { 
        points: user.points - cost 
      });
      
      // Update stats
      const userStats = await storage.getStats(userId);
      if (userStats) {
        await storage.updateStats(userId, {
          totalPointsSpent: userStats.totalPointsSpent + cost,
        });
      }
      
      // Apply upgrade based on type
      let updatedUser = user;
      
      if (type === UpgradeType.ENERGY_CAPACITY) {
        updatedUser = await storage.updateUser(userId, { 
          maxEnergy: user.maxEnergy + value,
          energy: user.energy + value, // Also give the extra energy right away
        });
      } else if (type === UpgradeType.MULTI_TAP) {
        // This is handled on the client side, just spend the points
      }
      
      res.json({ 
        success: true, 
        userPoints: updatedUser.points,
        maxEnergy: updatedUser.maxEnergy,
        energy: updatedUser.energy,
      });
      
    } catch (error) {
      console.error('Upgrade purchase error:', error);
      res.status(500).json({ success: false, message: 'Failed to purchase upgrade' });
    }
  });
  
  // Complete social task
  app.post('/api/user/:id/tasks/complete', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { taskId, taskType, reward } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      let task;
      
      if (taskId) {
        // Update existing task
        task = await storage.getTask(taskId);
        if (!task || task.userId !== userId) {
          return res.status(404).json({ success: false, message: 'Task not found' });
        }
        
        // Mark task as completed and update progress
        task = await storage.updateTask(taskId, {
          isCompleted: true,
          progress: task.target,
        });
      } else if (taskType) {
        // Create and complete a new social task
        const now = new Date();
        task = await storage.createTask({
          userId,
          type: taskType,
          name: 'Social Task',
          description: 'A completed social task',
          reward,
          progress: 1,
          target: 1,
          isCompleted: true,
          expiresAt: null,
          createdAt: now,
        });
      } else {
        return res.status(400).json({ success: false, message: 'Missing task data' });
      }
      
      // Award points to user
      const updatedUser = await storage.updateUser(userId, {
        points: user.points + task.reward,
      });
      
      // Update stats
      const userStats = await storage.getStats(userId);
      if (userStats) {
        await storage.updateStats(userId, {
          totalPointsEarned: userStats.totalPointsEarned + task.reward,
        });
      }
      
      res.json({ 
        success: true, 
        task,
        userPoints: updatedUser.points,
      });
      
    } catch (error) {
      console.error('Task completion error:', error);
      res.status(500).json({ success: false, message: 'Failed to complete task' });
    }
  });
  
  // Update task progress
  app.post('/api/user/:id/tasks/progress', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { taskId, progress } = req.body;
      
      if (!taskId || typeof progress !== 'number') {
        return res.status(400).json({ success: false, message: 'Invalid task data' });
      }
      
      const task = await storage.getTask(taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      
      // Update task progress
      const newProgress = Math.min(task.progress + progress, task.target);
      let updatedTask = await storage.updateTask(taskId, { progress: newProgress });
      
      // Check if task is now complete
      if (newProgress >= task.target && !task.isCompleted) {
        // Mark as completed
        updatedTask = await storage.updateTask(taskId, { isCompleted: true });
        
        // Award points to user
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateUser(userId, {
            points: user.points + task.reward,
          });
          
          // Update stats
          const userStats = await storage.getStats(userId);
          if (userStats) {
            await storage.updateStats(userId, {
              totalPointsEarned: userStats.totalPointsEarned + task.reward,
            });
          }
        }
      }
      
      res.json({ 
        success: true, 
        task: updatedTask,
      });
      
    } catch (error) {
      console.error('Task progress update error:', error);
      res.status(500).json({ success: false, message: 'Failed to update task progress' });
    }
  });
  
  // Save wallet address
  app.post('/api/user/:id/wallet', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ success: false, message: 'Wallet address is required' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, { walletAddress });
      
      res.json({ 
        success: true, 
        walletAddress: updatedUser.walletAddress,
      });
      
    } catch (error) {
      console.error('Wallet update error:', error);
      res.status(500).json({ success: false, message: 'Failed to update wallet' });
    }
  });
  
  return httpServer;
}
