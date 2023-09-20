import { View } from 'app/design/view';
import { Text } from 'app/design/typography'
import Image from 'app/ui/atoms/image';
import Loading from 'app/ui/atoms/loading'
import { Button, InputRounded } from 'app/design/controls';
import {useState, memo, useContext, useCallback, useMemo, useEffect} from 'react';
import { fetcher } from "../../../lib/fetcher";
import {MenuData, PageData} from './context/messenger-сontext';
import { WrappedTopMenu } from "./menu";
import UniList from 'app/ui/atoms/unilist';
import { ListFeed } from 'app/components/units/convos-feeds';
import {isDesktop, isPhone} from "./grid-utils";
import useConvos from "./hooks/useConvos";
import {stripTags} from "../../../lib/util";
import {getSkeleton} from "../../../lib/skeleton-helpers";

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
    const { handlerSelectConvo, mode, selectPanel } = useContext(PageData);
    return <ListFeed { ...item } onPress={() => {
        handlerSelectConvo(item);
        if (isPhone(mode))
            selectPanel('history');
    }} />;
});

function SearchBox(props){
    const { visible } = props,
          sHidden = !visible ? 'hidden' : '';

    return <View className={"flex flex-row flex-1 px-2 " + sHidden}>
                <InputRounded placeholder={"Search messages..."} className="px-2" />
           </View>
}

const ConvosListHeader = memo(({ menuItem, onClickMenu }) => {
    const [visible, setVisibility] = useState(false),
          handlerVisibility = () => setVisibility((visible) => !visible);

    return <View className="group relative w-full whitespace-nowrap min-w-0 items-center
                            flex flex-row justify-between text-neutral-800 dark:text-neutral-100 text-ellipsis overflow-hidden">
            <View className="xl:hidden"><Button variant="outline" startDecorator="List" rounded align="start" onPress={ onClickMenu } /></View>
            <Text className={"ml-2 truncate text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-50 capitalize flex items-center " + ( visible ? 'hidden' : '' ) }>{menuItem}</Text>
            <SearchBox visible={visible} />
            <Button variant="outline" startDecorator="search" rounded align="start" onPress={handlerVisibility}/>
           </View>
});

const Convos = memo(({ menuItem, onSelect, height }) => {
    const { status, isFetchingNextPage, hasNextPage, isLoading, error, fetchNextPage, data: convosList } = useConvos(menuItem);

    const handleEndReached = () => {
        if (!isFetchingNextPage && hasNextPage) {
            fetchNextPage();
        }
    }

    useEffect(() => {
        if (status === 'success' && convosList.length) {
            onSelect(convosList[0], false);
        }

    }, [status, menuItem]);

    if (isLoading)
        return getSkeleton('notifications');

    if (error)
        return <View className='m-2'><Text>{error}</Text></View>;

    const renderItem = ({ item, index }) => <ListFeed key={item.id} { ...item } onPress={() => onSelect(item)} />,
          keyExtractor = (item) => item.id;

    return !convosList.length ? <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 capitalize p-4 w-full text-center">Empty</Text> :
                 <UniList
                    data={ convosList }
                    /*firstItemIndex={0}
                    initialTopMostItemIndex={0}*/
                    renderItem={ renderItem }
                    /*onEndReachedThreshold={ 0 }*/
                    onEndReached = { handleEndReached }
                    totalCount={ convosList.length }
                    keyExtractor={ keyExtractor }
                    defaultItemHeight={ 72 }
                    height={ height - 48 }
                    ListFooterComponent = {
                        hasNextPage && isFetchingNextPage && getSkeleton('feed')
                    }
                />
});

export const ConvosList = () => {
    const { menuItem, menuView, setMenuView } = useContext(MenuData),
          //route = useRouter(),
          { screenMode, pageHeight, setConvoItem, convoInfo } = useContext(PageData),
          handlerMenuClick = useCallback(() => setMenuView(viewMenu => !viewMenu), []),
          handlerSelectConvo = useCallback((convoItem, bManually = true) => {
                                                                               setConvoItem({ item: convoItem, manually: bManually });

                                                                            }, []),
         bAllowViewOnDevice = useMemo(() => !isDesktop(screenMode), [screenMode]),
         handlerOuterClick = () => menuView && setMenuView(false);

   return <View className="max-h-full flex w-full h-full flex-col relative">
            <View className="w-full px-4 flex items-center flex flex-row gap-x-2 border-b border-bdrnavbar dark:border-bdrnavbar-d h-14">
               <ConvosListHeader menuItem={ menuItem } onClickMenu={ handlerMenuClick }/>
            </View>
            <Convos menuItem={ menuItem } height={pageHeight} onSelect={handlerSelectConvo} />
            { menuView && bAllowViewOnDevice && <WrappedTopMenu onClick={ handlerOuterClick }/> }
          </View>
};