import type { ReactNode } from 'react';
import { View } from 'app/design/view';

export default function AnimatedBlock({ children }: { children?: ReactNode }) {
    return <View className="w-full mx-auto">{children}</View>;
}
