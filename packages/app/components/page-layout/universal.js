import { View } from 'app/design/view';
import { appSetting, getPageWidth, cd } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef, memo, useMemo } from 'react';
import MenuFooter from 'app/components/nav/menu-footer';
import Animated from 'react-native-reanimated';
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { Panel, PanelGroup, PanelHandler } from "app/ui/molecules/resizable-panels";
import { useLayoutSettings } from 'app/context/layout-settings';
import { useBreakpoint } from 'app/context/measure';

const isRowLayout = (cell, currentBreakpoint) => !cell.defaultSize || (cell.breakpoint && currentBreakpoint <= LAYOUT_BREAKPOINTS[cell.breakpoint]);
const hasData = (cellData) => Array.isArray(cellData) && cellData.length > 0;

function PageContentUniversal({ children, data, layoutName }) {
    const currentBreakpoint = useBreakpoint();
    const uri = data.uri;
    const cellsCustomConfig = appSetting('layouts', uri);

    const gap = cellsCustomConfig.gap || 4;
    const sizable = cellsCustomConfig.sizable === undefined ? true : cellsCustomConfig.sizable;

    const layoutConfigs = {
        default: [
            { key: 'cell_1', index: 0, area: 'top' },
            { key: 'cell_2', index: 1, area: 'mid', defaultSize: 33.33, minSize: 10 },
            { key: 'cell_3', index: 2, area: 'mid', defaultSize: 33.33, minSize: 10, breakpoint: 'md' },
            { key: 'cell_4', index: 3, area: 'mid', defaultSize: 33.33, minSize: 10, breakpoint: 'lg' },
            { key: 'cell_5', index: 4, area: 'bottom' },
        ],
        layout_top_area_bar_right: [
            { key: 'cell_1', index: 0, area: 'top' },
            { key: 'cell_2', index: 1, area: 'mid', defaultSize: 66.33, minSize: 10 },
            { key: 'cell_3', index: 2, area: 'mid', defaultSize: 33.33, minSize: 10, breakpoint: 'md' },
        ],
        layout_top_area_2_columns: [
            { key: 'cell_1', index: 0, area: 'top' },
            { key: 'cell_2', index: 1, area: 'mid', defaultSize: 50, minSize: 10 },
            { key: 'cell_3', index: 2, area: 'mid', defaultSize: 50, minSize: 10, breakpoint: 'md' },
        ],
        layout_topbottom_area_2_columns: [
            { key: 'cell_1', index: 0, area: 'top' },
            { key: 'cell_2', index: 1, area: 'mid', defaultSize: 50, minSize: 10 },
            { key: 'cell_3', index: 2, area: 'mid', defaultSize: 50, minSize: 10, breakpoint: 'md' },
            { key: 'cell_4', index: 3, area: 'bottom' },
        ],
        layout_topbottom_area_bar_right: [
            { key: 'cell_1', index: 0, area: 'top' },
            { key: 'cell_2', index: 1, area: 'mid', defaultSize: 66.66, minSize: 10 },
            { key: 'cell_3', index: 2, area: 'mid', defaultSize: 33.33, minSize: 10, breakpoint: 'md' },
            { key: 'cell_4', index: 3, area: 'bottom' },
        ],
        layout_topbottom_area_bar_left: [
            { key: 'cell_1', index: 0, area: 'top' },
            { key: 'cell_2', index: 1, area: 'mid', defaultSize: 33.33, minSize: 10 },
            { key: 'cell_3', index: 2, area: 'mid', defaultSize: 66.66, minSize: 10, breakpoint: 'md' },
            { key: 'cell_4', index: 3, area: 'bottom' },
        ],
    };

    const cellsDefaultConfig = layoutConfigs[layoutName] ?? layoutConfigs.default;



    const cellsConfig = cellsDefaultConfig.map((defaultCell) => {
        const override = cellsCustomConfig.cells?.find((c) => c.key === defaultCell.key);
        return override ? { ...defaultCell, ...override } : defaultCell;
    });

    const cells = useMemo(() => {
        return cellsConfig.map((cfg) => ({
            ...cfg,
            data: data.elements?.[cfg.key],
            chd: children[cfg.index],
        }
        ))
    }, [children, data.elements, cellsConfig]);

    const topCell = cells.find((c) => c.area === 'top');
    const bottomCell = cells.find((c) => c.area === 'bottom');
    const midCells = cells.filter((c) => c.area === 'mid');

    return (
        <View className={`mx-auto w-full u-max-width-block gap-y-${gap} p-2 sm:p-4`}>
            <PanelRow gap={gap} cell={topCell} currentBreakpoint={currentBreakpoint} />
            <PanelGroup key={`cells-${uri}-${layoutName}-${sizable ? 'sizable' : 'static'}`} autoSaveId={sizable ? `cells-${uri}-${layoutName}` : undefined} direction="horizontal">
                {midCells.map((cell, i) => {
                    return <PanelCell key={cell.key} sizable={sizable} currentBreakpoint={currentBreakpoint} cell={cell} index={topCell.length > 0 ? i : 0}  />
                })}
            </PanelGroup>
            {midCells.map((cell, i) => {
                return <PanelRow key={cell.key} gap={gap} currentBreakpoint={currentBreakpoint} cell={cell} />
            })}
            {bottomCell.length > 0 && <PanelRow gap={gap} cell={bottomCell} currentBreakpoint={currentBreakpoint} />}
        </View>
    )
}

const PanelRow = memo(({ cell, currentBreakpoint, gap }) => {
    return (hasData(cell?.data) && isRowLayout(cell, currentBreakpoint)) && (
        <View className={`w-full gap-y-${gap} `}>
            {cell.chd}
        </View>
    );
})

const PanelCell = memo(({ cell, currentBreakpoint, index, sizable }) => {
    const { density } = useLayoutSettings();
    const panelProps = {
        ...(cell.defaultSize !== undefined && { defaultSize: cell.defaultSize }),
        ...(cell.minSize !== undefined && { minSize: cell.minSize }),
        ...(cell.maxSize !== undefined && { maxSize: cell.maxSize }),
    };
    return (hasData(cell?.data) && !isRowLayout(cell, currentBreakpoint)) && (
        <>
            {(index > 0) && (sizable ? <PanelHandler sizable={sizable} /> : <View className={cd('w-lg', density)} />)}
            <Panel {...panelProps} >
                <View className="w-full gap-y-4">
                    {cell.chd}
                </View>
            </Panel>
        </>
    );
});

export default function PageLayoutUniversal(props) {

    const refer = useRef();
    const content = (
        <Animated.ScrollView ref={refer} className={getPageWidth(props.uri, props.data?.config) + ' mx-auto w-full '} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
            <PageContentUniversal {...props} />
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-2 p-3 mt-3"
                variant="ghost"
                size="sm"
                itemClassName="text-sm p-1"

            />
        </Animated.ScrollView>
    );

    return (
        <ScrollList
            refer={refer}
            content={content}
            pageData={props.data}
            contentType="ScrollView"
        />
    )
}

