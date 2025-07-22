import { Panel as PanelDef, PanelGroup as PanelGroupDef, PanelResizeHandle } from "react-resizable-panels";
import { Icon } from 'app/ui/atoms/icon'
import { memo } from "react";
import { LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { View } from 'app/design/view';

export const PanelHandler = memo(({ gap, sizable }) => {
    return sizable ? <PanelResizeHandle className={`w-${gap} hover:bg-neutral-500/20 rounded-full transition-all duration-300 justify-center items-center flex`}>
        {/*<Icon icon="GripVertical" width={12} height={12} />*/}
    </PanelResizeHandle> : <View className={`w-${gap}`}/>
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

