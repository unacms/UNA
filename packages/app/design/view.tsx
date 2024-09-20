import { 
    ScrollView as ReactNativeScrollView, 
    View as ReactNativeView, 
    Pressable as ReactNativePressable
} from 'react-native'
import { Link as SolitoLink } from 'solito/link'
import { styled } from 'nativewind'


export const View = styled(ReactNativeView)
export const ScrollView = styled(ReactNativeScrollView)
export const Pressable = styled(ReactNativePressable)
export const Row = styled(View, "flex-row")
export const Link = styled(SolitoLink)


