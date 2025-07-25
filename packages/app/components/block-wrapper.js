import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { stripTags, appSetting } from 'app/lib/util';
import Card from 'app/ui/molecules/card'

export function BlockWrapper(props) {
    let { block, showTitle, showBg, fullWidth, ...rest } = props
    block.designbox_id = Number(block.designbox_id);
    const aNoTitle = [0, 10, 13, 3];
    const aNoBg = [0, 10, 14, 4];
    let bIsShowTitle = true;
    if (aNoTitle.indexOf(block.designbox_id) != -1) {
        bIsShowTitle = false;
    }

    let bIsShowBg = true;
    if (aNoBg.indexOf(block.designbox_id) != -1) {
        bIsShowBg = false;
    }

    if (typeof showBg !== 'undefined') {
        bIsShowBg = showBg;
    }
    if (typeof showTitle !== 'undefined') {
        bIsShowTitle = showTitle;
    }

    let cssClasses = rest?.extraProps?.cssClasses ? rest?.extraProps?.cssClasses : "";
    let cnt = <>{bIsShowTitle && <View>
        <Text className="pb-3 sm:pb-4 leading-none sm:leading-none text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-200 ">{stripTags(block.title)}</Text>
    </View>
    }
        <View>{props.children}</View></>
    return (
        <View key={block.id} className={" w-full mx-auto " + (!fullWidth && !cssClasses.includes("max-w-") ? (appSetting('layout', 'max_width_block')) : "") + cssClasses}>
            {bIsShowBg ? (<Card rounded=' rounded-2xl border border-bdrcard dark:border-bdrcard-d shadow-[0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.5)] ' border=" " addClassName=" p-4 ">{cnt}</Card>) : <View className="  " >{cnt}</View>}
        </View>
    );
} 