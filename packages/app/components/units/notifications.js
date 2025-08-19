import { memo } from 'react';
import { stripTags, addParameterToUrl } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import Link from 'app/ui/atoms/link'
import { Card } from 'app/ui/molecules/card'
import Profile from 'app/ui/molecules/profile';

function Unit({ data }) {
    const url = data?.content?.entry_url_api? addParameterToUrl(data?.content?.entry_url_api?.replace('{bx_url_root}', ''), 'ts', data.id) : addParameterToUrl(data?.content?.entry_url?.replace('{bx_url_root}', ''), 'ts', data.id);

    let content_parsed = data?.content_parsed?.site || data?.content_parsed || '';
    content_parsed = content_parsed.replace('&#8230;', '...');

    return (
            <Link  href={url}>
                <Card className='max-w-4xl mx-auto w-full my-2'>
                    <View className="flex-row items-center gap-3 ">
                        <View className="rounded-full flex-none " >
                            <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />
                        </View>
                        <View className="flex-auto my-auto ">
                            <View className='flex-row items-center '>
                                <Text className='text-base flex-auto mr-2 font-semibold text-card-foreground'>{data.author_data.display_name}</Text>
                                <Text className='text-sm flex-none text-muted-foreground'><Time ts={data.date}></Time></Text>
                            </View>
                            <View className='flex-row  w-full items-end content-end'>
                                <Text className='flex-auto mr-2  text-sm text-neutral-900 dark:text-neutral-100' numberOfLines={1}>{stripTags(content_parsed)}</Text>
                            </View>
                        </View>
                    </View>
                </Card>
            </Link>
    );
}

export default memo(Unit);