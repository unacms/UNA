import { 
    TouchableOpacity as ReactNativeTouchableOpacity, 
    ScrollView as ReactNativeScrollView, 
    View as ReactNativeView, 
    SafeAreaView as ReactNativeSafeAreaView,
    FlatList as ReactNativeFlatList
} from 'react-native'
import { Link as SolitoLink } from 'solito/link'

import { styled } from 'nativewind'

export const View = styled(ReactNativeView)
export const ScrollView = styled(ReactNativeScrollView)
export const SafeAreaView = styled(ReactNativeSafeAreaView)
export const TouchableOpacity = styled(ReactNativeTouchableOpacity)
export const FlatList = styled(ReactNativeFlatList)
export const Row = styled(View, "flex-row")
export const Link = styled(SolitoLink)
