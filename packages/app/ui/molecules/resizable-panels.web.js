import { Panel as PanelDef, PanelGroup as PanelGroupDef, PanelResizeHandle } from "react-resizable-panels";
import { Icon } from 'app/ui/atoms/icon'
import { memo } from "react";
import { LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { View } from 'app/design/view';

export const PanelHandler = memo(({ gap, sizable, className, style }) => {
    const defaultClasses = `${gap} group transition-all duration-300 justify-center items-center flex`;
    const finalClasses = className || defaultClasses;
    
    return sizable ? (
        <PanelResizeHandle 
            className={finalClasses}
            style={style}
        >
            <View className="w-px group-hover:w-sm h-full mx-auto bg-transparent group-hover:bg-muted transition-all duration-300 " />
        </PanelResizeHandle>
    ) : <View className={`w-${gap}`}/>
});

export const PanelGroup = (props) => {
    return <PanelGroupDef {...props}/>
};

export const Panel = (props) => {
    return <PanelDef {...props}/>
};

export const isShowColumn = (cond, windowWidth, cell) => {
    if(cond && (!cell?.breakpoint || windowWidth > LAYOUT_BREAKPOINTS[cell?.breakpoint])){
        return true
    }
    return false
}

