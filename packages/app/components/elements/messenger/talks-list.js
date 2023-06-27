import {TouchableOpacity, View} from 'app/design/view';
import { Text } from 'app/design/typography'
import Image from 'app/ui/atoms/image';
import Loading from 'app/ui/atoms/loading'
import { Link } from 'app/ui/atoms/link';
import { Button, Input } from 'app/design/controls';
import React, { useState, useRef, memo, useEffect, useContext } from 'react';
import Time from "app/ui/atoms/time";
import { fetcher } from "../../../lib/fetcher";
import MessengerContext from './messenger-сontext';
import {WrappedTopMenu} from "./menu";
import UniList from 'app/ui/atoms/unilist';
import { truncateHTML } from 'app/lib/util'

const styles = {
    infoText: [
       "text-gray-600 dark:text-gray-400"
    ],
    infoActiveText: [
        "text-white"
    ]
};

function UserAvatar({ avatars }) {
    const { thumb, title, color, letter } = Object.assign(avatars['bx_if:avatars'].content, avatars['bx_if:letters'].content);
    return <View className="ring-2 ring-white dark:ring-gray-900 bg-gray-500/20 rounded-full overflow-hidden w-8 h-8">
                    { thumb.length ?
                        <View className="w-8 h-8" alt={title}>
                             <Image src={thumb} priority className="rounded-xl u-cover" view="cover"/>
                        </View>
                       : <View className="w-8 h-8 rounded-full" style={{ backgroundColor: `rgba(${color}`}}>
                          <Text className="text-2xl text-center">{letter.toString()}</Text>
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
    return <View data-user-status={id} className={sClass + " absolute -bottom-0.5 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-gray-900 z-20"} title={title}></View>
}

function TalksListItem({ item }){
    const { id, updated, title } = item,
          { talk_type, icon, message } = item['bx_if:user'].content,
          { time } = item['bx_if:timer'].content;

    const { talk, selectTalk } = useContext(MessengerContext);

    //console.log('---- log -----', item, selectTalk)

    const textColor = talk ? styles.infoActiveText : styles.infoText;
    return <TouchableOpacity onPress={() => selectTalk(id)}>
                 <View className= { "max-h-full w-full flex flex-col " + ( talk === id ? 'bg-blue-600 hover:bg-blue-600' : '')}>
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
                                        <View className="flex-0 flex flex-row items-center truncate overflow-hidden leading-tight space-x-1">
                                            <Text className={ "font-bold whitespace-nowrap text-xs " + textColor } >{talk_type}:</Text>
                                            <Text className={ "overflow-hidden truncate w-full max-h-6 text-xs items-center flex " + textColor }>{truncateHTML(message, 40)}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                     </View>
                </View>
            </TouchableOpacity>
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
         { menuItem } = useContext(MessengerContext),
          handlerVisibility = () => setVisibility(!visible);

    return <View className="group relative justify-end flex flex-1 w-full whitespace-nowrap min-w-0 overflow-hidden">
             <View className="items-center flex flex-row justify-between text-gray-800 dark:text-gray-100 text-ellipsis overflow-hidden">
               <Text className={"ml-3 truncate text-xl lg:text-3xl font-bold text-gray-900 dark:text-gray-50 capitalize flex items-center" + ( visible ? 'hidden' : '' ) }>{menuItem}</Text>
               <SearchBox visible={visible}></SearchBox>
               <Button variant="text" endDecorator={ 'search' } onPress={handlerVisibility}/>
             </View>
         </View>
});

const TalkListItems = memo(function TalkListItems({ list, onLoadHistory }){
    const [active, setActive] = useState(0),
          [loading, setLoading] = useState(false),
          [talks, setTalks] = useState( list || []),
          { talk, menuItem } = useContext(MessengerContext),
          handlerActive = (id) => {
            if (typeof onLoadHistory === 'function')
                onLoadHistory(id);

            setActive(id);
          },
         loadListItems = async (menu, count) => {
            setLoading(true);
            const { data } = await fetcher('/api.php?r=bx_messenger/get_talks_list_json/&params=' + JSON.stringify({ group: menu, count }));
            if (typeof data !== 'undefined') {
                setLoading(false);
                if (count)
                    setTalks([...talks, ...data]);
                else
                    setTalks(data);
            }
         },
        renderListItem = ({ item }) => {
            const { id } = item;
            return <TalksListItem key={id} item={item} />
        },
        loadList = () => loadListItems(menuItem, talks?.length),
        keyExtractor = item => item?.id,
        flashListRef = useRef(null),
        init = useRef(false);

        useEffect(() => {
            loadListItems(menuItem, 0);
            //console.log('----- log use effect ------', talk, menuItem);
        }, [menuItem]);

    if (typeof talks === 'undefined' || loading)
        return <View className='m-2'><Loading/></View>;

    //console.log(' --- log generate talks list items ----');

    return !talks.length ? <Text className={"text-2xl text-white text-center"}>Empty</Text> :
        <UniList
            data={talks}
            renderItem={renderListItem}
            /*onEndReachedThreshold={1}
            onEndReached={loadList}
            */
            keyExtractor={keyExtractor}
            /*estimatedItemSize = {72}*/
            ListFooterComponent={
                loading && <View className='m-2'><Loading/></View>
            }
        />
});

export const TalksListColumn = ({ list, colWidth }) => {
    //console.log('------ log generate talks list column  ----', list, colWidth);

    return <View className={"h-full max-h-full overflow-hidden " + ( colWidth || 'w-full' ) } >
                <TalksList list={list} />
           </View>;
    /*onClickMenu={() => selectPanel(panel !== 'menu' && 'menu')}
    onShowMenu={() => selectPanel(panel !== 'menu' && 'menu')} onLoadHistory={handlerSelectTalk}*/
}

export default function TalksList(props) {
    const { menuItem, viewMenu } = useContext(MessengerContext);
    const [ menu, setView ] = useState(viewMenu);

    const handlerMenuClick = () => {
        setView((menu) => !menu);
    }

    useEffect(() => {
        setView(false);
    }, [menuItem]);

    //console.log('------ log generate talks list area ----', props, menu);

    return  <View className="h-full">
               <View className={"max-h-full flex w-full h-full flex-col relative" + (props.stylesName || "")}>
                   <View className="w-full p-2 flex items-center flex flex-row border-b border-bordercolornavbar dark:border-bordercolornavbar-dark">
                        <Button variant="custom" startDecorator="list" solid align="start" className="xl:hidden" onPress={ handlerMenuClick }/>
                        <TalksListHeader />
                   </View>
                   <View className="h-full max-h-full w-full overflow-y-auto scroll-smooth rounded-none min-h-0 flex-1">
                      <TalkListItems {...props} />
                   </View>
                   { menu && <WrappedTopMenu handlerMenuClick={ handlerMenuClick } /> }
                </View>
             </View>
}