import React from 'react';
import { View } from 'app/design/view';

export default function AnimatedView({ children, className, direction }) {
    return <View className={className}>{children}</View>;
} 