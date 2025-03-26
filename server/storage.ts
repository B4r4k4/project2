import { 
  users, type User, type InsertUser,
  generators, type Generator, type InsertGenerator,
  activeBoosts, type ActiveBoost, type InsertActiveBoost,
  tasks, type Task, type InsertTask,
  stats, type Stats, type InsertStats,
  UserWithRelated
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getUserWithRelated(id: number): Promise<UserWithRelated | undefined>;
  
  // Generator operations
  getGenerators(userId: number): Promise<Generator[]>;
  getGenerator(id: number): Promise<Generator | undefined>;
  createGenerator(generator: InsertGenerator): Promise<Generator>;
  updateGenerator(id: number, generatorData: Partial<Generator>): Promise<Generator | undefined>;
  
  // Active boosts operations
  getActiveBoosts(userId: number): Promise<ActiveBoost[]>;
  getActiveBoost(id: number): Promise<ActiveBoost | undefined>;
  createActiveBoost(boost: InsertActiveBoost): Promise<ActiveBoost>;
  removeExpiredBoosts(userId: number): Promise<void>;
  
  // Tasks operations
  getTasks(userId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined>;
  
  // Stats operations
  getStats(userId: number): Promise<Stats | undefined>;
  createStats(stats: InsertStats): Promise<Stats>;
  updateStats(userId: number, statsData: Partial<Stats>): Promise<Stats | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private generators: Map<number, Generator>;
  private activeBoosts: Map<number, ActiveBoost>;
  private tasks: Map<number, Task>;
  private stats: Map<number, Stats>;
  userIdCounter: number;
  generatorIdCounter: number;
  activeBoostIdCounter: number;
  taskIdCounter: number;
  statsIdCounter: number;

  constructor() {
    this.users = new Map();
    this.generators = new Map();
    this.activeBoosts = new Map();
    this.tasks = new Map();
    this.stats = new Map();
    this.userIdCounter = 1;
    this.generatorIdCounter = 1;
    this.activeBoostIdCounter = 1;
    this.taskIdCounter = 1;
    this.statsIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.telegramId === telegramId
    );
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === referralCode
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      referralCount: 0,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserWithRelated(id: number): Promise<UserWithRelated | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const userGenerators = await this.getGenerators(id);
    const userActiveBoosts = await this.getActiveBoosts(id);
    const userTasks = await this.getTasks(id);
    const userStats = await this.getStats(id) || await this.createStats({
      userId: id,
      totalTaps: 0,
      totalPointsEarned: 0,
      totalPointsSpent: 0
    });

    return {
      ...user,
      generators: userGenerators,
      activeBoosts: userActiveBoosts,
      tasks: userTasks,
      stats: userStats
    };
  }

  // Generator operations
  async getGenerators(userId: number): Promise<Generator[]> {
    return Array.from(this.generators.values()).filter(
      (generator) => generator.userId === userId
    );
  }

  async getGenerator(id: number): Promise<Generator | undefined> {
    return this.generators.get(id);
  }

  async createGenerator(insertGenerator: InsertGenerator): Promise<Generator> {
    const id = this.generatorIdCounter++;
    const generator: Generator = { ...insertGenerator, id };
    this.generators.set(id, generator);
    return generator;
  }

  async updateGenerator(id: number, generatorData: Partial<Generator>): Promise<Generator | undefined> {
    const generator = this.generators.get(id);
    if (!generator) return undefined;
    
    const updatedGenerator = { ...generator, ...generatorData };
    this.generators.set(id, updatedGenerator);
    return updatedGenerator;
  }

  // Active boosts operations
  async getActiveBoosts(userId: number): Promise<ActiveBoost[]> {
    return Array.from(this.activeBoosts.values()).filter(
      (boost) => boost.userId === userId
    );
  }

  async getActiveBoost(id: number): Promise<ActiveBoost | undefined> {
    return this.activeBoosts.get(id);
  }

  async createActiveBoost(insertBoost: InsertActiveBoost): Promise<ActiveBoost> {
    const id = this.activeBoostIdCounter++;
    const now = new Date();
    const boost: ActiveBoost = { ...insertBoost, id, createdAt: now };
    this.activeBoosts.set(id, boost);
    return boost;
  }

  async removeExpiredBoosts(userId: number): Promise<void> {
    const now = new Date();
    const userBoosts = await this.getActiveBoosts(userId);
    
    for (const boost of userBoosts) {
      if (boost.expiresAt < now) {
        this.activeBoosts.delete(boost.id);
      }
    }
  }

  // Tasks operations
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const task: Task = { ...insertTask, id, createdAt: now };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Stats operations
  async getStats(userId: number): Promise<Stats | undefined> {
    return Array.from(this.stats.values()).find(
      (stat) => stat.userId === userId
    );
  }

  async createStats(insertStats: InsertStats): Promise<Stats> {
    const id = this.statsIdCounter++;
    const stats: Stats = { ...insertStats, id };
    this.stats.set(id, stats);
    return stats;
  }

  async updateStats(userId: number, statsData: Partial<Stats>): Promise<Stats | undefined> {
    const userStats = await this.getStats(userId);
    if (!userStats) return undefined;
    
    const updatedStats = { ...userStats, ...statsData };
    this.stats.set(userStats.id, updatedStats);
    return updatedStats;
  }
}

export const storage = new MemStorage();
