import { View } from 'app/design/view';
import { appSetting, getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef, memo, useMemo } from 'react';
import MenuFooter from 'app/components/nav/menu-footer';
import Animated from 'react-native-reanimated';
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { useWindowDimensions } from 'react-native';
import { Panel, PanelGroup, PanelHandler } from "app/ui/molecules/resizable-panels";


const isRowLayout = (cell, windowWidth) => !cell.defaultSize || (cell.breakpoint && windowWidth <= LAYOUT_BREAKPOINTS[cell.breakpoint]);
const hasData = (cellData) => Array.isArray(cellData) && cellData.length > 0;

function PageContentUniversal({ children, data, layoutName }) {

    const uri = data.uri;
    const cellsCustomConfig = appSetting('layouts', uri);

    const gap = cellsCustomConfig.gap || 4;
    const sizable = cellsCustomConfig.sizable === undefined ? true : cellsCustomConfig.sizable;

    const { width: windowWidth } = useWindowDimensions();

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
        <View className={`mx-auto w-full u-max-width-block gap-y-${gap} p-3 sm:p-4`}>
            <PanelRow gap={gap} cell={topCell} windowWidth={windowWidth} />
            <PanelGroup autoSaveId={`cells-${uri}-${layoutName}`} direction="horizontal">
                {midCells.map((cell, i) => {
                    return <PanelCell key={cell.key} sizable={sizable} gap={gap} windowWidth={windowWidth} cell={cell} index={i} />
                })}
            </PanelGroup>
            {midCells.map((cell, i) => {
                return <PanelRow key={cell.key} gap={gap} windowWidth={windowWidth} cell={cell} />
            })}
            <PanelRow gap={gap} cell={bottomCell} windowWidth={windowWidth} />
        </View>
    )
}

const PanelRow = memo(({ cell, windowWidth, gap }) => {
    return (hasData(cell?.data) && isRowLayout(cell, windowWidth)) && (
        <View className={`w-full gap-y-${gap} `}>
            {cell.chd}
        </View>
    );
})

const PanelCell = memo(({ cell, windowWidth, gap, index, sizable }) => {
    const panelProps = {
        ...(cell.defaultSize !== undefined && { defaultSize: cell.defaultSize }),
        ...(cell.minSize !== undefined && { minSize: cell.minSize }),
        ...(cell.maxSize !== undefined && { maxSize: cell.maxSize }),
    };
    return (hasData(cell?.data) && !isRowLayout(cell, windowWidth)) && (
        <>
            {(index > 0) && (sizable ? <PanelHandler gap={gap} sizable={sizable} /> : <View className={`w-${gap}`}/>)}
            <Panel {...panelProps} >
                <View className={`w-full gap-y-${gap}`}>
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
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center" />
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

