import Profile from '../atoms/profile';
import Time from '../atoms/time';
import Score from '../atoms/score';
import Vote from '../atoms/vote';
import Unit from '../unit';
//import $ from 'jquery';
import {useEffect, useState, useContext } from 'react';
import { GlobalsData } from '../../context/context';
import { fetcher } from '../../lib/util';

import { Text} from 'app/design/typography'
import { Row } from 'app/design/layout'
import { View } from 'app/design/view'

export default function UnitComments(props) {

    return <View><Row><Text>TODO:cmts unit</Text></Row></View>

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

    const { globals, setGlobals } = useContext(GlobalsData);
    const reply = async (id) => {
        document.querySelector('.form-comment textarea').setAttribute('placeholder', 'Write your reply');
        document.querySelector('.form-comment textarea').focus();
        props.addCommentData({parentId:id});
    };


    if (!data)
        return (<></>);

    return (
        <>
        <div id={ 'cmt-' + data.cmt_id } className="cmt  group flex w-full px-2 @xl/cell:px-0 ">
            <div className="flex gap-2 w-full ">
                <div className="flex-none flex flex-col h-full gap-1 relative  ">
                    <div className='w-0.5 bg-gray-500/20 flex-auto mx-auto cmt-line-top1 hidden'></div>
                    <Profile {...data.author_data} displayType="unit_wo_info" displaySize="sm" />
                    <div className='w-0.5 bg-gray-500/20 flex-auto h-full mx-auto cmt-line hidden'></div>
                </div>
                <div className="bg-white dark:bg-gray-900   p-2 mb-2 flex relative flex-auto flex-col rounded-lg  text-sm   ">
                    <div className="flex flex-none gap-2 px-1.5 py-1">
                        <div className="flex flex-auto gap-x-2 gap-y-1">
                            <Profile {...data.author_data} displayType="unit_wo_image" showInfo="false" />
                        </div>
                        <div className="whitespace-nowrap mb-auto flex-none font-medium tracking-tight bg-gray-100 text-gray-600 text-xs  inline-flex items-center px-1.5 py-0.5 rounded-full  dark:bg-gray-700/50 dark:hover:bg-gray-700 hover:bg-gray-200 dark:text-gray-300  ">
                            <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
                            <Time className="pl-1" ts={data.cmt_time}></Time>
                        </div>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 px-1.5 pb-1" dangerouslySetInnerHTML={{__html:data.cmt_text}} />
                    <div className="flex">
                        <div className="inline-flex flex-auto w-min gap-4">
                            <Score/>
                            <button onClick={() => reply(data.cmt_id)} type="button" className="inline-flex group/reply  items-center p-1.5 text-xs font-medium text-gray-700    rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700 bg-transparent active:bg-gray-200 active:shadow-inner hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700   dark:text-gray-300 dark:hover:text-white  ">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2  group-active/reply:scale-150 duration-200 fill-current">
                                    <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 015 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914z" />
                                    <path d="M14 6c-.762 0-1.52.02-2.271.062C10.157 6.148 9 7.472 9 8.998v2.24c0 1.519 1.147 2.839 2.71 2.935.214.013.428.024.642.034.2.009.385.09.518.224l2.35 2.35a.75.75 0 001.28-.531v-2.07c1.453-.195 2.5-1.463 2.5-2.915V8.998c0-1.526-1.157-2.85-2.729-2.936A41.645 41.645 0 0014 6z" />
                                </svg>
                                Reply
                            </button>
                        </div>
                        <div className="inline-flex  w-min gap-4  " >
                            <button type="button" className="inline-flex group/reply  items-center p-1.5 text-xs font-medium text-gray-700    rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700 bg-transparent active:bg-gray-200 active:shadow-inner hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700   dark:text-gray-300 dark:hover:text-white ">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5  group-active/button:scale-150 duration-200">
                                    <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
            </div>
           
        </div>

        {(items.length != 0) && <div className='flex w-full  pl-12'>
            <div className="flex-none flex flex-col h-full gap-1 relative mt-1 ">
                <div className='hidden w-8 bg-red-500 h-full'>
                    <div className='w-0.5 bg-gray-500/20 flex-auto h-full mx-auto cmt-line'></div>
                </div>
            </div>
            <div className = 'w-full '>
                    {Object.keys(items).map(a => <Unit key={items[a].id} module={props.module ? props.module : ''} object_id={props.object_id ? props.object_id : ''} unit='comments' addCommentData={props.addCommentData} data={items[a]} />)}
            </div>
            </div> 
        }
        </> 
    );
}

