import Profile from '../../ui/molecules/profile';
import Time from '../../ui/atoms/time';
import {useEffect, useState, useContext } from 'react';
import { Text} from 'app/design/typography'

import { View, Pressable, Row } from 'app/design/view'
import Html from '../../ui/atoms/html';
import { Button, Modal } from 'app/design/controls'
import { ContentMore } from 'app/ui/molecules/contentmore';
import Image from '../../ui/atoms/image';


export default function UnitComments(props) {

    const [showImage, setShowImage] = useState(false)
    let level = props.level ? props.level : 0
    let current_last_child = props.last_child ? props.last_child : 0
    let data = '';
    let items = '';
    let view = '';
    let files = [];
    if (props.data.data){
        data = props.data.data;
        items = props.data.items;
        files = props.data.files;
        view = props.view
    }
    else{
        data = props.data[Object.keys(props.data)[0]].data;
        items = props.data[Object.keys(props.data)[0]].items;
        files = props.data[Object.keys(props.data)[0]].files;
        view = props.view
    }
    // request form for reply

    const handleReply = async (id, author, text) => {
        props.handleReply(id, author, text);
    };

    let bSmallSize= props.mode && props.mode =='small' ? true : false;

    let sCommentStyle =  " mx-4 gap-y-0 ";

    let sCommentClass = " bg-neoitem dark:bg-neoitem-dark rounded-lg   px-2.5 u-vanilla-html-small";
    if(bSmallSize){
        sCommentStyle = " gap-y-0";
    }
    
    if (!data)
        return (<View></View>);
                
    const oCommentTextStyle = {
        body: {
            fontSize: 16,
            lineHeight:22
        }
    };   
    
    const handleShowImage = (img) => {
        setShowImage(img);
    } 

    const levels = new Array(level);
    let cells = [];
    for (let i = 0; i < level; i++){
        cells.push(<View className='w-10 h-full '>
        {(current_last_child != data.cmt_id || i != level - 1) && <View className="ml-4 w-0.5 bg-rxed-500 rounded-full flex-auto  bg-black/5 dark:bg-white/5"></View> }
      
        {(i == level - 1) && <View className="ml-4 h-4 w-full border-black/5  dark:border-white/5 border-l-2 border-b-2 absolute top-0 rounded-bl-xl flex-auto"></View> }
    </View>)
    };
    let childs = Object.keys(items);
    let last_child = 0;
    if (childs.length > 0){
        //console.log('xxxxxxxx',level, items[childs[childs.length-1]].id)
        last_child = items[childs[childs.length-1]].id;
    }
    
    return (
        <View className='w-full'>
            <Modal id={'file-preview'}  onVisible={showImage} onClose={() => {setShowImage(null)}}>
                <View className="w-full h-96">
                    <Image className="w-full" src={showImage} alt='' view="cover" />
                </View>
            </Modal>

            <View className={ 'cmt-' + data.cmt_id }>
                <View className={sCommentStyle}>
                    <View  className="flex-row">
                    {cells}
                       <View className="w-8 flex-0 h-full">
                            <Profile {...data.author_data} displayType="unit_wo_info" displaySize="sm" showInfo="false" />
                            {(items.length != 0 && view != 'flat') && <View className="w-0.5 ml-4  rounded-full flex-auto  bg-black/5 dark:bg-white/5"></View> }
                       </View>
                       <View className='flex-1 flex-col ml-2 mb-2  space-y-2 '>
                            <View className={sCommentClass+ ' py-1'} >
                                <View className="flex-row gap-1 items-center">
                                    <Profile {...data.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                                    <Text className="text-neogray-500">·{data.cmt_id}--{current_last_child}--{last_child}--</Text>
                                    <Time className="" ts={data.cmt_time}></Time>
                                </View>

                                {
                                    (view == 'flat' && data.cmt_parent_id > 0) && <View   className=' mt-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-md p-2 mb-1'>
                                        <View  className="flex-row items-baseline" >
                                            <View><Text className='text-sm text-gray-800 dark:text-gray-200'>In Reply to </Text></View>
                                            <View className=" "><Profile {...data.author_data} unit='unit_wo_info' displaySize='base'  displayType="text" className="" /></View>
                                        </View>
                                        <ContentMore content={data.cmt_parent.data.cmt_text} numberOfLines={1} textStyle={oCommentTextStyle} openSmall={false} textClassName="text-base text-gray-600 dark:text-gray-400"/>
                                    </View>
                                }
                                <View >
                               
                                <Html data={data.cmt_text} htmlStyles={oCommentTextStyle}  />
                                </View>
                                <Row className='flex-wrap gap-x-1 '>
                                    {files.map(a => (
                                        <Pressable key={'file-'+a.file_id} className='w-24 h-24 mb-2 ' onPress={() => handleShowImage(a.file)} >
                                            <Image src={a.file} alt={a.file_name} view="cover" className=" u-cover rounded-lg dark:bg-neocard-dark border-neoborder dark:border-neoborder-dark border rounded-lg"  />
                                        </Pressable>
                                    ))}
                                </Row>
                                </View>
                            <Button  align="start" title="Reply" size ="xs" startDecorator="ArrowBendLeftUp" variant="text"  onPress={() => handleReply(data.cmt_id, data.author_data.display_name, data.cmt_text)}  />
                        </View>
                    </View>
                </View>
            </View>
            {(items.length != 0 && view != 'flat') && <View className='relative flex-row'>    
                <View className = 'flex-auto '>
                    {Object.keys(items).map(a => <UnitComments level = {level+1} last_child = {last_child} key={items[a].id} module={props.module ? props.module : ''} object_id={props.object_id ? props.object_id : ''} view={data.view ? data.view : ''} unit='comments' mode='small'  handleReply={props.handleReply} data={items[a]} />)}
                </View>
            </View> 
            }
        </View>       
    );
}