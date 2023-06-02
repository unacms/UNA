import { useState } from 'react';
import { useWindowDimensions} from 'react-native';

import { menuItemsByName, linkify, FeedbackHaptics } from 'app/lib/util';
import { Text} from 'app/design/typography'
import { View, Pressable, Row } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import Html from 'app/ui/atoms/html';
import Time from 'app/ui/atoms/time';
import Image from 'app/ui/atoms/image';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Profile from 'app/ui/molecules/profile';
import { ContentMore } from 'app/ui/molecules/contentmore';
import Menu from 'app/components/menu';
import { useCurrentUser } from 'app/context/user';

export default function UnitComments(props) {
    let { currentUser } = useCurrentUser();

    const [showImage, setShowImage] = useState(false)
    let level = props.level ? props.level : 0
    let lvls= props.lvls ? props.lvls : []
    let data = props.data;
    let items = props.items;
    let view = props.view;
    let files = props.files;


    // request form for reply

    const handleReply = async (id, author, text) => {
        FeedbackHaptics('Medium');
        props.handleReply(id, author, text);
    };

    const windowHeight = useWindowDimensions().height;

    let sCommentClass = " bg-neutral-500/10 border border-neutral-500/10  rounded-lg   px-2.5  u-vanilla-html-small ";

    if (!data)
        return (<View></View>);
                
    const handleShowImage = (img) => {
        setShowImage(img);
    } 

    const handleManageMenuSelect = (oItem, event) => {
        switch(oItem.name) {
            case 'item-edit':
                console.log('TODO: Perfom comment edit.');
                break;

            case 'item-delete':
                console.log('TODO: Perfom comment delete.');
                break;
        }
    }

    let cells = [];
    for (let i = 0; i < level; i++){
        cells.push(<View key={'sp-'+level+'-'+i} className='w-10'>{  /*i+'-'+level+'-'+lvls[i]+'-'+lvls.length*/}
        {(lvls[i+1]) && <View className="ml-[19px] w-0.5 flex-auto  bg-gray-100 dark:bg-gray-800"></View> }
        {(i == level - 1) && <View className="ml-[19px] h-[21px] w-8 border-gray-100 dark:border-gray-800  border-l-2 border-b-2 absolute top-0 rounded-bl-xl flex-auto"></View> }
    </View>)
    };   

    const aMenuManageItems = menuItemsByName('comments_manage_menu', data.menu_manage.items);

    return (
        <View className='w-full'>
            <Modal title="Title" id={'file-preview'}  onVisible={showImage} onClose={() => {setShowImage(null)}}>
                <View className="w-full h-64 lg:h-96" >
                    <Image className="w-full" src={showImage} alt='' view="cover" />
                </View>
            </Modal>
            <View  className="flex-row gap-x-2 ">
                {cells}
                <View className="w-10 flex-0 ">
                    <Profile {...data.author_data} displayType="unit_wo_info" displaySize="base" showInfo="false" />
                    {(items.length != 0 && view != 'flat') && <View className="w-0.5 ml-[19px]  flex-auto bg-gray-100 dark:bg-gray-800"><Text>&nbsp;</Text></View> }
                </View>
                <View className='flex-1 flex-col gap-y-1 mb-2'>
                    <View className={sCommentClass + ' py-2'} >
                        <View className="flex-row flex-1 items-center mb-0.5">
                            <Profile {...data.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                            <Text className="text-gray-500 px-1">·</Text>
                            <Time className="" ts={data.cmt_time}></Time>
                        </View>
                        {
                            (view == 'flat' && data.cmt_parent_id > 0) && <View   className='   border border-neoborder dark:border-neoborder-dark  rounded-md p-2 my-1'>
                                <View  className="flex-row items-baseline" >
                                    <View><Text className='text-sm text-gray-800 dark:text-gray-200'>In Reply to </Text></View>
                                    <View className=" "><Profile {...data.author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" /></View>
                                </View>
                                <ContentMore content={data.cmt_parent.data.cmt_text} numberOfLines={1} openSmall={false} textClassName="text-base text-neutral-600 dark:text-gray-400"/>
                            </View>
                        }
                        <View>
                            <Html data={linkify(data.cmt_text)} />
                        </View>
                        <Row className='flex-wrap gap-x-1 '>
                            {files.map(a => (
                                <Pressable key={'file-'+a.file_id} className='w-24 h-24 mt-1 ' onPress={() => handleShowImage(a.file)} >
                                    <Image sizes="96px" src={a.file} alt={a.file_name} view="cover" className=" u-cover rounded-lg dark:bg-neocard-dark border-neoborder dark:border-neoborder-dark border rounded-lg"  />
                                </Pressable>
                            ))}
                        </Row>
                        
                    </View>
                    <View className=' mb-1 flex-row w-full justify-between items-center'>
                        { !!currentUser ? <View className='mr-2'>
                            <Button align="start" title="Reply" size ="xs" startDecorator="ArrowBendLeftUp" variant="outline"  onPress={() => handleReply(data.cmt_id, data.author_data.display_name, data.cmt_text)} rounded />
                        </View> : <></> }
                        <View className='flex-row'>
                            <Menu {...data.menu_actions} displayType="element" showMatched={true} params={{show_action: true, show_counter: true, show_combined: true, display_size: 'xs'}} />
                            {!!currentUser && !!aMenuManageItems.length && 
                            <View className="ml-2">
                                <DropdownMenu items={aMenuManageItems.map((aItem) => {
                                    return {
                                        id: aItem.id ? aItem.id : aItem.name,
                                        name: aItem.name,
                                        link: aItem.link,
                                        title: aItem.title
                                    };
                                })} onSelect={handleManageMenuSelect}>
                                    <Button variant="outline" size="sm" startDecorator="DotsThreeOutline" onPress={() => {}} rounded />
                                </DropdownMenu>
                            </View>
                            }
                        </View>
                    </View>
                </View>
            </View>
        </View>       
    );
}