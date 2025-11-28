/**
 * Stub for react-native-reanimated on web
 * 
 * This file provides empty/noop exports to prevent crashes if any code
 * accidentally imports reanimated on web. All components should use
 * .web.js versions that don't import reanimated.
 * 
 * If you see this being used, check that the component has a .web.js version.
 */

import { View } from 'react-native';

// Noop function that returns its argument
const noop = (v) => v;
const noopObj = () => ({});
const noopFn = () => noop;

// Animated components - just return regular View
const Animated = {
  View,
  Text: View,
  Image: View,
  ScrollView: View,
  FlatList: View,
  SectionList: View,
  createAnimatedComponent: (component) => component,
};

// Hooks - return noop values
export const useSharedValue = (initial) => ({ value: initial });
export const useAnimatedStyle = noopObj;
export const useAnimatedProps = noopObj;
export const useDerivedValue = (fn) => ({ value: fn() });
export const useAnimatedScrollHandler = noopFn;
export const useAnimatedGestureHandler = noopFn;
export const useAnimatedReaction = noop;
export const useAnimatedRef = () => ({ current: null });
export const useScrollViewOffset = () => ({ value: 0 });
export const useReducedMotion = () => false;
export const useAnimatedKeyboard = () => ({ height: { value: 0 }, state: { value: 0 } });
export const useWorkletCallback = (fn) => fn;
export const useEvent = noopFn;
export const useHandler = noopFn;
export const useFrameCallback = noop;
export const useComposedEventHandler = noopFn;

// Animation functions - return identity
export const withTiming = noop;
export const withSpring = noop;
export const withDecay = noop;
export const withDelay = (_, animation) => animation;
export const withSequence = (...args) => args[0];
export const withRepeat = (animation) => animation;
export const cancelAnimation = noop;
export const runOnJS = (fn) => fn;
export const runOnUI = (fn) => fn;

// Easing
export const Easing = {
  linear: noop,
  ease: noop,
  quad: noop,
  cubic: noop,
  poly: noopFn,
  sin: noop,
  circle: noop,
  exp: noop,
  elastic: noopFn,
  back: noopFn,
  bounce: noop,
  bezier: noopFn,
  bezierFn: noopFn,
  in: noop,
  out: noop,
  inOut: noop,
};

// Interpolation
export const interpolate = (value) => value;
export const interpolateColor = (value) => value;
export const Extrapolate = {
  EXTEND: 'extend',
  CLAMP: 'clamp',
  IDENTITY: 'identity',
};
export const Extrapolation = Extrapolate;

// Layout animations - return empty objects
export const FadeIn = { duration: noop };
export const FadeOut = { duration: noop };
export const FadeInUp = { duration: noop };
export const FadeOutUp = { duration: noop };
export const FadeInDown = { duration: noop };
export const FadeOutDown = { duration: noop };
export const SlideInRight = { duration: noop };
export const SlideOutRight = { duration: noop };
export const SlideInLeft = { duration: noop };
export const SlideOutLeft = { duration: noop };
export const ZoomIn = { duration: noop };
export const ZoomOut = { duration: noop };
export const Layout = { duration: noop };
export const LinearTransition = { duration: noop };
export const SequencedTransition = { duration: noop };

// Other exports
export const enableLayoutAnimations = noop;
export const setGestureState = noop;
export const measure = () => null;
export const scrollTo = noop;
export const dispatchCommand = noop;
export const getRelativeCoords = () => ({ x: 0, y: 0 });

// Bottom sheet / gesture handler related
export const makeMutable = (initial) => ({ value: initial });
export const makeShareableCloneRecursive = noop;
export const isSharedValue = () => false;
export const createWorkletRuntime = noop;
export const runOnRuntime = noop;

// Keyboard related
export const KeyboardState = {
  UNKNOWN: 0,
  OPENING: 1,
  OPEN: 2,
  CLOSING: 3,
  CLOSED: 4,
};

// Reduced motion
export const ReduceMotion = {
  System: 'system',
  Always: 'always',
  Never: 'never',
};

// Default export
export default Animated;

