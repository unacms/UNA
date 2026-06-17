import { Panel as PanelDef, PanelGroup as PanelGroupDef, PanelResizeHandle } from "react-resizable-panels";
import { Icon } from 'app/ui/atoms/icon'
import { memo } from "react";
import { LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { View } from 'app/design/view';
import { useLayoutSettings } from 'app/context/layout-settings';
import { appSetting} from 'app/lib/util';

const panelTheme = appSetting('theme', 'panels');

function createPanelComponent({ baseClass, Component = PanelDef, role, ariaLevel }) {
    return function PanelSubComponent({ className = '', ...props }) {
        // PanelGroup needs overflow: hidden for proper layout containment
        // Panels can have overflow: visible to allow sticky children
        const styleProps = baseClass === 'u-panel-group'
            ? { style: { overflow: 'hidden' } }
            : baseClass === 'u-panel-base'
            ? { style: { overflow: 'visible' } }
            : {};

        return (
            <Component
                className={`${panelTheme[baseClass]} ${className}`}
                role={role}
                aria-level={ariaLevel}
                {...styleProps}
                {...props}
            />
        );
    };
}

export const PanelHandler = memo(({ gap, sizable, className = '', style }) => {
    
    const gapClass = gap && gap.includes(' ') ? gap : gap ? `w-${gap}` : 'w-1';

    const defaultClasses = `${gapClass} web:group web:duration-200 justify-center items-center flex`;
    const finalClasses = `${defaultClasses} ${className}`;

    return (
        <PanelResizeHandle 
            className={`${panelTheme['u-panel-handler']} ${finalClasses}`}
            disabled={!sizable}
            style={style}
        >
            {sizable && <View className={panelTheme['u-panel-line']} />}
        </PanelResizeHandle>
    );
});

export const PanelGroup = createPanelComponent({ baseClass: 'u-panel-group', Component: PanelGroupDef });

export const Panel = createPanelComponent({ baseClass: 'u-panel-base', Component: PanelDef });

export const isShowColumn = (cond, windowWidth, cell) => {
    if(cond && (!cell?.breakpoint || windowWidth >= LAYOUT_BREAKPOINTS[cell?.breakpoint])){
        return true
    }
    return false
}

export function resolvePanelProps(base, responsive, bpName) {
    const override = responsive?.[bpName];
    return override ? { ...base, ...override } : base; 
}