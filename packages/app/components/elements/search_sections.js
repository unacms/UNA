import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import UniList from 'app/ui/atoms/unilist'
import { ItemRenderer } from 'app/components/item-renderer';
import { useTranslation } from 'react-i18next';
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls';
import { appSetting } from 'app/lib/util';
import { Platform } from 'react-native'
import { useBreakpoint } from 'app/context/measure';

export default function ElementSearchSections(props) {
    const { t } = useTranslation();
    const currentBreakpoint = useBreakpoint();
    const isWeb = Platform.OS === 'web';
    
    return (
        <View className="w-full">
            {props.data.data.map((item, index) => {
                let numColumns = 1;
                //TODO

                return (
                    <View key={item.section}>
                        <Row className='items-center justify-between p-2 mb-0.5'>
                            <Text className=" text-base font-semibold tracking-tight text-neutral-600 dark:text-neutral-400 ">{t(item.section_name)}</Text>
                            <Link href={`/search-keyword?keyword=test&section=${item.section}`}>
                                <Button variant='link' size='sm' title={t('View all')} />
                            </Link>
                        </Row>

                        <UniList
                            index={0}
                            data={item.data.slice(0, numColumns== 1 ? 3: numColumns)}
                            endpoint={''}
                            listState={''}
                            storagekey={''}
                            route={{ index: 0 }}
                            unit={'general-content-list'}
                            numColumns={numColumns}
                            renderItem={({ item, index }) => <ItemRenderer module={item.section} unit={'general-content-list'} unitType={'general-content-list'} item={{ ...item }} numColumns={5} />}
                        />
                    </View>
                )
            })}
        </View>
    );
}