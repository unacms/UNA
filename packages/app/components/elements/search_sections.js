import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import UniList from 'app/ui/atoms/unilist'
import { ItemRenderer } from 'app/components/item-renderer';
import { useTranslation } from 'react-i18next';
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls';
import { BlockWrapper } from 'app/components/block-wrapper'
import { layoutForList } from 'app/functions'
import { Icon } from 'app/ui/atoms/icon'

export default function ElementSearchSections({ blockWrapperProps, data }) {
    const { t } = useTranslation();
    console.log("data.data", data.data)
    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full">
                {data.data.length === 0 && <View className="p-2">
                                <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto mb-auto py-4 px-8 h-full items-center rounded-2xl  bg-neutral-500/10 ">
                                    <View className="flex-col mx-auto m-4 text-neutral-800 dark:text-neutral-200 ">
                                        <Icon icon="Binoculars" width={32} height={32} />
                                    </View>
                                    <Text className="text-center text-lg text-neutral-800 dark:text-neutral-200 lg:text-xl font-semibold  ">
                                        {t('Nothing found')}
                                    </Text>
                                    <Text className="text-center text-base text-muted-foreground ">
                                        {t('Try again later')}
                                    </Text>
                                </View>
                            </View>
                }
                {data.data.map((item, index) => {
                    const layout = layoutForList(item.section);
                    return (
                        <View key={item.section}>
                            <Row className='items-center justify-between p-2 mb-0.5'>
                                <Text className=" text-base font-semibold tracking-tight text-neutral-600 dark:text-neutral-400 ">{t(item.section_name)}</Text>
                                <Link href={`/search-keyword?keyword=test&section=${item.section}`}>
                                    <Button variant='link' size='sm' title={t('View all')} />
                                </Link>
                            </Row>

                            <UniList
                                layout={layout}
                                index={0}
                                data={item.data.slice(0, 5)}
                                endpoint={''}
                                listState={''}
                                storagekey={''}
                                route={{ index: 0 }}
                                unit={'general-content-list'}
                                renderItem={({ item, index }) => <ItemRenderer module={item.section} unit={'general-content-list'} unitType={'general-content-list'} item={{ ...item }} numColumns={5} />}
                                onEndReached={null}
                            />
                        </View>
                    )
                })}
            </View>
        </BlockWrapper>
    );
}