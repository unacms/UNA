import React from 'react';
import { View } from 'app/design/view';

function AnimatedView({ children, direction = 'down', className, delay = 0 }) {
    // direction is unused in CSS version for simplicity, but could be mapped to slide-in-from-top/bottom
    const slideClass = direction === 'up' ? 'slide-in-from-bottom-4' : 'slide-in-from-top-4';
    return <View className={`${className} animate-in fade-in ${slideClass} duration-500 fill-mode-both`} style={{ animationDelay: `${delay}ms` }}>{children}</View>;
};

export default React.memo(AnimatedView);