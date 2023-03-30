import Profile from '../../ui/molecules/profile';
import Time from '../../ui/atoms/time';
import Score from '../../ui/molecules/score';
import Vote from '../../ui/molecules/vote';
import Unit from '../unit';
import {useEffect, useState, useContext } from 'react';
import { Text} from 'app/design/typography'
import { Row } from 'app/design/layout'
import { View, Pressable } from 'app/design/view'
import Html from '../../ui/atoms/html';
import { Button } from 'app/design/controls'
import { stripTags } from '../../lib/util';

export default function UnitComments(props) {

    const [showFull, setShowFull] = useState(false)

    var data = '';
    var items = '';
    let view = '';
    if (props.data.data){
        data = props.data.data;
        items = props.data.items;
        view = props.view
    }
    else{
        data = props.data[Object.keys(props.data)[0]].data;
        items = props.data[Object.keys(props.data)[0]].items;
        view = props.view
    }
    // request form for reply

    const reply = async (id, author, text) => {
        props.handleReply(id, author, text);
    };

    let bSmallSize= props.mode && props.mode =='small' ? true : false;

    let sCommentStyle =  " mx-4 space-y-1 ";

    let sCommentClass = "bg-neoitem dark:bg-neoitem-dark rounded-lg flex-col space-y-1 p-2 u-vanilla-html-small";
    if(bSmallSize){
        sCommentStyle = " mr-4 space-y-1";
    }
    
    if (!data)
        return (<View></View>);
                
    const oCommentTextStyle = {
        body: {
            fontSize: 16,
            lineHeight:22
        }
    };   
    
    const handleShowMore = () => {
        setShowFull(!showFull);
    } 
    

    return (
        <View className='w-full'>
            <View className={ 'cmt-' + data.cmt_id }>
                <View className={sCommentStyle}>
                    <View className="mr-2"><Profile {...data.author_data} displaySize='base' showInfo={(<Time className="" ts={data.cmt_time}></Time>)} displayType="unit" className="" /></View>
                    <View  className=" flex-row ml-8 pb-1">
                       <View className="w-8 flex-0 h-full absolute top-0 -left-7">
                        <View className="w-0.5 my-0.5 rounded-full flex-auto mx-auto bg-black/5 dark:bg-white/5"></View>
                       </View>
                       
                       <View className='flex-1 flex-col ml-2 mb-4  space-y-2 '>
                            <View className={sCommentClass} >
                                {
                                    (view == 'flat' && data.cmt_parent_id > 0) && <View   className='bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-md p-2'>
                                        <View  className="flex-row items-baseline" >
                                            <View><Text className='text-sm text-gray-800 dark:text-gray-200'>In Reply to </Text></View>
                                            <View className=" "><Profile {...data.author_data} unit='unit_wo_info' displaySize='base'  displayType="text" className="" /></View>
                                        </View>
                                        <Pressable onPress={handleShowMore}>
                                            <View className={showFull ? 'hidden' : ''}>
                                                <Text className='text-sm text-gray-600 dark:text-gray-400' numberOfLines={1} htmlStyles={oCommentTextStyle}>{stripTags(data.cmt_parent.data.cmt_text)}</Text>
                                            </View>
                                            <View className={!showFull ? 'hidden' : ''}>
                                                <Html data={data.cmt_parent.data.cmt_text} htmlStyles={oCommentTextStyle}  />
                                            </View>
                                        </Pressable>
                                    </View>
                                }
                                <Html data={data.cmt_text} htmlStyles={oCommentTextStyle}  />
                                </View>
                            <Button  align="start" title="Reply" size ="xs" startDecorator="reply" variant="text"  onPress={() => reply(data.cmt_id, data.author_data.display_name, data.cmt_text)}  />
                        </View>
                    </View>
                </View>
            </View>
            {(items.length != 0 && view != 'flat') && <View className='relative flex-row  ml-12  '>
                <View className="w-14 absolute top-0 -left-10 h-full flex-col space-y-0.5">
                    <View className="w-1 rounded-full h-1 mx-auto bg-black/10 dark:bg-white/10 "></View>
                    <View className="w-1 rounded-full h-1 mx-auto bg-black/10 dark:bg-white/10 "></View>
                    <View className="w-1 rounded-full h-1 mx-auto bg-black/10 dark:bg-white/10 "></View>
                    <View className="w-0.5 rounded-full flex-auto mx-auto bg-black/10 dark:bg-white/10"></View>
                </View>
                <View className = 'flex-auto '>
                    {Object.keys(items).map(a => <Unit key={items[a].id} module={props.module ? props.module : ''} object_id={props.object_id ? props.object_id : ''} view={data.view ? data.view : ''} unit='comments' mode='small'  handleReply={props.handleReply} data={items[a]} />)}
                </View>
            </View> 
            }
        </View>       
    );
}