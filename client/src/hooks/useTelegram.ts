import { useState, useEffect, useMemo } from 'react';

interface UseTelegramReturn {
  telegramWebApp: Window['Telegram']['WebApp'] | null;
  telegramUser: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    start_param?: string;
  } | null;
  isDarkMode: boolean;
  themeParams: Window['Telegram']['WebApp']['themeParams'] | null;
}

export function useTelegram(): UseTelegramReturn {
  const [telegramWebApp, setTelegramWebApp] = useState<Window['Telegram']['WebApp'] | null>(null);
  
  useEffect(() => {
    // Check if Telegram WebApp is available
    if (window.Telegram?.WebApp) {
      setTelegramWebApp(window.Telegram.WebApp);
      
      // Expand the WebApp to occupy the full screen
      window.Telegram.WebApp.expand();
      
      // Mark the WebApp as ready
      window.Telegram.WebApp.ready();
    }
  }, []);
  
  // Extract user data from Telegram WebApp
  const telegramUser = useMemo(() => {
    if (!telegramWebApp?.initDataUnsafe.user) {
      return null;
    }
    
    const { id, first_name, last_name, username, photo_url } = telegramWebApp.initDataUnsafe.user;
    
    return {
      id,
      first_name,
      last_name,
      username,
      photo_url,
      start_param: telegramWebApp.initDataUnsafe.start_param
    };
  }, [telegramWebApp]);
  
  // Determine if dark mode is active
  const isDarkMode = useMemo(() => {
    return telegramWebApp?.colorScheme === 'dark';
  }, [telegramWebApp]);
  
  // Get theme parameters
  const themeParams = useMemo(() => {
    return telegramWebApp?.themeParams || null;
  }, [telegramWebApp]);
  
  return {
    telegramWebApp,
    telegramUser,
    isDarkMode,
    themeParams
  };
}
