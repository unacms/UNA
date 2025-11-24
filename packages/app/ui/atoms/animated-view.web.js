import React from 'react';
import { View } from 'app/design/view';

function AnimatedView({ children, direction = 'down', className, delay = 0 }) {
    return <View className={className}>{children}</View>;
};

export default React.memo(AnimatedView);