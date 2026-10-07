import type { ComponentType, ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'app/design/view';
import { useWindowHeight } from 'app/context/measure';
import { useHeaderHeight, useFooterHeight } from 'app/context/jotai/layout';
import { appSetting } from 'app/lib/util';
import * as ResizablePanels from 'app/ui/molecules/page/resizable-panels';

// resizable-panels is plain JS (web / native variants): the props used here are described here.
const Panel = ResizablePanels.Panel as ComponentType<any>;
const PanelGroup = ResizablePanels.PanelGroup as ComponentType<any>;
const PanelHandler = ResizablePanels.PanelHandler as unknown as ComponentType<{
    gap?: string;
    sizable?: boolean;
    panelLine?: string;
}>;

/** Window height minus the page header and footer: the room a full-height chat page has. */
export function usePageContentHeight(): number {
    return useWindowHeight() - useHeaderHeight() - useFooterHeight();
}

type ChatPanelsProps = {
    left: ReactNode;
    center: ReactNode;
    /** Measured pixel height of the area; 0 / absent fills the parent. */
    height?: number;
    /** Lets the host measure the area. */
    onLayout?: (event: LayoutChangeEvent) => void;
    /** Settings entry under `layouts` (sizes, `sizable`, panel line). */
    configKey?: string;
};

/**
 * Desktop list | conversation split shared by the messenger and the agents page:
 * a resizable `PanelGroup` configured by `layouts.<configKey>` in settings.
 */
export default function ChatPanels({ left, center, height, onLayout, configKey = 'chat' }: ChatPanelsProps) {
    const config = appSetting('layouts', configKey);

    return (
        <View className="h-full w-full min-h-0" onLayout={onLayout}>
            <PanelGroup
                key={`cells-${configKey}-${config.sizable ? 'sizable' : 'static'}`}
                autoSaveId={config.sizable ? `cells-${configKey}` : undefined}
                direction="horizontal"
                className="w-full min-w-0 relative flex-row"
                style={{ height: height || '100%', overflow: 'hidden' }}
            >
                <Panel className="block min-w-0" {...config.cells?.left}>
                    {left}
                </Panel>
                <PanelHandler
                    gap="hidden lg:block"
                    sizable={config.sizable}
                    panelLine={config['panel-line']}
                />
                <Panel className="w-full min-w-0" {...config.cells?.center}>
                    {center}
                </Panel>
            </PanelGroup>
        </View>
    );
}
