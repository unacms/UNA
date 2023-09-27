import React, { useCallback, useState, useEffect, useMemo } from "react";
import { appSetting, deepEqual, getUnitModeBySource, parseUrl, parseQueryString, getURI  } from 'app/lib/util';
import { menuItemsByName } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { BlockByName, DataByName } from 'app/components/block'
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'

import { Platform } from 'react-native'
import { updateRightHeader } from 'app/lib/native-handlers';
import { useNavigation } from '@react-navigation/native';
import { fetcher } from 'app/lib/fetcher';

async function parseData(link) {
    let path = link;
    if (link.includes('?')){
        const urlObj = parseUrl(link); // Base URL is required if your URL is relative
        const queryString = urlObj.queryString;

        let obj= parseQueryString(urlObj.queryString)
        path = urlObj.path.replace('/', '');
        link = path + '&params[]=&params[]='+JSON.stringify(obj);

    }
    
    const sResponse = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + link);
    let settings = appSetting('layouts', path);
    return {data: sResponse.data, blocks : settings.blocks}
}

export default function PageLayout(props) {
    const isWeb = Platform.OS == 'web'
    const [pageData, setPageData] = useState({data: props.data, blocks: props.blocks});
    const [pageUrl, setPageUrl] = useState(props.data.url);

    const menuSettings = appSetting('menu_items', pageData.data.menu.object);

    useEffect(() => {
        async function fetchData() {
            if (pageUrl){
                const data = await parseData(pageUrl);
                setPageData(data);
            }
        }

        fetchData();
    }, [pageUrl]);     
   
    if (isWeb){
        const getHeader = useCallback(() => {
            let categories = DataByName(pageData.data, pageData.blocks.categories);
           
            const addButtons = menuSettings?.add?.map((button) => {
                let btn = <Button title={button.title} startDecorator={button.icon} variant="outline" rounded size="sm"/>;
                btn = button.link ? <Link href={button.link} >{btn}</Link> : btn
                return (
                    <View className="ml-2 " key={`add-${button.icon}`} >{btn}</View>
            )});
    
            return (
                <View className='bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-950 lg:bg-transparent lg:border-0'>
                    <Row className="lg:hidden flex-row gap-x-1 flex-none items-center justify-between h-16 border-b border-bdrnavbar dark:border-bdrnavbar-d ">
                        <Row className="items-center">
                        <View className="ml-4 "></View>
                            <Text className="text-2xl  mr-8 font-bold text-neutral-800 dark:text-neutral-200 leading-tight">{menuSettings?.name}</Text>
                        </Row> 
                        <Row className="pr-4">
                            {addButtons}
                        </Row>
                    </Row>
                    <View className="flex-row lg:flex-col ml-4 gap-x-2 lg:max-h-screen lg:overflow-scroll lg:fixed lg:top-24">
                        <Text className="text-2xl my-auto mx-5 font-bold text-neutral-800 dark:text-neutral-200 hidden lg:flex h-9">{menuSettings?.name}</Text>
                        <Row className='lg:hidden'>
                            {menuItemsByName(pageData.data.menu.object, pageData.data.menu.items, '').map((item, index) =>
                                <View key={index} className='py-2 items-center'> 
                                    <Link href={item.link} key={`menu-${index}`} alt={item.title}>
                                        <Pressable onPress={(event) => {
                                                setPageUrl(item.link);
                                                window.history.pushState({ }, '', item.link);
                                                event.preventDefault()
                                        }}>
                                            <Button fullWidth={true} variant= {pageUrl == item.link ? 'outline': "text"} rounded size='sm' title={item.title}   />
                                        </Pressable>
                                    </Link>
                                </View>
                            )}
                        </Row>
                        <View className='hidden lg:block'>
                            {menuItemsByName(pageData.data.menu.object, pageData.data.menu.items, '').map((item, index) =>
                                    <Link href={item.link} key={`menu-${index}`} alt={item.title}>
                                        <Pressable onPress={(event) => {
                                            setPageUrl(item.link);
                                            window.history.pushState({ }, '', item.link);
                                            event.preventDefault()
                                        }}>
                                            <Button
                                                variant="text"
                                                size="lg"
                                                fullWidth
                                                title = {item.title}
                                                align="start"
                                            />
                                        </Pressable>
                                    </Link>
                            )}
                        </View>
                        <View className='ml-4 hidden lg:block'>
                            {categories?.content[0]?.data && categories.content[0].data.map((item, index) =>
                                <Link href={item.url} key={`menu-${index}`} alt={item.name}>
                                    <Pressable onPress={(event) => {
                                        setPageUrl(item.url);
                                        window.history.pushState({ }, '', item.url);
                                        event.preventDefault()
                                    }}>
                                        <Button
                                            variant="text"
                                            size="lg"
                                            fullWidth
                                            title = {item.name+ ' (' + item.num + ')'}
                                            align="start"
                                        />
                                    </Pressable>
                                </Link>
                            )}
                        </View>
                    </View>
                </View>
            )
        }, [pageUrl]);
    
        const Content = useMemo(() => {
            return  <View className={appSetting('layout', 'max_width') + ' mx-auto w-full'}>
            <View className="lg:flex-row">
                <View className='w-full lg:w-1/6 lg:my-4 fixed lg:relative top-0 z-50 '>
                    {getHeader()}
                </View>
                <View className='w-full lg:w-5/6 my-4 mt-32 lg:mt-4'>
                    <BlockByName data={pageData.data} name={pageData.blocks.browse} />
                </View>
            </View>
        </View>
        }, [pageData]); 

        return Content;
    }
    else{

        const MenuNative = () => {
            const navigation = useNavigation();
            useEffect(() => {
                if (!isWeb){   
                    updateRightHeader(menuSettings?.add, navigation);
                }
            }, []);
    
    
            return ( <Row className='lg:hidden w-full'>
                {menuItemsByName(pageData.data.menu.object, pageData.data.menu.items, '').map((item, index) =>
                    <View key={index} className='py-2 items-center'> 
                            <Pressable onPress={(event) => {
                                setPageUrl(item.link);
                                event.preventDefault()
                            }}>
                                <Button  variant={pageUrl == item.link ? 'primary': "text"} rounded size='sm' title={item.title}   />
                            </Pressable>
                    </View>
                )}
            </Row>)
        }

        const Content = useCallback(({ pageData }) => <View className='w-full flex-1'>
        <BlockByName contentContainerStyle={{ paddingTop: 60, paddingBottom:20 }} data={pageData.data} name={pageData.blocks.browse} />
        <View className='absolute  h-14 top-0 w-full z-50'>
            <View className='w-full h-14 bg-white dark:bg-neutral-900 pt-1'>
                <ScrollView  horizontal={true} className=" ml-4">
                    <MenuNative {...props}/>
                </ScrollView>
            </View>
        </View>
    </View>, [pageData]);

        /*const Content = useMemo(() => {
            return  <View className='w-full flex-1'>
                <BlockByName contentContainerStyle={{ paddingTop: 60, paddingBottom:20 }} data={pageData.data} name={pageData.blocks.browse} />
                <View className='absolute  h-14 top-0 w-full z-50'>
                    <View className='w-full h-14 bg-white dark:bg-neutral-900 pt-1'>
                        <ScrollView  horizontal={true} className=" ml-4">
                            <MenuNative {...props}/>
                        </ScrollView>
                    </View>
                </View>
            </View>
        }, [pageData]);*/

        return <Content pageData={pageData}/>;
    }
}
