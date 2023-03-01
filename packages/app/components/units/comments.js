import Profile from '../atoms/profile';
import Time from '../atoms/time';
import Score from '../atoms/score';
import Vote from '../atoms/vote';
import Unit from '../unit';
import {useEffect, useState, useContext } from 'react';
import { fetcher } from '../../lib/util';

import { Text} from 'app/design/typography'
import { Row } from 'app/design/layout'
import { View } from 'app/design/view'
import Html from '../atoms/html';
import { Button } from 'react-native'

export default function UnitComments(props) {

    var data = '';
    var items = '';
    if (props.data.data){
        data = props.data.data;
        items = props.data.items;
    }
    else{
        data = props.data[Object.keys(props.data)[0]].data;
        items = props.data[Object.keys(props.data)[0]].items;
    }
    // request form for reply

    const reply = async (id) => {
        // TODO SCROOL
        props.addCommentData({parentId:id});
    };

    let bSmallSize= props.mode && props.mode =='small' ? true : false;

    let sCommentStyle =  "px-4 pb-0 ";

    let sCommentClass = "u-vanilla-html-small";
    if(bSmallSize){
        sCommentStyle = "pl-2 pr-4 ";
    }
    
    if (!data)
        return (<View></View>);
                
    const oCommentTextStyle = {
        body: {
            fontSize: 16,
            lineHeight:24
        }
    };            

    return (
        <View>
            <View className={ 'cmt-' + data.cmt_id }>
                <View className={sCommentStyle}>
                    <View className="flex-row items-center">
                        <Profile {...data.author_data} displaySize='sm' displayType="unit_wo_info" className="" />
                        <View className =" ml-2 flex-row items-center">
                            <Profile  {...data.author_data} displayType="unit_wo_image" showLinks="false" showInfo="" className="" />
                            <Time ts={data.cmt_time}></Time>
                        </View>
                    </View>
                    <View  className="flex-auto flex-row space-x-2   border-bordercolor/10 dark:border-bordercolor-dark/20 ">
                       <View className="w-8">
                        <View className="w-0.5 my-1 rounded-full flex-auto mx-auto bg-bordercolor/10 dark:bg-bordercolor-dark/10"></View>
                       </View>
                       <View className='flex-col space-y-2 flex-auto pb-3 '>
                            <Html data={data.cmt_text} htmlStyles={oCommentTextStyle} className={sCommentClass} />
                            <View className="w-20">
                                <Button title="reply" onPress={() => reply(data.cmt_id)}  />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
            {(items.length != 0) && <View className='flex-row w-full pl-4  '>
                        <View className="w-8 flex-col space-y-0.5">
                        <View className="w-0.5 rounded-full h-0.5 mx-auto bg-bordercolor/20 dark:bg-bordercolor-dark/20 "></View>
                        <View className="w-0.5 rounded-full h-0.5 mx-auto bg-bordercolor/20 dark:bg-bordercolor-dark/20"></View>
                        <View className="w-0.5 rounded-full h-0.5 mx-auto bg-bordercolor/20 dark:bg-bordercolor-dark/20"></View>
                        <View className="w-0.5 rounded-full flex-auto mx-auto bg-bordercolor/10 dark:bg-bordercolor-dark/10"></View>
                       </View>
                <View className = 'flex-auto '>
                    {Object.keys(items).map(a => <Unit key={items[a].id} module={props.module ? props.module : ''} object_id={props.object_id ? props.object_id : ''} unit='comments' mode='small'  addCommentData={props.addCommentData} data={items[a]} />)}
                </View>
            </View> 
            }
        </View>       
    );
}