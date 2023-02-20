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

    let bSmallSize= props.mode && props.mode =='small' ? true : false;

    let sCommentStyle =  "p-4 border-t border-gray-100 dark:border-gray-700";

    let sCommentClass = "u-vanilla-html-small";
    if(bSmallSize){
        sCommentStyle = "p-2";
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
            <View id={ 'cmt-' + data.cmt_id } className="px-2">
                <View className={sCommentStyle}>
                    <View className="flex-row items-center">
                        <Profile {...data.author_data} displaySize='sm' displayType="unit_wo_info" className="" />
                        <View className =" ml-2 flex-row">
                            <Profile  {...data.author_data} displayType="unit_wo_image" showLinks="false" showInfo="" className="" />
                            <Time ts={data.cmt_time}></Time>
                        </View>
                    </View>
                    <View  className="flex-auto flex-col  rounded-lg rounded-tl-sm ml-10">
                        <Html data={data.cmt_text} htmlStyles={oCommentTextStyle} className={sCommentClass} />
                    </View>
                </View>
            </View>
            {(items.length != 0) && <View className='flex w-full pl-10 pb-2'>
                <View className = 'w-full '>
                    {Object.keys(items).map(a => <Unit key={items[a].id} module={props.module ? props.module : ''} object_id={props.object_id ? props.object_id : ''} unit='comments' mode='small'  addCommentData={props.addCommentData} data={items[a]} />)}
                </View>
            </View> 
            }
        </View>       
    );
}