import { View } from 'app/design/view';
import type { EdgeBlurConfig, EdgeBlurProps, EdgeBlurSlot, EdgeBlurViewProps } from 'app/ui/atoms/edge-blur.types';

/** Native blur settings for a slot — iOS only, so always null here. */
export function edgeBlurConfig(_slot?: EdgeBlurSlot): EdgeBlurConfig | null {
    return null;
}

/** Web / Android: the Tailwind wash. iOS draws a native blur (`edge-blur.ios.tsx`). */
export function EdgeBlur({ fallbackClassName, style }: EdgeBlurProps) {
    return <View pointerEvents="none" className={`absolute inset-0 ${fallbackClassName || ''}`} style={style} />;
}

/** Web / Android: the container keeps its wash classes unchanged. */
export function EdgeBlurView({ edge: _edge, config: _config, washClassName, className, ...rest }: EdgeBlurViewProps) {
    return <View {...rest} className={`${className || ''} ${washClassName || ''}`} />;
}
