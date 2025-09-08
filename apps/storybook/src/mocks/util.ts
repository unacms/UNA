// Mock implementation of app/lib/util for Storybook
export const isWeb = true;

export const LAYOUT_BREAKPOINTS = {
  '2xl': 1536,
  xl: 1280,
  lg: 1024,
  md: 768,
  sm: 640
};

// Mock settings for typography
const mockSettings: Record<string, Record<string, any>> = {
  native: {
    use_custom_font: false
  }
};

export function appSetting(section: string, name: string, path?: string): any {
  const sectionData = mockSettings[section];
  if (!sectionData) return null;

  const value = sectionData[name];
  return path ? value?.[path] : value;
}

export function decodeText(text: string) {
  return text; // Simple pass-through for Storybook
}

export function normalizeClasses(className: string) {
  return className; // Simple pass-through for Storybook
}

// Mock other functions that might be imported
export function FeedbackHaptics() {
  // No-op for Storybook
}

export const UNA_URL = 'http://localhost:3000';
export const APP_URL = 'http://localhost:3000';

// Export other commonly used functions as no-ops
export function isObjectsEqual(obj: unknown, obj2: unknown): boolean {
  return JSON.stringify(obj) === JSON.stringify(obj2);
}

export async function subscribeOneSignal(): Promise<void> {
  // No-op for Storybook
}

export function useGlobalSearchParams(): Record<string, string> {
  return {};
}

export function cd(): string {
  return '';
}

export function getDomainFromUrl(): string {
  return '';
}

// Mock Platform - this should come from react-native mock
export const Platform = {
  OS: 'web' as const,
  select: (obj: Record<string, unknown>) => obj.web || obj.default,
};
