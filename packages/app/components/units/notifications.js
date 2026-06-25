import { memo } from 'react';
import { View } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import { CardList } from 'app/ui/molecules/card'
import Profile from 'app/ui/molecules/profile';
import Html from 'app/ui/atoms/html';
import { Skeleton } from 'app/ui/atoms/skeleton';
import LinkOrModal from 'app/ui/molecules/link-or-modal'
import { appSetting, stripTags } from 'app/lib/util'
import { Text } from 'app/design/typography';

function Unit({ data }) {
    const isSkeleton = data?.skeleton;
    const url = data?.content?.subentry_url_api ? data?.content?.subentry_url_api?.replace('{bx_url_root}', '') :
        (data?.content?.entry_url_api ? data?.content?.entry_url_api?.replace('{bx_url_root}', '') :
            data?.content?.entry_url?.replace('{bx_url_root}', ''));
    const content_parsed = (data?.content_parsed?.site || data?.content_parsed || '').replace('&#8230;', '...');
    const isShowPlainText = appSetting('notifications', 'show_plain_text');
    return (
        <LinkOrModal href={url} showInModal={data.type ? appSetting('browse', 'show_in_modal', data.type) : false}>
            <View className={`px-3 py-2 mt-px sm:mt-2 flex-row items-center gap-3 max-w-4xl mx-auto web:hover:bg-muted/50 w-full ${!isSkeleton ? '' : ''} sm:rounded-2xl`}>
                <View className="rounded-full flex-none mb-auto " >
                    <Skeleton visible={isSkeleton} className="h-11 w-11">
                        <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />
                    </Skeleton>
                </View>
                <View className="flex-auto my-auto gap-1 ">
                    <View className='flex-auto'>
                        <Skeleton visible={isSkeleton} className="h-3 w-full">
                            {isShowPlainText ? <Text className='text-secondary-foreground leading-tight line-clamp-2'>{stripTags(content_parsed)}</Text> :
                                <Html data={content_parsed} customClassName="u-vanilla-html-small leading-tight line-clamp-2 " />
                            }
                        </Skeleton>
                    </View>
                    <Skeleton visible={isSkeleton} className="h-3 w-8">
                        <Time className="text-xs flex-none font-medium text-secondary-foreground" ts={data.date} />
                    </Skeleton>
                </View>
            </View>
        </LinkOrModal>
    );
}

export default memo(Unit);