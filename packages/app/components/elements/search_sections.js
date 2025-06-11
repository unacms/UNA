import { View, Pressable, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import UniList from 'app/ui/atoms/unilist'
import { ItemRenderer } from 'app/components/item-renderer';
import { useTranslation } from 'react-i18next';
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls';
import { useWindowDimensions } from 'react-native';
import { appSetting } from 'app/lib/util';
import { Platform } from 'react-native'

export default function ElementSearchSections(props) {
    const { t } = useTranslation();
    const windowWidth = useWindowDimensions().width;
    const isWeb = Platform.OS === 'web';
    

    return (
        <View className="w-full">
            {props.data.data.map((item, index) => {
                let perLineSettings = [];
                let numColumns = 0;
                if (item.is_profile){
                    perLineSettings = appSetting('browse', 'per_line_profile');
                } 
                else{
                    perLineSettings = appSetting('browse', 'per_line');
                }      
                const perLineSettingsByModule = appSetting('browse', 'per_line_'+item.section);
                if (perLineSettingsByModule){
                    perLineSettings=perLineSettingsByModule;
                }
               
                for (let i = 0; i < perLineSettings.length; i++) {
                    if (numColumns== 0 && windowWidth > perLineSettings[i].width) {
                        const count = perLineSettings[i].count;
                        numColumns =  isWeb ? count : (count > 1 ? count - 1 : count);
                    }
                }

                return (
                    <View key={item.section}>
                        <Row className='items-center justify-between px-[8px] py-[6px] mb-[2px]'>
                            <Text className="text-base font-semibold tracking-tight text-neutral-600 dark:text-neutral-400 ">{t(item.section_name)}</Text>
                            <Link href={`/search-keyword?keyword=test&section=bx_posts`}>
                                <Button variant='link' size='sm' title={t('View all')} />
                            </Link>
                        </Row>

                        <UniList
                            index={0}
                            data={item.data.slice(0, numColumns)}
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