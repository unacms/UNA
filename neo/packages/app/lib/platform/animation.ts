import { NativeModules } from 'react-native'
import { isWeb } from 'app/lib/util'

const nativeAnimatedModule = NativeModules?.NativeAnimatedModule

export const nativeDriver = !isWeb && typeof nativeAnimatedModule?.startAnimatingNode === 'function'
