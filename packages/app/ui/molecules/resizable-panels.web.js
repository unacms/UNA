import { Panel as PanelDef, PanelGroup as PanelGroupDef, PanelResizeHandle } from "react-resizable-panels";
import { Icon } from 'app/ui/atoms/icon'
import { memo } from "react";
import { LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { View } from 'app/design/view';
import { cn } from 'app/lib/util';
import { useLayoutSettings } from 'app/context/layout-settings';

function createPanelComponent({ baseClass, Component = PanelDef, role, ariaLevel }) {
    return function PanelSubComponent({ className, density, ...props }) {
        const { density: effectiveDensity } = useLayoutSettings();
        const densityClass = `${baseClass}-${effectiveDensity}`;

        // Ensure density class has precedence by putting it last
        const finalClassName = cn(className, densityClass);

        return (
            <Component
                className={finalClassName}
                role={role}
                aria-level={ariaLevel}
                {...props}
            />
        );
    };
}

export const PanelHandler = memo(({ gap, sizable, className, style }) => {
    const { density: effectiveDensity } = useLayoutSettings();
    const densityClass = `u-panel-handler-${effectiveDensity}`;

    // Handle both gap patterns:
    // 1. gap as className string like "hidden xl:block w-lg"
    // 2. gap as size string like "lg" which should become "w-lg"
    const gapClass = gap && gap.includes(' ') ? gap : gap ? `w-${gap}` : 'w-lg';

    const defaultClasses = `${gapClass} group transition-all duration-300 justify-center items-center flex`;
    const finalClasses = cn(className || defaultClasses, densityClass);

    return sizable ? (
        <PanelResizeHandle 
            className={finalClasses}
            style={style}
        >
            <View className="u-panel-line" />
        </PanelResizeHandle>
    ) : (
        <View className={finalClasses} style={style} />
    );
});

export const PanelGroup = createPanelComponent({ baseClass: 'u-panel-group', Component: PanelGroupDef });

export const Panel = createPanelComponent({ baseClass: 'u-panel-base', Component: PanelDef });

export const isShowColumn = (cond, windowWidth, cell) => {
    if(cond && (!cell?.breakpoint || windowWidth > LAYOUT_BREAKPOINTS[cell?.breakpoint])){
        return true
    }
    return false
}

