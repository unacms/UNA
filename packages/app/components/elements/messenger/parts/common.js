import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import React, { memo, useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { appSetting } from 'app/lib/util'
import UniList from 'app/ui/atoms/unilist'
import { Button, InputRounded, InputRoundedSmall  } from 'app/design/controls'
import Form from 'app/components/elements/form';
import { Keyboard } from 'react-native'
import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'
import useSWR from "swr";
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';
import { KeyboardAvoidingView } from 'react-native';
import ItemConvo from 'app/components/elements/messenger/parts/item-convo';
import ItemJot from 'app/components/elements/messenger/parts/item-jot';
import { useTheme } from '@react-navigation/native';
import { Nav2 } from 'app/components/elements/messenger/parts/nav';
import { linkedText } from 'app/lib/text-helpers';
import CreateConvo, { CreateConvoButton } from 'app/components/elements/messenger/parts/new-convo';
import Msg from 'app/ui/molecules/msg';
import { BottomSheetData } from 'app/context/bottomsheet';
import Profile from 'app/ui/molecules/profile'

export default function ({ defaultConvoId, selectedMenu, convos, layoutHeight, fetchConvos, data, onSave }) {
    const isWeb = Platform.OS == 'web'
    const { width, height } = useWindowDimensions();

    //console.log('menu', selectedMenu, convos, props.defaultConvoId);
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);
    const [convoId, setConvoId] = useState(defaultConvoId);
    const [jots, setJots] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(width < 768);
    const [panelsVisible, setPanelsVisible] = useState({ convos: true, jots: isSmallScreen ? false : true });
    const [commentForm, setCommentForm] = useState(false);
    const [jotUpdated, setJotUpdated] = useState(false);
    const [formHeight, setFormHeight] = useState(96);
    const [showMsg, setShowMsg] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    
    const refListConvos = useRef();
    const refListJots = useRef();
    const selectedConvoIndex = convos?.data && convoId ? convos.data.findIndex(item => item.id === convoId) : -1;
    const selectedConvo = convos?.data ? convos.data[selectedConvoIndex] : false;
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [searchValue, setSearchValue] = useState('');
    const [replyItem, setReplyItem] = useState(false);

    const layoutHeightLeft = layoutHeight;
    const layoutHeightRight = isWeb ? layoutHeight - 48 - formHeight : layoutHeight - formHeight;

    let { data: dynamicData, error } = useSWR(
        commentForm ? ['/api.php?r=bx_messenger/get_send_form/Services&params=' + JSON.stringify({ id: selectedConvo.id, convo_id: selectedConvo.id, reply_id: replyItem ? replyItem.id : 0 }), '', commentForm] : null,
        fetcher,
        !true ? undefined : {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );

    useEffect(() => {
        setReplyItem(false);
        setCommentForm(false);
        if (dynamicData?.data?.jot_id > 0)
            scrolTo();
    }, [dynamicData]);

   

    const handleSearch = async (sValue) => {
        setSearchValue(sValue);
    }

    useEffect(() => {   
        fetchConvos(searchValue);
        if (convos.data.length > 0)
            setConvoId(convos.data[0].id);
    }, [searchValue]);

    const fetchItems = async (convoId, isAddJots) => {
        let start = 0;

        if (jots?.data?.params?.limit && isAddJots)
            start = jots?.data?.params?.start + jots?.data?.params?.limit;

        let request_url = '/api.php?r=bx_messenger/get_convo_messages/Services&params=' + JSON.stringify({ lot: convoId, jot: 0, start: start });
        const sResponse = await fetcher(request_url);

        setJots(prevJots => ({
            ...prevJots,
            data: {
                params: sResponse.data.params,
                jots: prevJots && isAddJots ? [...sResponse.data.jots, ...prevJots?.data?.jots] : sResponse.data.jots
            },
            index: prevJots && isAddJots ? prevJots.index : 0
        }));
    }

    const updateState = () => {
        if (!isWeb)
            return;
        if (selectedMenu && selectedConvo) {
            window.history.pushState(null, null, "/messenger/" + selectedMenu + '/' + selectedConvo.id + '/');
        }
    }

    useEffect(() => {
        setIsSmallScreen(width < 768);
    }, [width]);


    useEffect(() => {
        setConvoId(defaultConvoId);
    }, [selectedMenu, defaultConvoId]);

    useEffect(() => {
        if (selectedConvo) {
            fetchItems(selectedConvo.id, false);
            updateState()
            subscribe('bx_messenger', 'convo_' + selectedConvo.id, onNewMessage);
            subscribe('bx_messenger', 'profile_' + currentUser.id, onCheckConvos);

        }
    }, [convoId]);


    useEffect(() => {
        setPanelsVisible({ convos: true, jots: isSmallScreen ? false : true });
    }, [isSmallScreen]);


    useEffect(() => {
        if (convoId == '' && convos) {

            setConvoId(convos?.data[0]?.id);
        }
    }, [convos]);

    const onNewMessage = (data) => {
        if (data.id == convoId) {
            setJotUpdated(data);
        }
    }

    const onCheckConvos = (data) => {
        if (convoId != data.id) {
            fetchConvos();
        }
    }

    const scrolTo = () => {
        if (refListJots && refListJots?.current ) {
            let offset = 0;
            if (selectedConvo.unread > 0)
                offset = selectedConvo.unread - 1;
            if (isWeb){
                console.log('-----------------', jots.data?.jots?.length, offset, jots?.data?.params?.start)
                //offset
               // if (jots?.data?.params?.start == 0){
                    console.log("scrooll", jots.data?.jots?.length)
                    setTimeout(() => {
                        refListJots.current.scrollToIndex({ animated: false, align: "end", behavior: "smooth", index: 9999999999 });
                    }, 100);
                   
              //  }
            }
            else {
                //console.log('-----------------', jots.data?.jots?.length - offset - 1)
                //refListJots.current.scrollToEnd();
            }
        }

    }

    useEffect(() => {
        if (jotUpdated) {
            if (jotUpdated.action == 'added') {
                setJots(prevJots => ({
                    ...prevJots,
                    data: {
                        ...prevJots.data,
                        jots: [...prevJots.data.jots, ...jotUpdated.data.jots]
                    }
                }));
            }
            if (jotUpdated.action == 'edited') {
                let newJots = jots.data.jots.map(item => item.id === jotUpdated.data.jots[0].id ? jotUpdated.data.jots[0] : item);
                setJots(prevJots => ({
                    ...prevJots,
                    data: {
                        ...prevJots.data,
                        jots: newJots
                    }
                }));
            }
            if (jotUpdated.action == 'deleted') {
                let idToRemove = jotUpdated.data; // The id of the item you want to remove

                let newJots = jots.data.jots.filter(item => item.id !== idToRemove);
                setJots(prevJots => ({
                    ...prevJots,
                    data: {
                        ...prevJots.data,
                        jots: newJots
                    },
                    index: 0
                }));
            }

        }
    }, [jotUpdated]);

    useEffect(() => {
        if (jots?.index == 0) {
            scrolTo();
        }
    }, [refListJots?.current]);//selectedConvo refListJots?.current, jots?.index
    console.log("refListJots?.current", selectedConvo)
    const changeConvo = (convo) => {
        setConvoId(convo.id);
        if (isSmallScreen)
            setPanelsVisible({ convos: false, jots: true })
    }

    const showConvo = () => {
        setPanelsVisible({ convos: true, jots: false })
    }

    const deleteConvo = async () => {
        let request_url = '/api.php?r=bx_messenger/delete_convo/Services&params=' + JSON.stringify({ lot: selectedConvo.id2 });
        const sResponse = await fetcher(request_url);
        if (sResponse.data?.message) {
            setShowMsg(sResponse.data?.message)
        }
        else {
            fetchConvos();
            setConvoId(convos.data[0].id);
        }
    }

    const leaveConvo = async () => {
        let request_url = '/api.php?r=bx_messenger/leave_convo/Services&params=' + JSON.stringify({ lot: selectedConvo.id2 });
        const sResponse = await fetcher(request_url);
        if (sResponse.data?.message) {
            setShowMsg(sResponse.data?.message)
        }
        else {
            fetchConvos();
            setConvoId(convos.data[0].id);
        }
    }
    const getConvo = async () => {
        let request_url = '/api.php?r=bx_messenger/get_convo/Services&params=' + JSON.stringify({ lot: selectedConvo.id2 });
        const sResponse = await fetcher(request_url);
        if (sResponse.data?.message) {
            setShowMsg(sResponse.data?.message)
        }
        else {
            const content = (<View className='items-center justify-center'>
                <Row className='mb-4 gap-x-4'>
                    <Profile {...sResponse.data.lot.author_data}  />
                    <View>
                        <Text>Participants: {sResponse.data.lot.parts}</Text>
                        <Text>Messages: {sResponse.data.lot.messages}</Text>
                        <Text>Files: {sResponse.data.lot.files}</Text>
                    </View>
                </Row>
            </View>)
            setBottomSheetData({ title: 'Conversation info', content: content, showClose: true, snapPoints: ['25%', '50%'] });
            
        }
    }

    const onSaveHandler = (data) => {
        setBottomSheetData(false);
        onSave(data);
    }

    const editConvo = async () => {
        let request_url = '/api.php?r=bx_messenger/get_parts_list/Services&params=' + JSON.stringify({ lot: selectedConvo.id2 });
        const sResponse = await fetcher(request_url);
        setBottomSheetData({ title: 'Add users to start messaging', content: <CreateConvo onSave={onSaveHandler} initedData={sResponse.data} convoId={selectedConvo.id2} />, showClose: true, snapPoints: ['25%', '50%'] });   
    }
    
    const onFormSubmit = (formData, d) => {
        setCommentForm(formData);
        Keyboard.dismiss();
    }

    const handleLayout = (event) => {
        setFormHeight(event.nativeEvent.layout.height + 16)
    };

    const handleReply = (item) => {
        setReplyItem(item)
    };

    const handleCancelReply = (item) => {
        setReplyItem(false)
    };

    const handleStartReached = () => {
        if (selectedConvo)
            fetchItems(selectedConvo.id, true);
    };

    const convosComponent = panelsVisible.convos && <Convos
        layoutHeightLeft={layoutHeightLeft}
        data={convos?.data}
        refListConvos={refListConvos}
        selectedConvoIndex={selectedConvoIndex}
        changeConvo={changeConvo}
        handleSearch={handleSearch}
        searchValue={searchValue}
        onSave={onSave}
    />

    const jotsComponent = (panelsVisible.jots && selectedConvo && jots?.data?.jots) && <View className={' w-full md:w-3/5 h-full flex-1 bg-bgrcard dark:bg-bgrcard-d'}>
        <View className='flex-1 flex-auto'>
            <Jots
                isSmallScreen={isSmallScreen}
                title={selectedConvo.title}
                layoutHeightRight={layoutHeightRight}
                data={jots?.data?.jots}
                refListJots={refListJots}
                showConvo={showConvo}
                deleteConvo={deleteConvo}
                leaveConvo={leaveConvo}
                getConvo={getConvo}
                editConvo={editConvo}
                handleReply={handleReply}
                startReached={handleStartReached}
            />
        </View>
        <FormContainer
            form={data.form}
            formHeight={formHeight}
            replyItem={replyItem}
            onFormSubmit={onFormSubmit}
            handleCancelReply={handleCancelReply}
            handleLayout={handleLayout}
        />
    </View>

    if (!isWeb) {
        return (
            <View style={{ height: layoutHeight }} className={appSetting('layout', 'max_width') + ' mx-auto w-full h-full items-stretch flex-1'}>
                <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
                {convosComponent}
                {jotsComponent}
                <Nav2 text={panelsVisible.convos ? "Messenger" : selectedConvo.title} onPress={showConvo} backButton={!panelsVisible.convos} />
            </View>
        );
    }

    return (
        <View style={{ height: layoutHeight }} className={appSetting('layout', 'max_width') + ' mx-auto xl:border-x border-bdr dark:border-bdr-d w-full items-stretch bg-bgrcard dark:bg-bgrcard-d'}>
            <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
            <Row className='items-stretch '>
                {convosComponent}
                {jotsComponent}
            </Row>
        </View>
    );
}

const Convos = memo(({ layoutHeightLeft, data, refListConvos, selectedConvoIndex, changeConvo, onSave, searchValue, handleSearch }) => {
    return data.length > 0 ? <View style={{ height: layoutHeightLeft }} className={' w-full bg-bgrcard dark:bg-bgrcard-d md:w-2/5  border-bdr dark:border-bdr-d border-r'}>
        {data.length > 0 && <>
        
            <Row  className='py-2 px-3 border-b border-bdr dark:border-bdr-d'>
        <InputRounded name="search" placeholder={("Search") + '...'}   value={searchValue}  onChangeText={(value) => handleSearch(value)} />
    </Row><UniList
            refer={refListConvos}
            height={layoutHeightLeft}

            data={data}
            renderItem={({ item, index }) => <ItemConvo selectedIndex={selectedConvoIndex} item={item} index={index} changeConvo={changeConvo} />}
        /></>}
    </View> : <View className='items-center justify-center w-full h-full'><View className="pt-8">
        <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto  py-4 px-8  items-center rounded-2xl  bg-neutral-500/10 ">
            <View className="flex-col mx-auto  text-neutral-800 dark:text-neutral-200 ">
                <Text className="text-center text-lg text-neutral-800 dark:text-neutral-200 lg:text-xl font-semibold  ">
                    Bla bla bal
                </Text>
            </View>
            <CreateConvoButton variant='full' onSave={onSave} />
        </View>
    </View></View>
});
/*bg-neutral-500/10 border-b border-neutral-500/10*/
const Jots = memo(({ isSmallScreen, title, layoutHeightRight, data, refListJots, showConvo, deleteConvo, leaveConvo, getConvo, editConvo, handleReply, startReached }) => {
    const isWeb = Platform.OS == 'web'
    return (<>
        <View className='md:px-0 border-bdrcard dark:border-bdrcard-d border-b'>
            {isWeb && <Row className='px-4 py-3 items-center justify-between w-full'>
                <Row className='items-center justify-start '>           
                    {isSmallScreen && <Button variant="text" startDecorator='ArrowLeft' rounded align="start" onPress={() => showConvo()} />}
                    <Text className="text-lg lg:text-xl font-bold font-bold tracking-tight  text-neutral-900 dark:text-neutral-50">{title}</Text>
                </Row>
                <Row className='items-center gap-x-2 '>
                    <Button buttonTooltip="Edit participants list" startDecorator="Users" variant="outline" rounded size="sm" onPress={() => editConvo()} />
                    <Button buttonTooltip="Leave" startDecorator="SignOut" variant="outline" rounded size="sm"  onPress={() => leaveConvo()} />
                    <Button buttonTooltip="Delete" startDecorator='Trash' variant="outline" rounded size="sm" onPress={() => deleteConvo()} />
                    <Button buttonTooltip="Info" startDecorator='Info' variant="outline" rounded size="sm" onPress={() => getConvo()} />
                </Row>
            </Row>}
        </View>
        <View style={{ height: layoutHeightRight }} className='m-2'>
            {data.length > 0 && <UniList
                refer={refListJots}
                {...(Platform.OS !== 'web' ? { inverted: true } : {})}
                overscan={900}
                startReached={isWeb ? startReached : null}
                onEndReached={!isWeb ? startReached : null}
                scrollToLastItem={true}
                data={isWeb ? data : data.slice().reverse()}
                height={layoutHeightRight}
              
                useWindowScroll
                renderItem={({ item, index }) => <ItemJot handleReply={handleReply} item={item} index={index} />}
            />}
        </View>
    </>);
});

const FormContainer = memo(({ form, replyItem, onFormSubmit, handleCancelReply, handleLayout }) => {
    let padding = 8;
    const { colors } = useTheme();
    return (
        <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
            <View className='bg-bgrcard dark:bg-bgrcard-d border-t border-bdr dark:border-bdr-d' onLayout={handleLayout} style={{ backgroundColor: colors.barsBackground, paddingTop: padding, paddingBottom: padding }}>
                <View className=' ' >
                    {
                        replyItem && (<View className='bg-bgrcard dark:bg-bgrcard-d rounded-sm border-l-2 border-primary/50 py-1 pl-2 mt-2 mx-2'>
                            <Row className='items-start justify-between max-w-full relative'>
                                <View className=' flex-auto pr-4'>
                                    <Row className='max-w-full '>
                                        <Text className='text-xs text-neutral-900 dark:text-neutral-50'>Reply to: </Text>
                                        <Text className='font-semibold text-xs text-neutral-900 dark:text-neutral-50'>{replyItem.author_data.display_name}</Text>
                                    </Row>
                                    <Text className='text-sm overflow-hidden text-neutral-900 dark:text-neutral-50' numberOfLines={3}>{linkedText(replyItem.message, "hover:text-linkhover")}</Text>
                                </View>
                                <View className=" right-0 t-0">
                                    <Button align="start" rounded startDecorator="X" size="xs" variant="outline" onPress={() => handleCancelReply()} />
                                </View>
                            </Row>
                        </View>)
                    }
                    <Form {...form} name='bx_messenger' resetOnSubmit={true} classContainerName={" flex-row flex-wrap w-full items-start justify-between"} onFormSubmit={onFormSubmit} />
                </View>
            </View>
        </KeyboardAvoidingView>
    )
});