import 'react-native'

declare module 'react-native' {
    interface TextProps {
        className?: string
    }

    interface ViewProps {
        className?: string
    }

    interface PressableProps {
        className?: string
    }

    interface TextInputProps {
        className?: string
    }

    interface ImagePropsBase {
        className?: string
    }
}