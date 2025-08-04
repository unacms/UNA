import { memo } from 'react';
import { stripTags, addParameterToUrl } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import Link from 'app/ui/atoms/link'
import { CardList } from 'app/ui/molecules/card'
import Profile from 'app/ui/molecules/profile';

function Unit({ data }) {
    const url = data?.content?.entry_url_api? addParameterToUrl(data?.content?.entry_url_api?.replace('{bx_url_root}', ''), 'ts', data.id) : addParameterToUrl(data?.content?.entry_url?.replace('{bx_url_root}', ''), 'ts', data.id);

    let content_parsed = data?.content_parsed?.site || data?.content_parsed || '';
    content_parsed = content_parsed.replace('&#8230;', '...');

    return (

            <Link href={url}>
                <CardList>
                    <View className="flex-row items-center">
                        <View className="mr-2  rounded-full flex-none " >
                            <Profile {...data.author_data} displayType="unit_wo_info" displaySize="base" />
                        </View>
                        <View className="flex-auto my-auto ">
                            <View className='flex-row '>
                                <Text className='text-sm flex-auto mr-2  font-semibold text-neutral-900 dark:text-neutral-100'>{data.author_data.display_name}</Text>
                                <Text className='text-sm flex-none text-neutral-500'><Time ts={data.date}></Time></Text>
                            </View>
                            <View className='flex-row  w-full items-end content-end'>
                                <Text className='flex-auto mr-2  text-sm text-neutral-900 dark:text-neutral-100' numberOfLines={1}>{stripTags(content_parsed)}</Text>
                            </View>
                        </View>
                    </View>
                </CardList>
            </Link>
    );
}

export default memo(Unit);