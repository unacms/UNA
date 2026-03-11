import React from 'react';
import { View } from 'app/design/view';

function AnimatedCard({ children }) {
    return <View className="  ">{children}</View>;
};

export default React.memo(AnimatedCard); 