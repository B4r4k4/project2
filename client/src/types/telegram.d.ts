declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready(): void;
        close(): void;
        expand(): void;
        initData: string;
        initDataUnsafe: {
          query_id: string;
          user: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          auth_date: number;
          hash: string;
          start_param?: string;
        };
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
          secondary_bg_color: string;
        };
        onEvent(eventType: string, eventHandler: (...args: any[]) => void): void;
        offEvent(eventType: string, eventHandler: (...args: any[]) => void): void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText(text: string): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          showProgress(leaveActive: boolean): void;
          hideProgress(): void;
        };
        BackButton: {
          isVisible: boolean;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
          show(): void;
          hide(): void;
        };
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
          selectionChanged(): void;
        };
        openLink(url: string): void;
        openTelegramLink(url: string): void;
        openInvoice(url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void): void;
        showPopup(params: { title?: string; message: string; buttons?: Array<{ type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text: string; }> }, callback?: (buttonId: string) => void): void;
        showAlert(message: string, callback?: () => void): void;
        showConfirm(message: string, callback?: (isConfirmed: boolean) => void): void;
        showScanQrPopup(params: { text?: string }, callback?: (text: string) => void): void;
        closeScanQrPopup(): void;
        readTextFromClipboard(callback?: (text: string) => void): void;
        isVersionAtLeast(version: string): boolean;
        setHeaderColor(color: string): void;
        setBackgroundColor(color: string): void;
        enableClosingConfirmation(): void;
        disableClosingConfirmation(): void;
        cloudStorage: {
          setItem(key: string, value: string, callback?: (error: Error | null, stored: boolean) => void): void;
          getItem(key: string, callback?: (error: Error | null, value: string | null) => void): void;
          getItems(keys: string[], callback?: (error: Error | null, values: { [key: string]: string | null }) => void): void;
          removeItem(key: string, callback?: (error: Error | null, removed: boolean) => void): void;
          removeItems(keys: string[], callback?: (error: Error | null, removed: boolean) => void): void;
          getKeys(callback?: (error: Error | null, keys: string[]) => void): void;
        };
      };
    };
  }
}

export {};
