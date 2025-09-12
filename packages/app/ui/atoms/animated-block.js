import { View, Pressable } from 'app/design/view'

export default function AnimatedBlock({children}) {
    return <View className="u-max-width-block w-full mx-auto">{children}</View>
}