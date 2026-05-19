import { View, Row } from 'app/design/view';
import Image from 'app/ui/atoms/image';
import { Text, H1 } from 'app/design/typography';
import { appSetting, getYouTubeVideoId } from 'app/lib/util'
import Video from 'app/ui/atoms/video';
import Youtube from 'app/ui/molecules/youtube'
import { fetcher } from 'app/lib/fetcher';
import { useReducer } from 'react'
import RadioButton from 'app/ui/atoms/radiobutton';
import { getColor } from 'app/components/elements/chart';
import { Button } from 'app/design/controls'
import { BlockWrapper } from 'app/components/block-wrapper'

function Results({ data }) {
    if (data) {
        const backgroundColor = appSetting('theme', 'profile_colors');
        const backgroundColor2 = backgroundColor.map(color => getColor(color));

        return (
            
                <View className="w-full ">
                    {data.map((item2, index) => {
                        return (
                            <Row className="items-start w-full mt-2" key={'chk' + index}>
                                <Row className="w-full min-h-12 border border-transparent rounded-lg overflow-hidden">
                                    <Row className='absolute w-full min-h-12 gap-x-0.5  '>
                                        <View className=" rounded-lg overflow-hidden " style={{ width: item2.width, backgroundColor: backgroundColor2[index] }}></View>
                                    </Row>
                                    <View className="min-h-12 rounded-lg" style={{ width: 12, backgroundColor: backgroundColor2[index] }}></View>

                                    <View className='w-full items-center justify-center py-1.5 px-2 '>

                                        <Text numberOfLines={10} className="flex-wrap w-full text-foreground  font-semibold text-sm ">
                                            {item2.title}
                                        </Text>
                                        <Text className="font-medium flex-wrap w-full text-popover-foreground  text-xs">
                                            {item2.width} ({item2.votes.count} votes)
                                        </Text>
                                    </View>
                                </Row>


                            </Row>
                        )
                    })}
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

    const vote = async (value, results_url) => {
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
        
        <View className='w-full p-3 rounded-xl bg-muted/50 gap-1.5'>
        <Row className='items-center justify-between w-full gap-x-2 flex-wrap '>
            {showTitle && <Text className="text-foreground p-1 rounded-xl  text-lg tracking-tight font-semibold">{data.title}</Text>}
            {(!data.is_hidden_results && totalVotes > 0) && (
                
                    <Button
                        title={state.isShowResults ? "Show poll" : "Show results"}
                        variant="secondary"
                        size="sm"
                        ring
                        onPress={() => dispatch({ type: 'TOGGLE_RESULTS' })}
                    />
                
            )}
            {onDelete && (<Button onPress={() => { onDelete(data.id) }} startDecorator="X" rounded ring variant="secondary" size="sm" />)}
        </Row>
            {state.isShowResults && <Results data={state.results} />}

            {!!data.subentries && !state.isShowResults && data.subentries.map((item2, index) => (
                <Row key={`lbl-${index}`} className={` items-center border border-border/60 bg-card web:hover:border-ring web:hover:ring rounded-lg ${state.isVoted ? 'opacity-50 web:hover:ring-0' : ' web:active:bg-muted'}`}>
                    <RadioButton
                        value={item2.entry_id}
                        status={item2.id == state.value ? 'checked' : 'unchecked'}
                        title={item2.title}
                        disabled={state.isVoted || disabled}
                        onPress={() => vote(item2.id, results_url)}
                    />
                </Row>
            ))}
        </View>
    );
}

export default function ElementEntityPoll({ data, blockWrapperProps }) {
    const videoId = data.video_embed && getYouTubeVideoId(data.video_embed) || null;
    return (
        <BlockWrapper {...blockWrapperProps}><View className="w-full">
            <View className="w-full">
                {(!!data.video?.src_mp4) && <View className='w-full aspect-video rounded-xl overflow-hidden lg:mt-6'>
                    <Video poster={data.video.src_poster} src={data.video.src_mp4} cover={true} controls={true} muted={"muted"} />
                </View>}
                {(videoId) && <View className='w-full aspect-video rounded-xl overflow-hidden lg:mt-6'>
                    <Youtube videoId={videoId} size={3} />
                </View>}
                {(!!data.image && !data.video) && <View className="w-full aspect-2/1 rounded-xl overflow-hidden lg:mt-6"><Image {...data.image} alt={data.title} className=" u-cover" view="cover" /></View>}
                <View className={"mx-auto w-full"}>
                    <H1 className="font-bold tracking-tight  text-popover-foreground  ">{data.title}</H1>
                </View>
                <PollItem data={data} />
            </View>
        </View>
        </BlockWrapper>
    );
}
