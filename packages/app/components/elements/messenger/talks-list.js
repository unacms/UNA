import { View} from 'app/design/view';
import { FlashList } from "@shopify/flash-list";
import { Text } from 'app/design/typography'
import {appSetting, menuItemsByName} from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon';
import Image from 'app/ui/atoms/image';
import Loading from 'app/ui/atoms/loading'
import { Link } from 'app/ui/atoms/link';
import { Button, Input } from 'app/design/controls';
import React, { useState, useRef, memo, useEffect, useContext } from 'react';
import Time from "app/ui/atoms/time";
import { StyleSheet } from "react-native";
import { fetcher } from "../../../lib/fetcher";
import MessengerContext from './messenger-сontext';

const styles = {
    infoText: [
       "text-gray-600 dark:text-gray-400"
    ],
    infoActiveText: [
        "text-white"
    ]
};

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

    const textColor = active ? styles.infoActiveText : styles.infoText;
    return <View onClick={() => onClick(id)} className= { "max-h-full w-full flex flex-col " + ( active ? 'bg-blue-600 hover:bg-blue-600' : '')}>
                <View className="hover:bg-white dark:hover:bg-gray-700/20 w-full" data-lot={id}>
                        <View className="min-w-0 w-full flex flex-row gap-3 sm:items-top sm:justify-between items-center p-4">
                            <View className="h-min text-center relative flex text-center flex-0">
                                <UserAvatar avatars={item['bx_repeat:avatars'][0]} />
                                <UserOnlineStatus {...item} />
                            </View>
                            <View className="flex space-y-1 flex-1 flex-col">
                                <Text className="w-full flex leading-tight text-base text-ellipsis overflow-hidden
                                                     font-bold text-gray-900 dark:text-white whitespace-nowrap">{title}</Text>
                                <View className="w-full space-x-1 flex flex-row items-center items-center overflow-hidden text-xs">
                                    <Time stylesName={ "flex-0 whitespace-nowrap text-xs " + textColor}  ts={time} />
                                    { icon && <View className="w-4 h-4 flex-0" alt={title}>
                                        <Image src={icon} priority className="rounded-xl u-cover" view="cover" />
                                    </View> }
                                    <View className="flex-0">
                                        <Text className={ "font-bold whitespace-nowrap text-xs " + textColor } >{talk_type}:</Text>
                                    </View>
                                    <Text className={"w-full flex overflow-hidden flex-1 leading-tight text-ellipsis whitespace-nowrap text-xs " + textColor }>{message}</Text>
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

const TalksListHeader = memo(({ title }) => {
    const [visible, setVisibility] = useState(false),
          handlerVisibility = () => setVisibility(!visible);

    return <View className="group relative justify-end flex flex-1 w-full whitespace-nowrap min-w-0 overflow-hidden">
             <View className="text-center flex flex-row justify-between text-gray-800 dark:text-gray-100 text-ellipsis overflow-hidden">
               <Text className={"ml-3 truncate text-xl lg:text-3xl font-bold text-gray-900 dark:text-gray-50 flex items-center capitalize " + ( visible ? 'hidden' : '' ) }>{title}</Text>
               <SearchBox visible={visible}></SearchBox>
               <Button variant="text" endDecorator={ 'search' } onPress={handlerVisibility}/>
             </View>
         </View>
});

const TalkListItems = memo(function TalkListItems({ list, onLoadHistory, menuItem }){
    const [active, setActive] = useState(0),
          [loading, setLoading] = useState(false),
          [talks, setTalks] = useState( list || []),
         // { menu } = useContext(MessengerContext),
          handlerActive = (id) => {
            if (typeof onLoadHistory === 'function')
                onLoadHistory(id);

            setActive(id);
          },
         loadListItems = async (menu ) => {
            const { data } = await fetcher('/api.php?r=bx_messenger/get_talks_list_json/&params=' + JSON.stringify({ group: menu, count: talks?.length }));
            if (typeof data !== 'undefined') {
                setLoading(false);
                setTalks([...talks, ...data]);
            }
         },
        renderListItem = ({item}) => {
            const { id } = item;
            return <TalksListItem onClick={() => handlerActive(id)} key={id} item={item} active={active === id} />
        },
        loadList = () => loadListItems(menuItem),
        keyExtractor = item => item?.id,
        flashListRef = useRef(null),
        init = useRef(false);

        useEffect(() => {
            loadListItems(menuItem);
            console.log('----- log use effect ------', talks);
        }, [menuItem]);

    if (typeof talks === 'undefined')
        return <View className='m-2'><Loading/></View>;

    console.log(' --- log generate talks list items ----');

    return !talks.length ? <Text className={"text-2xl text-white text-center"}>Empty</Text> :
           <FlashList shList
                      ref={flashListRef}
                      data={talks}
                      renderItem={renderListItem}
                      onEndReachedThreshold={0.3}
                     // onEndReached={loadList}
                      keyExtractor={keyExtractor}
                      estimatedItemSize = {72}
                      ListFooterComponent={
                          loading && <View className='m-2'><Loading/></View>
                      }
            >
            </FlashList>
});

export const TalksListColumn = ({ list, colWidth }) => {
    console.log('------ log generate talks list column  ----', list, colWidth);

    return <View className={"h-full max-h-full overflow-hidden " + ( colWidth || 'w-full' ) } >
                <TalksList list={list} />
           </View>;
    /*onClickMenu={() => selectPanel(panel !== 'menu' && 'menu')}
    onShowMenu={() => selectPanel(panel !== 'menu' && 'menu')} onLoadHistory={handlerSelectTalk}*/
}

export default function TalksList(props) {
    const { selectPanel, viewMenu } = useContext(MessengerContext);
    const [ menu, setView ] = useState(viewMenu);

    const handlerMenuClick = () => {
        selectPanel( menu ? false : 'menu');
        setView(!menu);
    }

    console.log('------ log generate talks list area ----', props);

    return <View className={"max-h-full flex w-full h-full flex-col" + (props.stylesName || "")}>
               <View className="w-full p-2 flex items-center flex flex-row">
                    <Button variant="custom" startDecorator="list" solid align="start" className="xl:hidden" onPress={ handlerMenuClick }/>
                    <TalksListHeader />
               </View>
               <View className="h-full max-h-full w-full overflow-y-auto scroll-smooth rounded-none min-h-0 flex-1 border-t  border-bordercolor dark:bordercolor-dark">
                  <TalkListItems {...props} />
               </View>
           </View>
}