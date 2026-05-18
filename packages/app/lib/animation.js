import { NativeModules, Platform } from 'react-native'

const isBrowserRuntime = typeof document !== 'undefined'
const isWebRuntime = Platform.OS === 'web' || process.env.EXPO_OS === 'web' || isBrowserRuntime

const nativeAnimatedModule = NativeModules?.NativeAnimatedModule

export const nativeDriver = !isWebRuntime && typeof nativeAnimatedModule?.startAnimatingNode === 'function'
