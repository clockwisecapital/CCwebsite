/**
 * Type definitions for Gleap SDK
 */

export interface GleapInstance {
  setAppTheme?: (theme: Record<string, string>) => void;
  openWidget?: () => void;
  open?: () => void;
}

export interface GleapSDK {
  initialize: (apiKey: string) => void;
  enableAIToolMode?: (enable: boolean) => void;
  setWidgetMode?: (mode: string) => void;
  setBotName?: (name: string) => void;
  showFeedbackButton?: (show: boolean) => void;
  getInstance?: () => GleapInstance;
  open?: () => void;
  openConversation?: () => void;
  startBot?: (botId?: string, showBackButton?: boolean) => void;
}

// Global window declaration
declare global {
  interface Window {
    Gleap?: GleapSDK;
    GleapInstance?: GleapSDK;
  }
}
