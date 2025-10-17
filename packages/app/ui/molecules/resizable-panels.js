import { memo } from "react";
import { View } from 'app/design/view';

export const PanelHandler = memo(({ gap, sizable }) => {
    return <View className={`w-2`}/>
});

export const PanelGroup = (props) => {
    return <View {...props}/>
};

export const Panel = (props) => {
    return <View {...props}/>
};

export const isShowColumn = (cond, windowWidth, cell) => {
    return true
}

export function resolvePanelProps(base, responsive, bpName) {
    return;
}

