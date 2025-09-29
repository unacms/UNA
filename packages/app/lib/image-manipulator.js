// Conditional import for expo-image-manipulator to avoid web build issues
import { Platform } from 'react-native'

let manipulateAsync, SaveFormat

if (Platform.OS !== 'web') {
  try {
    const manipModule = require('expo-image-manipulator')
    manipulateAsync = manipModule.manipulateAsync
    SaveFormat = manipModule.SaveFormat
  } catch (e) {
    console.warn('expo-image-manipulator not available:', e.message)
    manipulateAsync = null
    SaveFormat = {}
  }
} else {
  manipulateAsync = null
  SaveFormat = {}
}

export { manipulateAsync, SaveFormat }
