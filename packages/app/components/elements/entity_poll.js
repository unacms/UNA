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
import { useReducer } from 'react'
import RadioButton from 'app/ui/atoms/radiobutton';
import { VictoryPieChart, VictoryBarChart, getColor } from 'app/components/elements/chart';
import { Button } from 'app/design/controls'
// <VictoryPieChart labelComponent={null} colorScale={backgroundColor2} data={transformedData} />
function Results({ data }) {
    if (data) {
        const backgroundColor = appSetting('theme', 'profile_colors');
        const backgroundColor2 = backgroundColor.map(color => getColor(color));

        return (
            <View className="lg:flex-row mx-auto w-full  ">
                <View className=" w-full max-w-lg  mt-4 lg:mt-0">
                    {data.map((item2, index) => {
                        return (
                            <Row className="items-start w-full" key={'chk' + index}>
                                <Row className="w-full h-[56px]">
                                    <Row className='absolute w-full h-[56px] '>
                                        <View className="h-[56px] rounded-full" style={{ width: '2px', backgroundColor: backgroundColor2[index] }}></View>
                                        <View className="h-[56px] " style={{ width: item2.width, backgroundColor: backgroundColor2[index] }}></View>
                                    </Row>
                                    <View className='w-full items-center justify-center ml-2 '>
                                        <Text numberOfLines={10} className="flex-wrap w-full text-neutral-900 dark:text-neutral-50 text-sm flex-wrap ">
                                            {item2.title}
                                        </Text>
                                        <Text className="font-medium flex-wrap w-full text-neutral-900 dark:text-neutral-50 text-sm flex-wrap">
                                            {item2.width} ({item2.votes.count} votes)
                                        </Text>
                                    </View>
                                </Row>


                            </Row>
                        )
                    })}
                </View>
            </View>
        );
    }
}

export function PollItem({ data, showTitle, onDelete, disabled = false, results_url = '/api.php?r=bx_polls/get_block_results' }) {
    const initialState = {
        isShowResults: data.is_performed,
        isVoted: data.is_performed,
        results: data.results,
        value: data.value
    };

    function reducer(state, action) {
        switch (action.type) {
            case 'SHOW_RESULTS':
                return { ...state, isShowResults: true };
            case 'TOGGLE_RESULTS':
                return { ...state, isShowResults: !state.isShowResults };
            case 'VOTE':
                return { ...state, isShowResults: true, isVoted: true, value: action.value };
            case 'SET_RESULTS':
                return { ...state, results: action.payload };
            default:
                return state;
        }
    }

    const [state, dispatch] = useReducer(reducer, initialState);

    const Vote = async (value) => {
        dispatch({ type: 'VOTE', value: value });

        const sRequest = `/api.php?r=system/do/TemplVoteServices&params[]={"s":"${data.object}","o":${value},"value":1}`;
        await fetcher(sRequest);
        console.log("results_url")
        const sRequest1 = `${results_url}/&params[]=${data.id}`;
        const sResponse1 = await fetcher(sRequest1);
        if (sResponse1.data)
            dispatch({ type: 'SET_RESULTS', payload: sResponse1.data });
    };

    const totalVotes = state?.results ? state.results.reduce((acc, item) => acc + item.votes.count, 0) : 0;

    return (
        <><Row className='items-center justify-between w-full'>{showTitle && <Text className="text-neutral-950  dark:text-neutral-50 text-base tracking-tight font-medium">{data.title}</Text>}
            {onDelete && (<Button onPress={() => { onDelete(data.id) }} startDecorator="X" size="xs" />)}
        </Row>
            {state.isShowResults && <Results data={state.results} />}

            {!!data.subentries && !state.isShowResults && data.subentries.map((item2, index) => (
                <Row key={`lbl-${index}`} className={`items-center my-1 border border-bdr dark:border-bdr-d rounded-lg ${state.isVoted ? 'opacity-50' : 'hover:bg-primary/10 active:bg-primary/20 dark:hover:bg-primary-d/10 dark:active:bg-primary-d/20'}`}>
                    <RadioButton
                        value={item2.entry_id}
                        status={item2.id == state.value ? 'checked' : 'unchecked'}
                        title={item2.title}
                        disabled={state.isVoted || disabled}
                        onPress={() => Vote(item2.id)}
                    />
                </Row>
            ))}
            {(!data.is_hidden_results && totalVotes > 0) && (
                <Row className="justify-start">
                    <Button
                        title={state.isShowResults ? "Show poll" : "Show results"}
                        variant="link"
                        size="sm"
                        onPress={() => dispatch({ type: 'TOGGLE_RESULTS' })}
                    />
                </Row>
            )}
        </>
    );
}

export default function ElementEntityPoll({ data }) {
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
                <PollItem data={data} />
            </View>
        </View>
    );
}
