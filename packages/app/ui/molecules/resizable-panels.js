import { memo } from "react";
import { View } from 'app/design/view';

export const PanelHandler = memo(({ gap, sizable }) => {
    return <View className={`w-${gap}`}/>
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

