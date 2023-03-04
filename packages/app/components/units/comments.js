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
import { Button } from 'app/design/controls'

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

    let sCommentStyle =  " mx-4 space-y-1 ";

    let sCommentClass = "u-vanilla-html-small";
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

    return (
        <View className='w-full'>
            <View className={ 'cmt-' + data.cmt_id }>
                <View className={sCommentStyle}>
                    
                    
                    <View className="mr-2"><Profile {...data.author_data} displaySize='base' showInfo={(<Time className="" ts={data.cmt_time}></Time>)} displayType="full" className="" /></View>
                        
                        
                    
                    <View  className=" flex-row ml-8 pb-1">
                       <View className="w-8 flex-0 h-full absolute top-0 -left-7">
                        <View className="w-0.5 my-0.5 rounded-full flex-auto mx-auto bg-bordercolor/10 dark:bg-bordercolor-dark/10"></View>
                       </View>
                       <View className='flex-1 flex-col ml-4 mb-4  space-y-2 rounded-xl rounded-tl'>
                            <Html data={data.cmt_text} htmlStyles={oCommentTextStyle} className={sCommentClass} />
                            <Button title="Reply" size ="link-sm" icon="messages" type="link"  onPress={() => reply(data.cmt_id)}  />
                        </View>
                    </View>
                    
                </View>
            </View>
            {(items.length != 0) && <View className='relative flex-row  ml-12  '>
                        <View className="w-14 absolute top-0 -left-10 h-full flex-col space-y-0.5">
                        <View className="w-1 rounded-full h-1 mx-auto bg-bordercolor/10 dark:bg-bordercolor-dark/10 "></View>
                        <View className="w-1 rounded-full h-1 mx-auto bg-bordercolor/10 dark:bg-bordercolor-dark/10"></View>
                        <View className="w-1 rounded-full h-1 mx-auto bg-bordercolor/10 dark:bg-bordercolor-dark/10"></View>
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