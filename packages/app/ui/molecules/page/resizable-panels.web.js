import { Panel as PanelDef, PanelGroup as PanelGroupDef, PanelResizeHandle } from "react-resizable-panels";
import { forwardRef, memo } from "react";
import { LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { View } from 'app/design/view';
import { appSetting} from 'app/lib/util';

const panelTheme = appSetting('theme', 'panels');

// Room `clipInset` leaves around a PanelGroup's clip edge: block chrome
// (`shadow-block-outline` and its `-deep` variant, design/styles/theme.css) reaches 3px
// outside a card.
const CLIP_INSET = 4;
const clipInsetStyle = {
    padding: CLIP_INSET,
    margin: -CLIP_INSET,
    width: `calc(100% + ${CLIP_INSET * 2}px)`,
    height: `calc(100% + ${CLIP_INSET * 2}px)`,
};

function createPanelComponent({ baseClass, Component = PanelDef, role, ariaLevel }) {
    function PanelSubComponent({ className = '', clipInset = false, ...props }, ref) {
        // PanelGroup needs overflow: hidden for proper layout containment
        // Panels can have overflow: visible to allow sticky children
        // `clipInset` (PanelGroup): padding moves that clip edge out by CLIP_INSET, so chrome of
        // blocks flush with the group isn't cut even when the page has no padding; the negative
        // margin and the wider/taller box keep the layout where it was. The group then pokes
        // CLIP_INSET past its parent, so the caller clips horizontal overflow at the page edge.
        const styleProps = baseClass === 'u-panel-group'
            ? { style: clipInset ? { overflow: 'hidden', ...clipInsetStyle } : { overflow: 'hidden' } }
            : baseClass === 'u-panel-base'
            ? { style: { overflow: 'visible' } }
            : {};

        return (
            <Component
                ref={ref}
                className={`${panelTheme[baseClass]} ${className}`}
                role={role}
                aria-level={ariaLevel}
                {...styleProps}
                {...props}
            />
        );
    }

    PanelSubComponent.displayName = `PanelSubComponent(${baseClass})`;
    return forwardRef(PanelSubComponent);
}

export const PanelHandler = memo(({ gap, sizable, panelLine = '', className = '', style }) => {
    
    const gapClass = gap && gap.includes(' ') ? gap : gap ? `w-${gap}` : 'w-1';

    // `group` (not `web:group`): the line's `group-hover:` matches only the plain marker class.
    // A disabled handle (not sizable) only keeps the group's handle count; it must not light up on hover.
    const defaultClasses = `${gapClass} group web:duration-200 justify-center items-center flex${sizable ? '' : ' web:pointer-events-none'}`;
    const finalClasses = `${defaultClasses} ${className}`;
    const lineClassName = `${panelTheme['u-panel-line']}${panelLine ? ` ${panelLine}` : ''}`;

    return (
        <PanelResizeHandle 
            className={`${panelTheme['u-panel-handler']} ${finalClasses}`}
            disabled={!sizable}
            style={style}
        >
            {sizable && <View className={lineClassName} />}
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