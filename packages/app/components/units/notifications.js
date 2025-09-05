import { memo, useState, useMemo, useCallback } from 'react';
import { stripTags, getPageData } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View, Row, Pressable } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import Link from 'app/ui/atoms/link'
import { CardList } from 'app/ui/molecules/card'
import Profile from 'app/ui/molecules/profile';
import FormModal from 'app/ui/molecules/form_modal';

const ContentCard = memo(({ authorData, date, content }) => {
    return (
        <CardList className='max-w-4xl mx-auto w-full  '>
            <View className="flex-row items-center gap-3 ">
                <View className="rounded-full flex-none " >
                    <Profile {...authorData} displayType="unit_wo_info" displaySize="lg" />
                </View>
                <Row className="flex-auto my-auto ">
                    <Text className='flex-auto mr-2  text-sm text-neutral-900 dark:text-neutral-100' numberOfLines={2}>{content}</Text>
                    <Text className='text-sm flex-none text-muted-foreground'><Time ts={date}></Time></Text>
                </Row>
            </View>
        </CardList>
    )
})

function Unit({ data }) {
    const url = data?.content?.subentry_url_api ? data?.content?.subentry_url_api?.replace('{bx_url_root}', '') :
        (data?.content?.entry_url_api ? data?.content?.entry_url_api?.replace('{bx_url_root}', '') :
            data?.content?.entry_url?.replace('{bx_url_root}', ''));

    const [pageData, setPageData] = useState(false);

    const content_parsed = (data?.content_parsed?.site || data?.content_parsed || '').replace('&#8230;', '...');
    const content = useMemo(() => stripTags(content_parsed ?? ""), [content_parsed]);

    const url2 = url.substring(1);

    const handlePress = useCallback(async () => {
        const sResponse = await getPageData(url2, false);
        if (sResponse.data !== pageData) {
            setPageData(sResponse.data);
        }
    }, [url2, getPageData, pageData]);

    if (!!data?.content?.modal_view) {
        return (
            <><Pressable onPress={handlePress} >
                <ContentCard authorData={data.author_data} date={data.date} content={content} />

            </Pressable>
                <FormModal pageData={pageData} setPageData={setPageData} modalView={data?.content?.modal_view} url={url} />
            </>
        );
    }

    return (
        <Link href={url}>
            <ContentCard authorData={data.author_data} date={data.date} content={content} />
        </Link>
    );
}

export default memo(Unit);