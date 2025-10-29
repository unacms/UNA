import { memo, useState, useMemo, useCallback } from 'react';
import { stripTags, getPageData } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import Link from 'app/ui/atoms/link'

import Profile from 'app/ui/molecules/profile';
import FormModal from 'app/ui/molecules/form_modal';
import Html from 'app/ui/atoms/html';

const ContentCard = memo(({ authorData, date, content }) => {
    return (

        <View className="px-2 py-1.5 flex-row items-center gap-3 max-w-4xl mx-auto w-full web:hover:bg-muted/60 rounded-lg ">
            <View className="rounded-full flex-none mb-auto " >
                <Profile {...authorData} displayType="unit_wo_info" displaySize="xl" />
            </View>
            <View className="flex-auto my-auto gap-1 ">
                <View className='flex-auto'>
                    <Html data={content} customClassName="u-vanilla-html-small leading-tight line-clamp-2" />
                </View>
                <Time className="text-xs flex-none font-medium text-muted-foreground" ts={date}></Time>
            </View>
        </View>

    )
})

function Unit({ data }) {
    const url = data?.content?.subentry_url_api ? data?.content?.subentry_url_api?.replace('{bx_url_root}', '') :
        (data?.content?.entry_url_api ? data?.content?.entry_url_api?.replace('{bx_url_root}', '') :
            data?.content?.entry_url?.replace('{bx_url_root}', ''));

    const [pageData, setPageData] = useState(false);

    const content_parsed = (data?.content_parsed?.site || data?.content_parsed || '').replace('&#8230;', '...');
    // const content = useMemo(() => stripTags(content_parsed ?? ""), [content_parsed]);

    const url2 = url.substring(1);

    const handlePress = useCallback(async () => {
        const sResponse = await getPageData(url2, false);
        if (sResponse.data !== pageData) {
            setPageData(sResponse.data);
        }
    }, [url2, getPageData, pageData]);

    if (!!data?.content?.modal_view) {
        return (
            <>
                <Pressable onPress={handlePress} >
                    <ContentCard authorData={data.author_data} date={data.date} content={content_parsed} />
                </Pressable>
                <FormModal pageData={pageData} setPageData={setPageData} modalView={data?.content?.modal_view} url={url} />
            </>
        );
    }

    return (
        <Link href={url}>
            <ContentCard authorData={data.author_data} date={data.date} content={content_parsed} />
        </Link>
    );
}

export default memo(Unit);