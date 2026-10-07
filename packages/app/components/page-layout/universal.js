import { View } from 'app/design/view';
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { memo, useMemo } from 'react';
import MenuFooter from 'app/components/nav/menu-footer';
import { Panel, PanelGroup, PanelHandler } from "app/ui/molecules/page/resizable-panels";
import { useBreakpoint } from 'app/context/measure';
import Page from 'app/ui/molecules/page/page'

const isRowLayout = (cell, currentBreakpoint) => !cell.defaultSize || (cell.breakpoint && currentBreakpoint <= LAYOUT_BREAKPOINTS[cell.breakpoint]);
const hasData = (cellData) => Array.isArray(cellData) && cellData.length > 0;

// Handles are zero-width flex items in the gap-spaced PanelGroup, so the gap lands on both
// sides of them. Pull each one in by half a gap per side (gap-4 → -mx-2, same breakpoint
// prefix) to keep columns one gap apart. Literals: @source inline in design/styles/utilities.css.
const handleGapClasses = (gap) => String(gap || '').split(/\s+/).map((cls) => {
    const match = cls.match(/^((?:[\w-]+:)*)gap-(\d+(?:\.\d+)?)$/);
    if (!match) return '';
    const half = Number(match[2]) / 2;
    return half ? `${match[1]}-mx-${half}` : `${match[1]}mx-0`;
}).filter(Boolean).join(' ');

const row = (index, area) => ({ key: `cell_${index + 1}`, index, area });
const col = (index, defaultSize, breakpoint) => ({
    key: `cell_${index + 1}`,
    index,
    area: 'mid',
    defaultSize,
    minSize: 10,
    ...(breakpoint ? { breakpoint } : {}),
});

const LAYOUT_CONFIGS = {
    default: [row(0, 'top'), col(1, 33.33), col(2, 33.33, 'md'), col(3, 33.33, 'lg'), row(4, 'bottom')],
    layout_bar_left: [col(0, 33.33), col(1, 66.66, 'md')],
    layout_bar_right: [col(0, 66.66), col(1, 33.33, 'md')],
    layout_2_columns: [col(0, 50), col(1, 50, 'md')],
    layout_3_columns: [col(0, 33.33), col(1, 33.33, 'md'), col(2, 33.33, 'lg')],
    layout_bar_content_bar: [col(0, 25), col(1, 50, 'md'), col(2, 25, 'lg')],
    layout_top_area_bar_left: [row(0, 'top'), col(1, 33.33), col(2, 66.66, 'md')],
    layout_top_area_bar_right: [row(0, 'top'), col(1, 66.66), col(2, 33.33, 'md')],
    layout_top_area_2_columns: [row(0, 'top'), col(1, 50), col(2, 50, 'md')],
    layout_top_area_3_columns: [row(0, 'top'), col(1, 33.33), col(2, 33.33, 'md'), col(3, 33.33, 'lg')],
    layout_top_area_bar_content_bar: [row(0, 'top'), col(1, 25), col(2, 50, 'md'), col(3, 25, 'lg')],
    layout_topbottom_area_2_columns: [row(0, 'top'), col(1, 50), col(2, 50, 'md'), row(3, 'bottom')],
    layout_topbottom_area_bar_right: [row(0, 'top'), col(1, 66.66), col(2, 33.33, 'md'), row(3, 'bottom')],
    layout_topbottom_area_bar_left: [row(0, 'top'), col(1, 33.33), col(2, 66.66, 'md'), row(3, 'bottom')],
    layout_topbottom_area_col1_col3_col2: [row(0, 'top'), col(1, 16.67), col(2, 50, 'md'), col(3, 33.33, 'lg'), row(4, 'bottom')],
    layout_topbottom_area_col2_col5_col3: [row(0, 'top'), col(1, 20), col(2, 50, 'md'), col(3, 30, 'lg'), row(4, 'bottom')],
};

function PageContentUniversal({ children, data, layoutName, pageClasses }) {
    const currentBreakpoint = useBreakpoint();
    const uri = data.uri;
    const { contentWidth, padding, gap } = pageClasses ?? {};
    const cellsCustomConfig = appSetting('layouts', uri);

    const sizable = cellsCustomConfig.sizable === undefined ? true : cellsCustomConfig.sizable;

    const cellsDefaultConfig = LAYOUT_CONFIGS[layoutName] ?? LAYOUT_CONFIGS.default;

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

    const isParsedLayout = data.layout_parsed;

    const topCell = isParsedLayout ? { key: 'cell_top', data: data.elements?.['cell_top'], chd: children.find((c) => c.key === 'cell_top') } : cells.find((c) => c.area === 'top');
    const bottomCell = isParsedLayout ? { key: 'cell_bottom', data: data.elements?.['cell_bottom'], chd: children.find((c) => c.key === 'cell_bottom') } : cells.find((c) => c.area === 'bottom');
    const midCells = isParsedLayout ? [
        { key: 'cell_left', defaultSize: 25, minSize: 10, data: data.elements?.['cell_left'], chd: children.find((c) => c.key === 'cell_left') },
        { key: 'cell_center', defaultSize: 50, minSize: 10, breakpoint: 'md', data: data.elements?.['cell_center'], chd: children.find((c) => c.key === 'cell_center') },
        { key: 'cell_right', defaultSize: 25, minSize: 10, breakpoint: 'lg', data: data.elements?.['cell_right'], chd: children.find((c) => c.key === 'cell_right') }
    ] : cells.filter((c) => c.area === 'mid');

    const panelCells = midCells.filter((cell) => hasData(cell?.data) && !isRowLayout(cell, currentBreakpoint));
    const handleClassName = handleGapClasses(gap);

    return (
        // The PanelGroup's clipInset pokes past the content column; clip it at the page edge so
        // it can't cause horizontal scroll when the page has no side padding.
        <View className="w-full web:overflow-x-clip">
            <View className={`mx-auto ${contentWidth} ${padding} ${gap}`}>
                <PanelRow gapClass={gap} cell={topCell} currentBreakpoint={currentBreakpoint} />
                {panelCells.length > 0 && (
                    <PanelGroup
                        key={`cells-${uri}-${layoutName}-${sizable ? 'sizable' : 'static'}`}
                        autoSaveId={sizable ? `cells-${uri}-${layoutName}` : undefined}
                        direction="horizontal"
                        className={gap}
                        clipInset
                    >
                        {panelCells.map((cell, i) => {
                            return (
                                <PanelCell
                                    key={cell.key}
                                    withHandle={i > 0}
                                    handleClassName={handleClassName}
                                    sizable={sizable}
                                    panelLine={cellsCustomConfig?.['panel-line']}
                                    cell={cell}
                                    paddingClass={padding}
                                    gapClass={gap}
                                />
                            );
                        })}
                    </PanelGroup>
                )}
                {midCells.map((cell, i) => {
                    return <PanelRow key={cell.key} gapClass={gap} currentBreakpoint={currentBreakpoint} cell={cell} />
                })}
                {bottomCell?.data?.length > 0 && <PanelRow gapClass={gap} cell={bottomCell} currentBreakpoint={currentBreakpoint} />}
            </View>
        </View>
    )
}

const PanelRow = memo(({ cell, currentBreakpoint, gapClass }) => {
    return (hasData(cell?.data) && isRowLayout(cell, currentBreakpoint)) && (
        <View className={`w-full  ${gapClass}`}>
            {cell.chd}
        </View>
    );
})

// Rendered for panel cells only (see `panelCells`); every panel after the first gets a handle,
// disabled when the layout isn't sizable (the group still expects one between panels).
const PanelCell = memo(({ cell, withHandle, handleClassName, sizable, panelLine, paddingClass, gapClass }) => {
    const panelProps = {
        ...(cell.defaultSize !== undefined && { defaultSize: cell.defaultSize }),
        ...(cell.minSize !== undefined && { minSize: cell.minSize }),
        ...(cell.maxSize !== undefined && { maxSize: cell.maxSize }),
    };
    return (
        <>
            {withHandle && <PanelHandler sizable={sizable} panelLine={panelLine} gap={`w-0 ${handleClassName}`} />}
            <Panel {...panelProps} >
                <View className={`w-full ${gapClass} `/*${paddingClass}*/}>
                    {cell.chd}
                </View>
            </Panel>
        </>
    );
});

export default function PageLayoutUniversal({ data, children, layoutName, pageClasses }) {
    return (
        <Page data={data}>
            <PageContentUniversal data={data} layoutName={layoutName} pageClasses={pageClasses}>
                {children}
            </PageContentUniversal>
            <View className="flex-1" />
            <MenuFooter />
        </Page>
    )
}