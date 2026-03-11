import React from 'react';
import { View } from 'app/design/view';

function AnimatedView({ children, className = '' }) {
    return (
        <View className={` ${className} `.trim()}>
            {children}
        </View>
    );
};

export default React.memo(AnimatedView); 