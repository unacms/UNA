import { View } from 'app/design/view';
import { appSetting } from 'app/lib/util'

export default function PageLayout({ children, data, layoutName }) {

    const gap = 3;
    const maxWidth = appSetting('layout', 'max_width_block');

    let cell_top = {data:data.elements['cell_1'], index:0};
    let cell_mid_1 = {data:data.elements['cell_2'], index:1};
    let cell_mid_2 = {data:data.elements['cell_3'], index:2};
    let cell_mid_3 = {data:data.elements['cell_4'], index:3};
    let cell_bottom = {data:data.elements['cell_5'], index:4};
    
    if ('layout_topbottom_area_bar_right' === layoutName || 'layout_topbottom_area_bar_left' === layoutName) {
        cell_mid_3 = {};
        cell_bottom = {data:data.elements['cell_4'], index:3}
    }



    const cellsInRow = cell_mid_1?.data?.length + (cell_mid_2?.data?.length || 0) + (cell_mid_3?.data?.length|| 0) ;


    let cells_settings = [
        `w-full md:w-1/${cellsInRow - 1} pr-${gap} lg:w-1/${cellsInRow}`,
        `w-full md:w-1/${cellsInRow - 1} lg:pr-${gap} lg:w-1/${cellsInRow}`,
        `w-full lg:w-1/${cellsInRow}`
    ];

    if (cellsInRow == 1) {
        cells_settings = ['w-full'];
    }

    if (cellsInRow == 2) {
        cells_settings = [
        `w-full md:w-1/${cellsInRow - 1} lg:pr-${gap} lg:w-1/${cellsInRow}`,
        `w-full md:w-1/${cellsInRow - 1} lg:w-1/${cellsInRow}`,
        ];
    }

    if ('layout_top_area_bar_right' === layoutName || 'layout_topbottom_area_bar_right' === layoutName) {
        cells_settings = [
            `w-full md:w-1/2 pr-${gap} lg:w-2/3`,
            `w-full md:w-1/2 lg:w-1/3`,
        ];
    }
    if ('layout_topbottom_area_bar_left' === layoutName) {
        cells_settings = [
            `w-full md:w-1/2 pr-${gap} lg:w-1/3`,
            `w-full md:w-1/2 lg:w-2/3`,
        ];
    }

    return (
        <View className={`mx-auto gap-y-${gap} w-full ${maxWidth}`}>
            {(cell_top?.data?.length > 0) && <View className="w-full">
                {children[cell_top.index]}
            </View>}
            <View className={`w-full flex-wrap flex-row  gap-y-${gap}  ${maxWidth}`}>
                {cell_mid_1?.data?.length > 0 && (
                    <View className={`gap-y-${gap} ${cells_settings[0]}`}>
                        {children[cell_mid_1.index]}
                    </View>
                )}
                {cell_mid_2?.data?.length > 0 && (
                    <View className={`gap-y-${gap} ${cells_settings[1]}`}>
                        {children[cell_mid_2.index]}
                    </View>
                )}
                {cell_mid_3?.data?.length > 0 && (
                    <View className={`gap-y-${gap} ${cells_settings[2]}`}>
                        {children[cell_mid_3.index]}
                    </View>
                )}
            </View>
            {(cell_bottom?.data?.length > 0) && <View className="w-full">
                {children[cell_bottom.index]}
            </View>}
        </View>
    )
}