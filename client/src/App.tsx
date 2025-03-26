import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import MainHeader from "@/components/MainHeader";
import BottomNav from "@/components/BottomNav";
import GameContent from "@/components/GameContent";
import NotFound from "@/pages/not-found";
import { useGameState } from "@/hooks/useGameState";
import { useTelegram } from "@/hooks/useTelegram";
import { useToast } from "@/hooks/use-toast";

function App() {
  const { isAuthenticated, user, authenticateWithTelegram } = useGameState();
  const { telegramUser } = useTelegram();
  const { toast } = useToast();

  // Handle Telegram authentication
  useEffect(() => {
    if (telegramUser && !isAuthenticated) {
      authenticateWithTelegram(telegramUser)
        .catch(error => {
          toast({
            title: "Authentication Error",
            description: "Failed to authenticate with Telegram",
            variant: "destructive",
          });
          console.error("Authentication error:", error);
        });
    }
  }, [telegramUser, isAuthenticated, authenticateWithTelegram, toast]);

  // If not authenticated or loading, show minimal UI
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-background-light mx-auto mb-4 animate-pulse"></div>
          <h1 className="text-xl font-bold text-white mb-2">Planet Tycoon</h1>
          <p className="text-gray-400 text-sm">Connecting to your galaxy...</p>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-dark text-white font-nunito">
      <MainHeader />
      
      <Switch>
        <Route path="/">
          <GameContent />
        </Route>
        <Route component={NotFound} />
      </Switch>
      
      <BottomNav />
      <Toaster />
    </div>
  );
}

export default App;
