import React from 'react';
import { View } from 'app/design/view';

function AnimatedCard({ children }) {
    return <View className="animate-in fade-in slide-in-from-bottom-8 duration-700">{children}</View>;
};

export default React.memo(AnimatedCard); 