import {FlashList, View} from 'app/design/view';
import { Text } from 'app/design/typography'
import {appSetting, menuItemsByName} from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon';
import Image from 'app/ui/atoms/image';
import { Link } from 'app/ui/atoms/link';
import { Button, Input } from 'app/design/controls';
import { useState, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { TopMenu, GroupsMenu } from 'app/components/elements/messenger/menu';
import Time from "app/ui/atoms/time";
import UnitComments from "../../units/comments";
import Loading from "../../../ui/atoms/loading";

function UserAvatar({ avatars }) {
    const oAvatar = avatars['bx_if:avatars'],
          oLetter = avatars['bx_if:letters'];

    return <View className="ring-2 ring-white dark:ring-gray-900 bg-gray-500/20 rounded-full overflow-hidden w-8 h-8">
            { oAvatar.condition === true &&
                <View className="w-8 h-8" alt={oAvatar.content.title}>
                    <Image src={oAvatar.content.thumb} priority className="rounded-xl u-cover" view="cover" />
               </View>
            }
            {oLetter.condition === true &&
                <View className="w-8 h-8 rounded-full " style={`background-color:rgba(${oLetter.content.letter})`}>
                    <Text className="text-3xl">{oLetter.content.letter}</Text>
                </View>
            }
           </View>
}

function TalkParts({ parts }) {
    const oAvatar = avatars['bx_if:avatars'],
        oLetter = avatars['bx_if:letters'];

    return <View className="ring-2 ring-white dark:ring-gray-900 bg-gray-500/20 rounded-full overflow-hidden w-8 h-8">
        { oAvatar.condition === true &&
        <View className="w-8 h-8" alt={oAvatar.content.title}>
            <Image src={oAvatar.content.thumb} priority className="rounded-xl u-cover" view="cover" />
        </View>
        }
        {oLetter.condition === true &&
        <View className="w-8 h-8 rounded-full " style={`background-color:rgba(${oLetter.content.letter})`}>
            <Text className="text-3xl">{oLetter.content.letter}</Text>
        </View>
        }
    </View>
}

function UserOnlineStatus(props){
    const { title, id, status } = props,
        oStatuses = { away: 'bg-bubble-away', online: 'bg-green-600'};

    let sClass = status ? oStatuses[status] : 'hidden';
    return <View data-user-status={id} className={sClass} title={title}></View>
}

function TalksListItem({ item, active, onClick }){
    const { id, updated, title } = item,
          { talk_type, icon, message } = item['bx_if:user'].content,
          { time } = item['bx_if:timer'].content;

     return <View onClick={onClick} className= { "max-h-full flex flex-col " + ( active ? 'bg-blue-600 hover:bg-blue-600' : '')}>
        <View className="hover:bg-white dark:hover:bg-gray-700/20" data-lot={id}>
            <Link href="javascript:void(0);" className="block w-full">
                <View className="min-w-0 w-full flex flex-row gap-3 sm:items-top sm:justify-between items-center p-4">
                    <View className="h-min text-center relative flex text-center flex-0">
                        <UserAvatar avatars={item['bx_repeat:avatars'][0]} />
                        <UserOnlineStatus {...item} />
                    </View>
                    <View className="flex space-y-1 flex-1 flex-col">
                        <Text className="w-full flex leading-tight text-base text-ellipsis overflow-hidden
                                             font-bold text-gray-800 group-hover:text-gray-900 dark:text-gray-100 dark:group-hover:text-white">{title}</Text>
                        <View className="w-full space-x-1 flex flex-row items-center text-xs items-center overflow-hidden">
                            {/*<div className="__bubble_class__ inline-block bx-messenger-jots-snip-info-bubble"></div>*/}
                            <Time className="text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap flex-0" ts={time}></Time>
                            { icon && <View className="w-4 h-4 flex-0" alt={title}>
                                <Image src={icon} priority className="rounded-xl u-cover" view="cover" />
                            </View> }
                            <View className="font-semibold flex-0">{talk_type}:</View>
                            <Text className="w-full text-xs flex overflow-hidden flex-1 leading-tight whitespace-nowrap text-ellipsis text-gray-800 dark:text-gray-100">{message}</Text>
                        </View>
                    </View>
                    { /*<View className="flex min-w-max h-min inline-block self-center -space-x-4">
                        <bx_repeat:participants>
                            <bx_if:avatars>
                                <img title="__title__" src="__thumb__"
                                     className="inline-block h-8 w-8 max-w-auto rounded-full ring-2 ring-white dark:ring-gray-900"/>
                            </bx_if:avatars>
                            <bx_if:letters>
                                <p className="flex items-center justify-center text-white bx-base-pofile-unit-thumb max-w-auto bx-def-ava bx-def-box-sizing inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900"
                                   style="background-color:rgba(__color__)">__letter__</p>
                            </bx_if:letters>
                        </bx_repeat:participants>
                    </View> */}
                </View>
            </Link>
        </View>
    </View>
}

function SearchBox(props){
    const { visible } = props,
          sHidden = !visible ? 'hidden' : '';

    return <View className={"flex flex-row flex-1 px-2 " + sHidden}>
                <Input placeholder={"Type to search..."} className="px-2" />
           </View>
}

export default function MessengerTalksList({ list }) {
    const { items } = list,
          [visible, setVisibility] = useState(false),
          [active, setActive] = useState(0),
          handlerVisibility = () => setVisibility(!visible),
          handlerActive = (index) => setActive(index);

    const flashListRef = useRef(null);
    return <View className="max-h-full flex flex-col">
            <View className="w-full p-2 flex items-center flex flex-row">
                <Button variant="custom" startDecorator="list" solid align='start' className="xl:hidden" onPress={() => alert('show menu')}/>
                <View className="group relative justify-end flex flex-1 w-full whitespace-nowrap min-w-0 overflow-hidden">
                    <View className="text-center flex flex-row justify-between text-gray-800 dark:text-gray-100 text-ellipsis overflow-hidden">
                        <Text className={"ml-3 truncate text-xl lg:text-3xl font-bold text-gray-900 dark:text-gray-50 flex items-center " + ( visible ? 'hidden' : '' ) }>Inbox</Text>
                        <SearchBox visible={visible}></SearchBox>
                        <Button variant="text" endDecorator={ 'search' } onPress={handlerVisibility}/>
                    </View>
                </View>
            </View>
            <View className="h-full max-h-full overflow-y-auto scroll-smooth rounded-none min-h-0 flex-1 border-t">
                {/*<FlashList
                    ref={flashListRef}
                    data={items}
                    renderItem={({item}) => {
                        return (
                            Object.keys(items).map((iIndex) => {
                                return  <TalksListItem onClick={() => handlerActive(iIndex)} key={iIndex} item={items[iIndex]} active={active == iIndex}></TalksListItem>
                            })
                        )}}

                    keyExtractor={item => item.id}
                    estimatedItemSize={20}
                    onEndReached = {''}
                    ListFooterComponent={
                        <View className='m-2'><Loading/></View>
                    }
                >
                </FlashList>
                */}
                {
                    Object.keys(items).map((iIndex) => {
                        return  <TalksListItem onClick={() => handlerActive(iIndex)} key={iIndex} item={items[iIndex]} active={active == iIndex}></TalksListItem>
                    })
                }

                {/*<ul role="list">
                    <li className="bx-messenger-always-top hidden divide-y-0">
                        <a href="javascript:void(0);" onClick="oMessenger.createList();" className="group">
                            <div className="bx-messenger-always-top-create-new">
                                <i className="sys-icon comments"></i>
                            </div>
                            <div className="w-full">
                                <div className="flex items-center justify-between">
                                    <p className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                                        <bx_text:_bx_messenger_users_creation_new_message/>
                                    </p>
                                </div>
                            </div>
                        </a>
                    </li>
                    __items__
                </ul>*/}
            </View>
        </View>
}