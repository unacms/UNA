/**
 * Toast Primitive
 * 
 * This module provides a unified toast API for both web and native platforms.
 * 
 * Web: Uses 'sonner' (https://sonner.emilkowal.ski)
 * Native: Uses 'sonner-native' (https://github.com/gunnartorfis/sonner-native)
 * 
 * Usage:
 * 
 * 1. Add <Toaster /> to your app root (layout.js or App.tsx)
 * 2. Import { toast } from 'app/ui/primitives/toast' and call toast()
 * 
 * @example
 * // Show a basic toast
 * toast('Hello World');
 * 
 * // Show success toast
 * toast.success('Operation completed!');
 * 
 * // Show error toast
 * toast.error('Something went wrong');
 * 
 * // Show with description
 * toast('Event created', { description: 'Your event has been scheduled.' });
 * 
 * // Show promise toast
 * toast.promise(fetchData(), {
 *   loading: 'Loading...',
 *   success: 'Data loaded!',
 *   error: 'Failed to load data',
 * });
 * 
 * // Dismiss toast
 * const toastId = toast('Hello');
 * toast.dismiss(toastId);
 * 
 * // Custom duration
 * toast('Message', { duration: 5000 });
 */

// Re-export from platform-specific implementations
// The actual exports come from toaster.js (native) or toaster.web.js (web)
// This file serves as documentation and type definitions

/**
 * @typedef {Object} ToastOptions
 * @property {string} [description] - Additional description text
 * @property {number} [duration] - Duration in ms (default: 4000)
 * @property {string} [id] - Custom toast ID
 * @property {boolean} [important] - Mark toast as important
 * @property {Function} [onDismiss] - Callback when toast is dismissed
 * @property {Function} [onAutoClose] - Callback when toast auto-closes
 * @property {Object} [action] - Action button config { label: string, onClick: Function }
 * @property {Object} [cancel] - Cancel button config { label: string, onClick: Function }
 * @property {boolean} [dismissible] - Whether toast can be dismissed by swiping
 * @property {React.ReactNode} [icon] - Custom icon
 */

/**
 * @typedef {Object} ToasterProps
 * @property {'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right'} [position] - Position of toasts
 * @property {boolean} [expand] - Expand toasts by default
 * @property {number} [duration] - Default duration for all toasts
 * @property {number} [visibleToasts] - Maximum visible toasts
 * @property {boolean} [closeButton] - Show close button
 * @property {boolean} [richColors] - Use rich colors for variants
 * @property {'light'|'dark'|'system'} [theme] - Theme mode
 * @property {Object} [toastOptions] - Default options for all toasts
 */

// Platform detection for documentation purposes
export const TOAST_PLATFORMS = {
  WEB: 'sonner',
  NATIVE: 'sonner-native',
};

// Common toast types/variants
export const TOAST_TYPES = {
  DEFAULT: 'default',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading',
  PROMISE: 'promise',
  CUSTOM: 'custom',
};

// Default positions
export const TOAST_POSITIONS = {
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center',
  BOTTOM_RIGHT: 'bottom-right',
};

