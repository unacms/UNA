import Profile from '../atoms/profile';
import Time from '../atoms/time';
import Score from '../atoms/score';
import Vote from '../atoms/vote';
import Unit from '../unit';
//import $ from 'jquery';
import {useEffect, useState, useContext } from 'react';
import { fetcher } from '../../lib/util';

import { Text} from 'app/design/typography'
import { Row } from 'app/design/layout'
import { View } from 'app/design/view'
import Html from '../atoms/html';

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
        document.querySelector('.form-comment textarea').setAttribute('placeholder', 'Write your reply');
        document.querySelector('.form-comment textarea').focus();
        props.addCommentData({parentId:id});
    };

    if (!data)
        return (<View></View>);

    return (
        <View>
            <View id={ 'cmt-' + data.cmt_id } className="w-full">
                <View className="mx-4 py-4 border-t border-gray-500/10 ">
                    <View className="flex-auto flex-row space-x-2">
                                    <View className="flex-none">
                                        <Profile {...data.author_data} displayType="unit_wo_info" className="" />
                                        
                                    </View>
                                    <View className="flex-auto flex-col  ">
                                        <View  className=" mb-1 flex-auto flex-row items-stretch ">
                                            <Profile  {...data.author_data} displayType="unit_wo_image" showLinks="false" showInfo="" className="" />
                                            <Time  ts={data.cmt_time}></Time>
                                        </View>
                                        <View  className="flex-auto flex-col  rounded-lg rounded-tl-sm">
                                            <Html data={data.cmt_text} />
                                        </View>
                                    </View>
                    </View> 
                    
                    
                    
                </View>
            </View>
        {(items.length != 0) && <View className='flex w-full  pl-12'>
                <View className = 'w-full '>
                    {Object.keys(items).map(a => <Unit key={items[a].id} module={props.module ? props.module : ''} object_id={props.object_id ? props.object_id : ''} unit='comments' addCommentData={props.addCommentData} data={items[a]} />)}
                </View>
            </View> 
        }
        </View>       
    );
}