// Stub for expo-modules-core on web
// expo-document-picker and other Expo modules import Platform from expo-modules-core
// This provides a minimal Platform object for web compatibility

export const Platform = {
  OS: 'web',
  select: (options) => options.web ?? options.default,
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

export default {
  Platform,
  NativeModulesProxy,
  EventEmitter,
  requireNativeViewManager,
  requireNativeModule,
};

