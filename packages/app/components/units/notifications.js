import { memo } from 'react';
import { View } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import { CardList } from 'app/ui/molecules/card'
import Profile from 'app/ui/molecules/profile';
import Html from 'app/ui/atoms/html';
import { Skeleton } from 'app/ui/atoms/skeleton';
import LinkOrModal from 'app/ui/molecules/link-or-modal'
import { appSetting } from 'app/lib/util'

function Unit({ data }) {
    const isSkeleton = data?.skeleton;
    const url = data?.content?.subentry_url_api ? data?.content?.subentry_url_api?.replace('{bx_url_root}', '') :
        (data?.content?.entry_url_api ? data?.content?.entry_url_api?.replace('{bx_url_root}', '') :
            data?.content?.entry_url?.replace('{bx_url_root}', ''));
    const content_parsed = (data?.content_parsed?.site || data?.content_parsed || '').replace('&#8230;', '...');
    
    return (
        <LinkOrModal href={url} showInModal={data.type ? appSetting('browse', 'show_in_modal', data.type) : false}>
            <CardList className={`px-2 py-1.5 mt-2 flex-row items-center gap-3 max-w-4xl mx-auto w-full ${!isSkeleton ? 'web:hover:bg-accent/40' : ''} sm:rounded-2xl`}>
                <View className="rounded-full flex-none mb-auto " >
                    <Skeleton visible={isSkeleton} className="h-11 w-11">
                        <Profile {...data.author_data} displayType="unit_wo_info" displaySize="lg" />
                    </Skeleton>
                </View>
                <View className="flex-auto my-auto gap-1 ">
                    <View className='flex-auto'>
                        <Skeleton visible={isSkeleton} className="h-3 w-full">
                            <Html data={content_parsed} customClassName="u-vanilla-html-small leading-tight line-clamp-2 " />
                        </Skeleton>
                    </View>
                    <Skeleton visible={isSkeleton} className="h-3 w-8">
                        <Time className="text-xs flex-none font-medium text-muted-foreground" ts={data.date} />
                    </Skeleton>
                </View>
            </CardList>
        </LinkOrModal>
    );
}

export default memo(Unit);