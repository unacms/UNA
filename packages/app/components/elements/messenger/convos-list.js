import { View} from 'app/design/view';
import { Text } from 'app/design/typography'
import Image from 'app/ui/atoms/image';
import Loading from 'app/ui/atoms/loading'
import { Button, InputRounded } from 'app/design/controls';
import React, { useState, memo, useContext } from 'react';
import { fetcher } from "../../../lib/fetcher";
import MessengerContext from './messenger-сontext';
import {WrappedTopMenu} from "./menu";
import UniList from 'app/ui/atoms/unilist';
import { useInfiniteQuery } from  '@tanstack/react-query';
import { ListFeed } from 'app/components/units/convos-feeds';

const styles = {
    infoText: [
       "text-neutral-600 dark:text-neutral-400"
    ],
    infoActiveText: [
        "text-white"
    ]
};

function UserAvatar({ avatars }) {
    const { thumb, title, color, letter } = Object.assign(avatars['bx_if:avatars'].content, avatars['bx_if:letters'].content);
    return <View className="ring-2 ring-white dark:ring-neutral-900 bg-neutral-500/20 rounded-full overflow-hidden w-8 h-8">
                    { thumb.length ?
                        <View className="w-8 h-8" alt={title}>
                            <Image src={thumb} priority className="rounded-xl u-cover" view="cover"/>
                        </View> : <View className="w-8 h-8 rounded-full" style={{ backgroundColor: `rgba(${color}`}}>
                            <Text className="text-2xl text-center">{letter.toString()}</Text>
                        </View>
                    }
            </View>
}

function ConvoParts({ parts }) {
    const oAvatar = avatars['bx_if:avatars'],
        oLetter = avatars['bx_if:letters'];

    return <View className="ring-2 ring-white dark:ring-neutral-900 bg-neutral-500/20 rounded-full overflow-hidden w-8 h-8">
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
    return <View data-user-status={id} className={sClass + " absolute -bottom-0.5 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-neutral-900 z-20"} title={title}></View>
}

const ConvoListItem = memo(({ item }) => {
    const { handlerSelectConvo } = useContext(MessengerContext);

    //console.log('---- log generate list item -----', item );

    return <ListFeed { ...item } onPress={() => handlerSelectConvo(item)} />;
});

function SearchBox(props){
    const { visible } = props,
          sHidden = !visible ? 'hidden' : '';

    return <View className={"flex flex-row flex-1 px-2 " + sHidden}>
                <InputRounded placeholder={"Search messages..."} className="px-2" />
           </View>
}

const ConvosListHeader = memo(({menu}) => {
    const [visible, setVisibility] = useState(false),
          handlerVisibility = () => setVisibility(!visible);

    //console.log('---- log generate header top menu ---');
    return <View className="group relative justify-end flex flex-1 w-full whitespace-nowrap min-w-0 overflow-hidden">
             <View className="items-center flex flex-row justify-between text-neutral-800 dark:text-neutral-100 text-ellipsis overflow-hidden">
               <Text className={"ml-2 truncate text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 capitalize flex items-center " + ( visible ? 'hidden' : '' ) }>{menu}</Text>
               <SearchBox visible={visible}></SearchBox>
               <Button variant="outline" startDecorator="search" rounded align="start" onPress={handlerVisibility}/>
             </View>
         </View>
});

const Convos = ({ list, onLoadHistory }) => {
    const { menuItem, height, handlerSetConvoItem, convo } = useContext(MessengerContext),
          sUrl = '/api.php?r=bx_messenger/get_convos_list_json/&params=';

    const fetchData = async({ pageParam = 0 }) => {
            const { data } =  await fetcher(sUrl + JSON.stringify({ group: menuItem, count: pageParam }));

            //console.log('---- log -- get talks list ---', data, convo);
            if (typeof handlerSetConvoItem === 'function' && data && data.length && !convo)
                handlerSetConvoItem(data[0]);

            return data || [];
        };

        const {
            status,
            data,
            error,
            fetchNextPage,
            hasNextPage,
            isFetchingNextPage,
            isLoading
        } = useInfiniteQuery(['get_convos_list_json', menuItem], fetchData, {
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            getNextPageParam: (lastPage, allPages) => {
                //console.log('---- log get next Params -----', lastPage, allPages);

                if (!lastPage || !lastPage.length || allPages[0].length !== lastPage.length)
                    return false;

                return lastPage.length * allPages.length;
            }
        });

    const handleEndReached = () => {
        //console.log('---- log reach ends ----', isFetchingNextPage, data);
        if (!isFetchingNextPage && hasNextPage) {
            //console.log('---- log get the next page  ----');
            fetchNextPage();
        }
    }

    if (isLoading)
        return <View className='m-2'><Loading/></View>;

    if (error)
        return <View className='m-2'><Text>{error}</Text></View>;

    const renderListItem = ({ item }) => <ConvoListItem key={ item.id } item={item} />,
          keyExtractor = (item) => item.id;

    const aList = data.pages.flatMap(page => page);

    //console.log(' --- log generate talks list items --- ', convo, menuItem, data, aList, status, isFetchingNextPage);
    return !aList.length ? <Text className="text-2xl text-white text-center">Empty</Text> :
            <UniList
                data={ data.pages.flatMap(page => page) }
                renderItem={ renderListItem }
                onEndReachedThreshold={ 0.8 }
                onEndReached = { handleEndReached }
                keyExtractor={ keyExtractor }
                height={ height - 48 }
                ListFooterComponent = {
                    hasNextPage && isFetchingNextPage && <View className='m-2'><Loading/></View>
                }
            />
};

export const ConvosListColumn = ({ list, colWidth }) => {
   //console.log('------ log generate talks list column  ----', list);

   return <View className={"h-full max-h-full overflow-hidden " + ( colWidth || 'w-full' ) } >
            <ConvosList list={list} />
          </View>;
}

export default function ConvosList(props) {
    const { menuItem, viewMenu, handlerMenuView } = useContext(MessengerContext);
   return <View className={"max-h-full flex w-full h-full flex-col relative" + (props.stylesName || "")}>
                <View className="w-full px-4 flex items-center flex flex-row gap-x-2 border-b border-bordercolornavbar dark:border-bordercolornavbar-dark h-14">
                     <View className="xl:hidden ">
                         <Button variant="outline" startDecorator="List" rounded align="start" onPress={ handlerMenuView }/>
                     </View>
                     <ConvosListHeader menu={menuItem} />
                </View>
                <Convos {...props} />
                { viewMenu && <WrappedTopMenu /> }
          </View>
}