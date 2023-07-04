import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';
import { Text } from 'app/design/typography';
import { Pressable, View } from 'app/design/view';
import React, {useMemo, useState} from 'react';
import dynamic from "next/dynamic";
import {useCurrentUser} from "../../context/user";
import {FeedbackHaptics, linkify, menuItemsByName} from "../../lib/util";
import {ContentMore} from "../../ui/molecules/contentmore";
import Html from "../../ui/atoms/html";
import {Button} from "../../design/controls";
import Menu from "../menu";
import DropdownMenu from "../../ui/atoms/dropdown-menu";
import Reactions from 'app/ui/molecules/reactions';

export function ListFeed(data) {
  const { author_data, message, date, title, count, onPress } = data || {};

  return <Pressable onPress={onPress} >
            <View className="flex-row p-2 sm:px-3   group duration-200 overflow-hidden m-1 sm:mx-2 rounded-lg
                         hover:bg-neutral-500/10 active:opacity-50   active:translate-y-0.5 
                        
                        h ">

            <View className="w-12 h-12 mr-2 rounded-full flex-none bg-secondary-500/10">
            <Profile
              { ...author_data }
              displayType="unit_wo_info"
              displaySize="lg"
            />
         </View>
        <View className="flex-auto flex-col my-auto ">
          <View className="flex-row gap-2">
            <Text
                className="flex-auto text-lg font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-neutral-50"
                numberOfLines={1}
            > { title } </Text>
            <Time className="text-sm flex-none" ts={ date }></Time>
          </View>
          <View className="flex-row  w-full items-end content-end">
            <Text
              className="flex-auto mr-2 text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-neutral-50"
              numberOfLines={1}
            >
              { message }
            </Text>
            <View className="flex-none bg-primary dark:bg-primary-dark rounded-full  my-auto h-min px-1.5">
              { count > 0 && (
                <Text className="text-xs text-white dark:text-black font-medium">
                  { count }
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
}

function CarouselMemo({ aImg, b }) {
    const computedData = useMemo(() => {
        const Carousel = React.memo(dynamic(() => import('../../ui/molecules/carousel')));
        return  <Carousel data={aImg}/>
    }, [b]);
    return computedData;
}

export function MsgFeed({ item }) {
    let { currentUser } = useCurrentUser();
    const [selectedEmoji, setSelectedEmoji] = useState();

    let { author_data, created, count, files, level, message, menu } = item;
    level = 0;
    let lvls= [];
    const data = created;
    let view = false;
    /*let data = props.created;
    let items = props.items;
    let view = props.view;
    let files = props.files;*/

    // request form for reply

    console.log('---- render items -----', item);
    const handleReply = async (id, author, text) => {
        FeedbackHaptics('Medium');
        props.handleReply(id, author, text);
    };

    let sCommentClass = " bg-neutral-500/10   rounded-tl-none  rounded-2xl   px-4  u-vanilla-html-small ";

    if (!data)
        return (<View></View>);

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

    /*let cells = [];
    for (let i = 0; i < level; i++){
        cells.push(<View key={'sp-'+level+'-'+i} className='w-10'>{  /!*i+'-'+level+'-'+lvls[i]+'-'+lvls.length*!/}
            {(lvls[i+1]) && <View className="ml-[19px] w-0.5 flex-auto  bg-neutral-100 dark:bg-neutral-800"></View> }
            {(i == level - 1) && <View className="ml-[19px] h-[21px] w-8 border-neutral-100 dark:border-neutral-800  border-l-2 border-b-2 absolute top-0 rounded-bl-xl flex-auto"></View> }
        </View>)
    };
*/
   /* const aMenuManageItems = menuItemsByName(menu);

    console.log('-------- menu items -----', aMenuManageItems, menu);*/

    let aImg = files?.map(obj => {
        return {
            src: obj.file,
            type: 'image'
        };
    });

    //{/*items.length != 0 && */}
        //                     {{/*(view != 'flat') && <View className="w-0.5 ml-[19px]  flex-auto bg-neutral-100 dark:bg-neutral-800"><Text>&nbsp;</Text></View> */}}
    return (
        <View className='w-full mt-3'>
            <View className="flex-row-reverse ">
                {/*{cells}*/}
                
                <View className='flex-1 flex-col gap-y-1 -translate-x-2 translate-y-1 '>
                    <View className={sCommentClass + ' py-2'} >
                        <View className="flex-row flex-1 items-center mb-0.5">
                            <Profile {...author_data} displayType="unit_wo_image" displaySize="sm" showInfo="false" />
                            <Text className="text-neutral-500 px-1">·</Text>
                            <Time className="" ts={created}></Time>
                        </View>
                        <View>
                            <Html data={linkify(message)} />
                        </View>
                        { aImg && aImg.length > 0 && <View className='w-full aspect-video mb-6'>
                            <CarouselMemo aImg={aImg}/>
                        </View>
                        }
                    </View>
                    <View className="flex-row w-full  justify-between items-center">
                        { !!currentUser ? <View className='mr-2'>
                                           {/* <Reactions>
                                                <Text>{selectedEmoji ? selectedEmoji?.emoji : 'Like'}</Text>
                                            </Reactions>*/}
                                          </View> : <></>
                        }
                        <View className='flex-row'>
                            <Menu items={ menu } displayType="element" showMatched={true} params={{show_action: true, show_counter: true, show_combined: true, display_size: 'xs'}} />
                            {!!currentUser && !!menu.length &&
                            <View className="ml-2">
                                <DropdownMenu items={menu.map((aItem) => {
                                    return {
                                        id: aItem.id ? aItem.id : aItem.name,
                                        name: aItem.name,
                                        link: aItem.link,
                                        title: aItem.title
                                    };
                                })} onSelect={handleManageMenuSelect}>
                                    <Button variant="outline" size="xs" startDecorator="DotsThreeOutlineVertical" onPress={() => {FeedbackHaptics('Medium');}} rounded />
                                </DropdownMenu>
                            </View>
                            }
                        </View>
                    </View>
                </View>
                <View className=" bg-neutral-50 dark:bg-neutral-900 rounded-full mb-auto p-0.5">
                    <Profile {...author_data} displayType="unit_wo_info" displaySize="base" showInfo="false" />
                </View>
            </View>
        </View>
    );
}