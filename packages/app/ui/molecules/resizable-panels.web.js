import { Panel as PanelDef, PanelGroup as PanelGroupDef, PanelResizeHandle } from "react-resizable-panels";
import { Icon } from 'app/ui/atoms/icon'
import { memo } from "react";
import { LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { View } from 'app/design/view';
import { useLayoutSettings } from 'app/context/layout-settings';
import { appSetting} from 'app/lib/util';

const panelTheme = appSetting('theme', 'panels');

function createPanelComponent({ baseClass, Component = PanelDef, role, ariaLevel }) {
    return function PanelSubComponent({ className = '', density, ...props }) {
        const { density: effectiveDensity } = useLayoutSettings();

        return (
            <Component
                className={`rpsp1 ${panelTheme[baseClass]} ${panelTheme[baseClass+'-'+effectiveDensity]} ${className}`}
                role={role}
                aria-level={ariaLevel}
                {...props}
            />
        );
    };
}

export const PanelHandler = memo(({ gap, sizable, className = '', style }) => {
    const { density: effectiveDensity } = useLayoutSettings();
    const densityClass = panelTheme[`u-panel-handler-${effectiveDensity}`] ;

    const gapClass = gap && gap.includes(' ') ? gap : gap ? `w-${gap}` : 'w-lg';

    const defaultClasses = `${gapClass} group transition-all duration-300 justify-center items-center flex`;
    const finalClasses = `${className || defaultClasses} ${densityClass}`;

    return sizable ? (
        <PanelResizeHandle 
            className={'rpsp2 ' +finalClasses}
            style={style}
        >
            <View className={panelTheme['u-panel-line']} />
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

