import { View } from 'app/design/view';
import { NeoButton, NeoButtonLink } from 'app/design/controls';
import { Platform } from 'react-native'
import i18n from 'i18next';
import { memo } from 'react';
import Unit from 'app/components/unit'

export function getBackButtonWeb() {
    const isWeb = Platform.OS === 'web';
    if (!isWeb) return <></>;
    // Guard against SSR - history is only available in browser
    const hasHistory = typeof window !== 'undefined' && window.history && window.history.length > 2;
    if (hasHistory) {
        return (
            <View className="lg:hidden"  >
               <NeoButton style="borderless" borderShape="circle" image="ArrowLeft" accessibilityLabel={i18n.t('Back')} onPress={() => window.history.back()} />
            </View>
        )
    }
    else{
        return (
            <View className="lg:hidden mr-1"  >
                <NeoButtonLink href='/' controlSize="small" borderShape="circle" image="ArrowLeft" accessibilityLabel={i18n.t('Back')} />
            </View>
        )
    }
}

type BrowseItemProps = { item: any; index: any; numColumns: any; data: any; unitMode: any; props: any };

function shallowEqualObjects(a: Record<string, any> | null | undefined, b: Record<string, any> | null | undefined): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    const aKeys = Object.keys(a);
    if (aKeys.length !== Object.keys(b).length) return false;
    return aKeys.every((k) => Object.prototype.hasOwnProperty.call(b, k) && Object.is(a[k], b[k]));
}

/**
 * `props` is the whole element props object (spread into every unit — forks may
 * read any key). The parent hands in a fresh object whenever it re-renders, so
 * compare it key by key; otherwise memo never skips and every card re-renders.
 */
function sameBrowseItem(prev: BrowseItemProps, next: BrowseItemProps): boolean {
    return prev.item === next.item
        && prev.index === next.index
        && prev.numColumns === next.numColumns
        && prev.data === next.data
        && prev.unitMode === next.unitMode
        && shallowEqualObjects(prev.props, next.props);
}

export const BrowseItem = memo(({ item, index, numColumns, data, unitMode, props }: BrowseItemProps) => (
    <View
        className={
            numColumns > 1
                ? 'w-full pb-2 '
                : data.unit === 'notifications'
                    ? 'w-full mb-1'
                    : data.unit != 'feed'
                        ? 'w-full mb-0.5'
                        : ''
        }
    >
        <Unit
            unit={data.unit ? data.unit : ''}
            mode={unitMode}
            module={data.module ? data.module : ''}
            sidebar={props.sidebar}
            object_id={data.object_id ? data.object_id : ''}
            view={data.view ? data.view : ''}
            listIndex={index}
            {...props}
            data={item}
        />
    </View>
), sameBrowseItem)
