import { View, Pressable, Row } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import Html from 'app/ui/atoms/html';
import { Text, H1 } from 'app/design/typography';
import { appSetting, clearLinks, getYouTubeVideoId, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { ContentMore } from 'app/ui/molecules/contentmore';
import EntityAttachments from './entity_attachments';
import TextMore from 'app/ui/molecules/textmore';
import Video from 'app/ui/atoms/video';
import Youtube from 'app/ui/molecules/youtube'
import { fetcher } from 'app/lib/fetcher';
import { useState } from 'react'
import RadioButton from 'app/ui/atoms/radiobutton';
import { VictoryPieChart, getColor } from 'app/components/elements/chart';

function Results({ data }) {
    if (data) {
        const backgroundColor = appSetting('theme', 'profile_colors');
        const backgroundColor2 = backgroundColor.map(color => getColor(color));
        const transformedData = data.map((label, index) => {
            return { x: '', y: label.votes.count };
        });
        return (
            <View className="lg:flex-row mx-auto gap-x-8 items-center justify-center">
                <View className="w-full max-w-xs">
                    <VictoryPieChart colorScale={backgroundColor2} data={transformedData} />
                </View>
                <View>
                    {data.map((item2, index) => {
                        return (
                            <Row className="items-center gap-x-4 mb-2" key={'chk' + index}>
                                <View className="w-8 h-8" style={{ backgroundColor: backgroundColor2[index] }}></View>
                                <Text className="text-neutral-900 dark:text-neutral-50 text-base">{item2.title} <Text className="font-bold">{item2.width}</Text> ({item2.votes.count} votes)</Text>
                            </Row>
                        )
                    })}
                </View>
            </View>
        );
    }
}

export default function ElementEntityPoll({ data }) {

    const [voted, setVoted] = useState(false);
    const [results, setResults] = useState(data.results);
    const Vote = async (value) => {
        setVoted(true);
        const sRequest = '/api.php?r=system/do/TemplVoteServices&params[]={"s":"'+data.object+'","o":'+value+',"value":1}' ;
        await fetcher(sRequest);
        const sRequest1 = `/api.php?r=bx_polls/get_block_results/&params[]=${data.id}` ;
        const sResponse1 = await fetcher(sRequest1);
        setResults(sResponse1.data)

    }

    const videoId = data.video_embed && getYouTubeVideoId(data.video_embed) || null;

    return (
        <View className="w-full">
            <View className="w-full">
                {(!!data.video?.src_mp4) && <View className='w-full aspect-video rounded-xl overflow-hidden lg:mt-6'>
                    <Video poster={data.video.src_poster} src={data.video.src_mp4} cover={true} controls={true} muted={"muted"} />
                </View>}
                {(videoId) && <View className='w-full aspect-video rounded-xl overflow-hidden lg:mt-6'>
                    <Youtube videoId={videoId} size={3} />
                </View>}
                {(!!data.image && !data.video) && <View className="w-full aspect-[2/1] rounded-xl overflow-hidden lg:mt-6"><Image {...data.image} alt={data.title} sizes={LAYOUT_BREAKPOINTS.lg} className=" u-cover" view="cover" /></View>}
                <View className={"mx-auto w-full"}>
                    <H1 className="font-bold tracking-tight  text-neutral-900 dark:text-neutral-50 ">{data.title}</H1>
                </View>

            </View>
            {voted && <Results data={results} />}
            {(!!data.subentries && !voted) && data.subentries.map((item2, index) => {

                return (

                        <Row key={`lbl-${index}`} className='items-center my-1 border border-bdr dark:border-bdr-d rounded-lg hover:bg-primary/10 active:bg-primary/20 dark:hover:bg-primary-d/10 dark:active:bg-primary-d/20' key={'chk' + index}>
                            <RadioButton
                                value={item2.entry_id}
                                status={'unchecked'}
                                title={item2.title}
                                onPress={() => Vote(item2.id)}
                            />
                        </Row>

                )
            })}
        </View>
    );
}
