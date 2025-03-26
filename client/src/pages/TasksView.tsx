import React from "react";
import { motion } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { formatNumber } from "@/utils/formatters";
import { TaskType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const TasksView: React.FC = () => {
  const { user, completeTask } = useGameState();
  const { toast } = useToast();
  
  const handleCompleteTask = (taskId: number | null, taskType: TaskType | null, reward: number) => {
    if (!user) return;
    
    completeTask(taskId, taskType, reward)
      .then(() => {
        toast({
          title: "Task Completed",
          description: `You received ${formatNumber(reward)} points!`,
          variant: "default",
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to complete task. Please try again.",
          variant: "destructive",
        });
      });
  };
  
  if (!user) return null;
  
  // Filter tasks by type
  const socialTasks = [
    {
      id: null,
      type: TaskType.SOCIAL,
      name: "Join Telegram Channel",
      description: "Join our official Telegram channel",
      reward: 1000,
      completed: false,
    },
    {
      id: null,
      type: TaskType.SOCIAL,
      name: "Watch YouTube Video",
      description: "Watch our tutorial video",
      reward: 500,
      completed: false,
    }
  ];
  
  // Get daily tasks from the user
  const dailyTasks = user.tasks.filter(task => task.type === TaskType.DAILY);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-3"
    >
      <div className="mb-3">
        <h2 className="text-xl font-poppins font-bold">Tasks</h2>
        <p className="text-sm text-gray-400">Complete tasks to earn rewards</p>
      </div>
      
      <div className="bg-background-card rounded-lg p-3 mb-4">
        <h3 className="text-lg font-bold mb-2">Social Tasks</h3>
        
        <div className="space-y-3">
          {socialTasks.map((task, index) => (
            <div key={index} className="p-2 bg-background-light rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mr-2">
                    {task.name.includes("Telegram") ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.05-.2-.06-.06-.17-.04-.25-.02-.11.02-1.84 1.17-5.21 3.42-.49.33-.94.5-1.35.48-.44-.02-1.29-.25-1.92-.46-.78-.26-1.39-.4-1.34-.85.03-.22.27-.45.74-.68 2.87-1.25 4.79-2.08 5.76-2.49 2.73-1.15 3.29-1.35 3.66-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.08-.01.18-.02.27z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-bold">{task.name}</div>
                    <div className="text-xs text-gray-400">{task.description}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-accent">+{formatNumber(task.reward)} points</div>
              </div>
              <button 
                className="w-full bg-secondary text-white rounded py-2 text-sm font-bold"
                onClick={() => handleCompleteTask(task.id, task.type, task.reward)}
              >
                Complete Task
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-background-card rounded-lg p-3 mb-4">
        <h3 className="text-lg font-bold mb-2">Daily Tasks</h3>
        
        <div className="space-y-3">
          {dailyTasks.length > 0 ? (
            dailyTasks.map(task => (
              <div key={task.id} className="p-2 bg-background-light rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold">{task.name}</div>
                    <div className="text-xs text-gray-400">
                      Progress: {formatNumber(task.progress)}/{formatNumber(task.target)}
                    </div>
                    <div className="w-full bg-background-dark rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-success h-full rounded-full" 
                        style={{ width: `${Math.min(100, (task.progress / task.target) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-accent">+{formatNumber(task.reward)} points</div>
                </div>
                {task.isCompleted && (
                  <div className="text-xs text-success font-bold text-center">
                    ✓ Completed
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-2">
              <p>No daily tasks available.</p>
              <p className="text-xs mt-1">Keep playing to unlock daily tasks!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TasksView;
