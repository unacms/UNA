import { View } from 'app/design/view';

export const PanelHandler = ({ gap, sizable, panelLine }) => {
    return null
};

// `clipInset` only applies to the web PanelGroup's overflow clip (resizable-panels.web.js).
export const PanelGroup = ({ clipInset, ...props }) => {
    return <View {...props}/>
};

export const Panel = (props) => {
    return <View {...props}/>
};

export const isShowColumn = (cond, windowWidth, cell) => {
    return true
}

export function resolvePanelProps(base, responsive, bpName) {
    return {};
}

