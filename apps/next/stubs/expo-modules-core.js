// Stub for expo-modules-core on web
// expo-document-picker, expo-location and other Expo modules need these exports
// This provides minimal compatibility for web

export const Platform = {
  OS: 'web',
  select: (options) => options.web ?? options.default,
};

// Error classes для expo-auth-session и других модулей
export class CodedError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'CodedError';
  }
}

export class UnavailabilityError extends Error {
  constructor(moduleName, methodName) {
    super(`The method or property ${moduleName}.${methodName} is not available on this platform.`);
    this.name = 'UnavailabilityError';
    this.code = 'ERR_UNAVAILABLE';
  }
}

// Permission hooks для expo-location и других модулей
export const PermissionStatus = {
  GRANTED: 'granted',
  UNDETERMINED: 'undetermined',
  DENIED: 'denied',
};

// Создает hook для разрешений (возвращает заглушку для веба)
export const createPermissionHook = (permissionMethod) => {
  return () => {
    // На вебе возвращаем granted по умолчанию
    return [
      { status: PermissionStatus.GRANTED, granted: true },
      async () => ({ status: PermissionStatus.GRANTED, granted: true }),
      async () => ({ status: PermissionStatus.GRANTED, granted: true }),
    ];
  };
};

// Export other commonly used items as no-ops
export const NativeModulesProxy = {};

export const EventEmitter = class EventEmitter {
  addListener() { return { remove: () => {} }; }
  removeAllListeners() {}
  emit() {}
};

export const requireNativeViewManager = () => () => null;
export const requireNativeModule = () => ({});
export const requireOptionalNativeModule = () => null; // ← ДОБАВИТЬ ЭТУ СТРОКУ

// UUID generator заглушка
export const uuid = {
  v4: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

export default {
  Platform,
  CodedError,
  UnavailabilityError,
  NativeModulesProxy,
  EventEmitter,
  requireNativeViewManager,
  requireNativeModule,
  requireOptionalNativeModule, // ← И ДОБАВИТЬ В DEFAULT EXPORT
  createPermissionHook,
  PermissionStatus,
  uuid,
};