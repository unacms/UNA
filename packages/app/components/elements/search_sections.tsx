// @ts-nocheck
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import { useTranslation } from 'react-i18next';
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls';
import { BlockWrapper } from 'app/components/block-wrapper'
import { Icon } from 'app/ui/atoms/icon'
import BrowseSimple, { BrowseSimpleView } from 'app/components/elements/browse_simple'

interface SearchSectionsProps {
    data: {
        unit?: string;
        module?: string;
        object_id?: string | number;
        view?: string;
        data: any[];
    };
    blockWrapperProps?: any;
}

export default function ElementSearchSections({ blockWrapperProps, data }: SearchSectionsProps) {
    const { t } = useTranslation();
    console.log("data", data)
    const EmptyState = (
        <View className="p-2">
            <View className="flex-col gap-y-2 items-center opacity-80 justify-center mx-auto my-auto mb-auto py-4 px-8 h-full rounded-2xl bg-neutral-500/10">
                <View className="flex-col mx-auto m-4 text-neutral-800 dark:text-neutral-200">
                    <Icon icon="Binoculars" width={32} height={32} />
                </View>
                <Text className="text-center text-lg text-neutral-800 dark:text-neutral-200 lg:text-xl font-semibold">
                    {t('Nothing found')}
                </Text>
                <Text className="text-center text-base text-muted-foreground">
                    {t('Try again later')}
                </Text>
            </View>
        </View>
    );

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full">
                {data.data.length === 0 && EmptyState}
                {data.data.map((item) => {

                    return (
                        <View key={item.section}>
                            <Row className='items-center justify-between p-2 mb-0.5'>
                                <Text className=" text-base font-semibold tracking-tight text-neutral-600 dark:text-neutral-400 ">{t(item.section_name)}</Text>
                                <Link href={`/search-keyword?keyword=test&section=${item.section}`}>
                                    <Button variant='link' size='sm' title={t('View all')} />
                                </Link>
                            </Row>
                            <BrowseSimple
                                data={{
                                    data: item.data.slice(0, 5),
                                    unit: item.section == "bx_timeline" ? 'feed' : (item.section.includes('_cmts') ? 'comments': 'general-content-list'),
                                    module: item.section
                                }}
                                view={BrowseSimpleView.Row}
                                unitMode='search'
                            />
                        </View>
                    )
                })}
            </View>
        </BlockWrapper>
    );
}