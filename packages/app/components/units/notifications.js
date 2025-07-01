import { memo } from 'react';
import { stripTags, addParameterToUrl } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import AnimatedBlock from 'app/ui/atoms/animated-block'
import Link from 'app/ui/atoms/link'
import Card from 'app/ui/molecules/card'
import Profile from 'app/ui/molecules/profile';

function Unit({ data }) {
    const url = data?.content?.entry_url_api? addParameterToUrl(data?.content?.entry_url_api?.replace('{bx_url_root}', ''), 'ts', data.id) : addParameterToUrl(data?.content?.entry_url?.replace('{bx_url_root}', ''), 'ts', data.id);

    let content_parsed = data?.content_parsed?.site || data?.content_parsed || '';
    content_parsed = content_parsed.replace('&#8230;', '...');

    return (
        <AnimatedBlock>
            <Link href={url}>
                <Card margin="mb-2 p-4  shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] " border=" border border-bdrcard dark:border-bdrcard-d  " rounded=" sm:rounded-2xl " >
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
                </Card>
            </Link>
        </AnimatedBlock>
    );
}

export default memo(Unit);